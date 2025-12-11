from django.shortcuts import render
from django.http import JsonResponse , HttpResponse
import pdb , json , pandas as pd
from rest_framework.response import Response
import openpyxl
from datetime import datetime
from .convert_monthly_file import transFormInputFile
from .models import *
import numpy as np
from .create_engine import engine
import numpy as np
from .telemtery_dashboard import *
from .state_excels import *
from .gen_letter import *
from .rtu_notreporting import *
from .generatePDFRTU import *
from .extradb_errors import extractdb_errormsg
from django.views.decorators.csrf import csrf_exempt
from .models import ScadaPointNameMapping,ScadaPointNameMappingHistory
from django.db import transaction
from .IntraState import *
from django.views.decorators.http import require_POST
from .Digital import *


# Create your views here.
file_names_dict = {
    'AP_Station' : 'AP' ,
    'CS_RE_Station' : 'CS_RE' ,
    'CS_REMC_Station' : 'CS_REMC' ,
    'CS_Station' : 'CS' ,
    'KA_Station' : 'KA' ,
    'KL_Station' : 'KL' ,
    'PY_Station' : 'PY' ,
    'SR1_Station': 'SR1' ,
    'SR2_Station': 'SR2' ,
    'TN_Station' : 'TN' ,
    'TG_Station' : 'TG' ,
    'TL_Station' : 'TL' 
}

month_dict = {
    1 : 'January' ,
    2 : 'February' ,
    3 : 'March' ,
    4 : 'April' ,
    5 : 'May' ,
    6 : 'June' ,
    7 : 'July' ,
    8 : 'August' ,
    9 : 'September' ,
    10 : 'October' ,
    11 : 'November' ,
    12 : 'December' 
}

indianStatesWithICCP = ('AP' ,'TG' ,'KA' ,'KL' ,'TN' ,'PY','SR1','SR2' )
metric_types_exclude = ['KV','HZ','MW' ,'MVAR' ,'OLTC']

def process_and_dump(station_name, station_df ,current_month,prev_month , MONTHYEARID, CATEGORY ):
    try:     
        if station_df.empty:
            return "Done"

        if station_name.strip().lower() == 'station_summary':
            station_df['Category'] = CATEGORY
            station_df.rename(columns = {current_month+'_Completely_Not_Reporting_Points' : 'Completely_Not_Reporting_Points',prev_month+'_Completely_Not_Reporting_Points' : 'Completely_Not_Reporting_Points_PrevMonth' ,'Substation_Name':'Substation'} , inplace = True)

            table_name = HistoryScadaMonthSummary
            table_name_str = 'History_SCADA_Month_Summary'
            
        else:
            station_df['Approved_Status'] = 'Waiting for Approval'
            station_df['Substation'] = station_name
            station_df = station_df.replace({np.nan : None})
            station_df.rename(columns = {current_month+'_Non_Availability_Percentage' : 'Non_Availability_Percentage',prev_month+'_Non_Availability_Percentage' : 'Non_Availability_Percentage_PrevMonth' } , inplace = True)
        
            table_name = HistoryScadaPointSummary
            table_name_str = 'History_SCADA_Point_Summary'

        
        excelStatus = 'Done'
        # first delete already existing rows
        table_name.objects.filter(monthyearid=MONTHYEARID,substation__in=station_df['Substation'].unique()).delete()
        # for substation in station_df['Substation'].unique():
        #     table_name.objects.filter(monthyearid=MONTHYEARID,substation=substation).delete()

        # Some Points are added in Input file but not in Master Table then Ignore those Stations
        # merged_df = station_df.copy()
        # merged_df['MonthYearID'] = MONTHYEARID
        # # Get the unique Substation and MonthNum values from the DataFrame
        # unique_values = merged_df[['Substation', 'MonthYearID']].drop_duplicates()

        # now State column not required can drop safely
        if table_name_str == 'History_SCADA_Point_Summary':
            station_df.drop('State' , axis = 1, inplace = True)
        try:
            station_df.to_sql(
                    name=table_name_str,         # Name of the target table
                    con=engine,                   # SQLAlchemy connection object
                    schema='public',               # Schema (optional, default is 'public')
                    if_exists='append',           # How to behave if the table already exists ('replace', 'append', 'fail')
                    index=False,                   # Whether to write the DataFrame index as a column
                    method='multi'                 # Optimizes insertion for bulk writes
                )
        except Exception as e:
            extractdb_errormsg(e)
            # record may already exists , duplicate entry
            return str(e)
        
        return excelStatus
    except Exception as e:
        extractdb_errormsg(e)
        return str(e)
    
def adminFileBulkImport(request):
    try:
        formdata = request.POST
        # Get the uploaded file
        excel_files = request.FILES.getlist('files')
        global file_names_dict
        error_log = []
        try:
            from datetime import datetime
            MONTHYEARID = formdata['monthyearid']
            MONTH_NUM = formdata['monthnum']
            MONTH_NAME = formdata['monthname']
            YEAR = formdata['year']
            CATEGORY = formdata['category']
            
            current_month = month_dict[int(MONTH_NUM)]
            prev_month_num = int(MONTH_NUM) - 1
            prev_month = month_dict[12] if prev_month_num < 1 else month_dict[prev_month_num]
            
            sheet_columns_to_drop = ['Substation_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','No_of_Points']
            
            for ind_file in excel_files:
                try:
                    uploaded_file_name = ind_file.name.split('.')[0]
                    STATE = [value for key, value in file_names_dict.items() if key in uploaded_file_name][0]
                except Exception as e:
                    extractdb_errormsg(e)
                    error_log.append('Error occured in '+uploaded_file_name + str(e) + '\n')
                    continue
                
                # SCADA_POINT_df= pd.DataFrame(ScadaPointNameMapping.objects.filter(state = STATE).values("state" , "substation_name") )
                xls = pd.ExcelFile(ind_file)
                # Initialize an empty list to store dataframes
                filtered_dfs = {}
                # Process each sheet
                for sheet in xls.sheet_names:
                    df = xls.parse(sheet)  # Read the sheet
                    if "Station_Summary" not in sheet:
                        # Remove rows containing "Completely Not Reporting" or "Intermittent Data"
                        df_filtered = df[~df.apply(lambda row: row.astype(str).str.contains("Completely Not Reporting|Intermittent Data", case=False, na=False)).any(axis=1)]
                        #Remove duplicate rows from it
                        df_filtered = df_filtered.drop_duplicates().reset_index(drop=True)
                        df_filtered.columns = df_filtered.iloc[0]
                        df_filtered = df_filtered[1:].reset_index(drop=True)
                        df_filtered = df_filtered.drop(columns = sheet_columns_to_drop, errors='ignore')
                        if 'IOA' in df_filtered.columns :
                            # for Central generating Stations
                            df_filtered.rename(columns= {'IOA' :'ICCP_IOA'} , inplace= True)
                            df_filtered.drop(columns= 'ICCP_Name', inplace= True ,errors='ignore')

                        remarks_columns_drop = [cols for cols in df_filtered.columns if 'Remarks' in cols]
                        df_filtered.drop( columns= remarks_columns_drop , inplace=True , errors='ignore')
                    else:
                        # This section deals with Station_Summary Sheet
                        # Remove rows containing "Intermittently_Not_Reporting_Point" or "Intermittent Data"
                        columns_to_drop = [col for col in df.columns if 
                                            "Intermittently_Not_Reporting_Points" in col or 
                                            "No_of_Non_Reporting_Points" in col] + ['Voltage_Level']
                        df_filtered = df.drop(columns=columns_to_drop,errors='ignore')
                        # Identify the dynamic column (e.g., the one with "Completely_Not_Reporting_Points")
                        dynamic_col = [col for col in df_filtered.columns if "Completely_Not_Reporting_Points" in col ]
                        # Group by Substation_Name
                        df_filtered = df.groupby("Substation_Name", as_index=False).agg({
                            "No_of_Points": "sum",
                            **{col: "sum" for col in dynamic_col}
                        })
                        df_filtered.reset_index(drop=True, inplace=True)
                    # Append the filtered dataframe to the list
                    filtered_dfs[sheet] = df_filtered
                
                # Accessing specific sheets by name
                for station_name, station_df in filtered_dfs.items():
                    station_df['MonthYearID'] = MONTHYEARID
                    station_df['Month'] = int(MONTH_NUM)
                    station_df['Month_Name'] = MONTH_NAME
                    station_df['Year'] = int(YEAR)
                    station_df['State'] = STATE
                    station_df['Created_At'] = datetime.now()
                    # check_status = process_and_dump( station_name, station_df ,current_month,prev_month , MONTHYEARID , CATEGORY, SCADA_POINT_df)
                    error_status = process_and_dump( station_name, station_df ,current_month,prev_month , MONTHYEARID , CATEGORY)
                    if error_status != 'Done':
                        error_log.append('Error occured ' + error_status)
            
            return JsonResponse({'data': error_log}, safe=False)
        except Exception as e:
            print(e)
            extractdb_errormsg(e)
            error_log.append('Error occured ' + str(e) + '\n')
            return JsonResponse({'data': error_log}, status=400)
        
    except Exception as e:
        print(e)
        return JsonResponse( [str(e)],status=400 )
    


@require_POST
def ScadaPointsFileUpload(request):
    try:
        excel_files = request.FILES.getlist('file')  # must match frontend field name
        error_log = []
        success_count = 0

        if not excel_files:
            return JsonResponse({'status': False, 'message': 'No files uploaded'}, status=400)

        sheet_columns_to_drop = [
            'State', 'Sub Station', 'Substation Name', 'Voltage Level',
            'Element Description', 'Element Category', 'Metric Type',
            'Point Name', 'IOA', 'ICCP Name', 'Part Of Island Scheme',
            'OT Type', 'Sequence_ID','remc_element_type'
        ]
        #pdb.set_trace()
        model_fields = set(f.name for f in ScadaPointNameMappingHistory._meta.get_fields())
        #pdb.set_trace()
        for ind_file in excel_files:
            try:
                uploaded_file_name = ind_file.name.split('.')[0]
                


                # Detect state
                STATE = next((value for key, value in file_names_dict.items() if key in uploaded_file_name), None)
                if not STATE:
                    error_log.append(f'Could not find state for {uploaded_file_name}')
                    continue

                
                xls = pd.ExcelFile(ind_file)
              

                filtered_dfs = {}

                for sheet in xls.sheet_names:
                    df = xls.parse(sheet)

                    if sheet == "Sheet1":
                        df_filtered = df.drop(columns=sheet_columns_to_drop, errors='ignore')
                        df_filtered = df_filtered.dropna(how="all").drop_duplicates().reset_index(drop=True)
                    else:
                        df_filtered = df[~df.apply(
                            lambda row: row.astype(str).str.contains(
                                "Completely Not Reporting|Intermittent Data",
                                case=False, na=False
                            ), axis=1
                        )]
                        df_filtered = df_filtered.drop_duplicates().reset_index(drop=True)

                        if not df_filtered.empty:
                            df_filtered.columns = df_filtered.iloc[0]
                            df_filtered = df_filtered[1:].reset_index(drop=True)

                        df_filtered = df_filtered.drop(columns=sheet_columns_to_drop, errors='ignore')

                    df_filtered['State'] = STATE
                    filtered_dfs[sheet] = df_filtered

                # Insert data into DB
                with transaction.atomic():
                    for sheet_name, station_df in filtered_dfs.items():
                        if not station_df.empty:
                            records = station_df.to_dict(orient='records')
                            cleaned_records = [{k: v for k, v in rec.items() if k in model_fields} for rec in records]
                            objs = [ScadaPointNameMappingHistory(**rec) for rec in cleaned_records if rec]
                           
                            if objs:
                                ScadaPointNameMappingHistory.objects.bulk_create(objs, ignore_conflicts=True)
                                success_count += len(objs)
                            else:
                                error_log.append(f"No valid records in sheet {sheet_name} of {ind_file.name}")

            except Exception as e:
                error_log.append(f'Error processing file {ind_file.name}: {str(e)}')

        return JsonResponse({'status': True, 'inserted': success_count, 'errors': error_log})

    except Exception as e:
        return JsonResponse({'status': False, 'error': str(e)}, status=400)


# def statesSCADAMonthSummary(request):
#     try:
#         formdata = json.loads(request.body)
#         monthyearid = formdata['monthyearid']
#         state = formdata['indianState']
#         ot_type = formdata['systemType']
        
        
#         if formdata['category'] == 'ANALOG' :
#             if ot_type == 'SCADA':
#                 table_qry = HistoryScadaMonthSummary.objects.filter(monthyearid = monthyearid ,category = formdata['category'] , state = state , ot_type = ot_type )
#             else:
#                 table_qry = HistoryScadaMonthSummary.objects.filter(monthyearid = monthyearid ,category = formdata['category'] , state = state , ot_type = ot_type , remc_element_type = 'all' )

#             scada_month_summary_df = pd.DataFrame( table_qry.order_by('substation').values('substation' , 'completely_not_reporting_points','no_of_points') , columns= ['substation' , 'completely_not_reporting_points','no_of_points'] )
#             # Use the helper function for Analog
#             rename_scada_columns(scada_month_summary_df, 'analog')

#         elif formdata['category'] == 'DIGITAL':
#             #  DIGITAL 
#             scada_month_summary_df = pd.DataFrame( HistoryScadaMonthSummaryDigital.objects.filter(monthyearid = monthyearid , state = state  ).order_by('substation').values('substation' , 'completely_not_reporting_points','no_of_points') , columns= ['substation' , 'completely_not_reporting_points','no_of_points'])
#             # Use the helper function for Analog
#             rename_scada_columns(scada_month_summary_df, 'digital')

#         elif formdata['category'] == 'ALL':
#             # 1. Fetch and Prepare Analog Data
#             if ot_type == 'SCADA':
#                 analog_qry = HistoryScadaMonthSummary.objects.filter(
#                     monthyearid=monthyearid, category='ANALOG', state=state, ot_type=ot_type
#                 )
#             else:
#                 analog_qry = HistoryScadaMonthSummary.objects.filter(
#                     monthyearid=monthyearid, category='ANALOG', state=state, ot_type=ot_type, remc_element_type='all'
#                 )
            
#             df_analog = pd.DataFrame(list(analog_qry.values('substation', 'completely_not_reporting_points', 'no_of_points')))
#             # Use the helper function for Analog
#             rename_scada_columns(df_analog, 'analog')
#             # 2. Fetch and Prepare Digital Data
#             digital_qry = HistoryScadaMonthSummaryDigital.objects.filter(monthyearid=monthyearid, state=state)
#             df_digital = pd.DataFrame(list(digital_qry.values('substation', 'completely_not_reporting_points', 'no_of_points')))
#             rename_scada_columns(df_digital, 'digital')
            
#             # 3. Merge DataFrames
#             if df_analog.empty and df_digital.empty:
#                 # Handle edge case where both are empty
#                 scada_month_summary_df = pd.DataFrame(columns=[
#                     'substation', 
#                     'analog_completely_not_reporting_points', 'analog_no_of_points',
#                     'digital_completely_not_reporting_points', 'digital_no_of_points'
#                 ])
#             else:
#                 # Merge on substation. 'outer' ensures we keep substations that appear in only one list.
#                 scada_month_summary_df = pd.merge(df_analog, df_digital, on='substation', how='outer')
#                 # Fill NaN values with 0 (e.g., if a substation has no digital points, it shows as 0 instead of NaN)
#                 scada_month_summary_df = scada_month_summary_df.fillna(0)

#         else:
#             return JsonResponse( ['Invalid category specified.'] , status=400 , safe=False)
        
#         scada_point_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = state , ot_type = ot_type ).values('Substation_Name','Voltage_Level') , columns= ['Substation_Name','Voltage_Level'])
       
#         scada_agg_result_df = scada_point_df.groupby("Substation_Name")["Voltage_Level"].max()
#         # filter if Voltage_Level is >220
#         scada_agg_result_df = scada_agg_result_df[scada_agg_result_df >= 220].reset_index()
#         # change how = 'outer' to get all voltage levels , only 220 and above keep 'inner'
#         merged_df = pd.merge(scada_month_summary_df , scada_agg_result_df , left_on = 'substation' , right_on = 'Substation_Name' , how = 'inner')
#         if formdata['category'] == 'ANALOG' :
#             merged_df['analog_percentage_number_of_points_non_reporting'] = merged_df.apply(
#                     lambda x: round(min((x['analog_completely_not_reporting_points'] / x['analog_no_of_points']) * 100, 100) ,2)  if x['analog_no_of_points'] != 0 else 0,
#                     axis=1
#                 )
#         elif formdata['category'] == 'DIGITAL':
#             merged_df['digital_percentage_number_of_points_non_reporting'] = merged_df.apply(
#                     lambda x: round(min((x['digital_completely_not_reporting_points'] / x['digital_no_of_points']) * 100, 100) ,2)  if x['digital_no_of_points'] != 0 else 0,
#                     axis=1
#                 )
#         elif formdata['category'] == 'ALL':
#             merged_df['analog_percentage_number_of_points_non_reporting'] = merged_df.apply(
#                     lambda x: round(min((x['analog_completely_not_reporting_points'] / x['analog_no_of_points']) * 100, 100) ,2)  if x['analog_no_of_points'] != 0 else 0,
#                     axis=1
#                 )
#             merged_df['digital_percentage_number_of_points_non_reporting'] = merged_df.apply(
#                     lambda x: round(min((x['digital_completely_not_reporting_points'] / x['digital_no_of_points']) * 100, 100) ,2)  if x['digital_no_of_points'] != 0 else 0,
#                     axis=1
#                 )
            
#         # sort by completely_not_reporting_points and voltage level
#         merged_df.sort_values(by = ['analog_completely_not_reporting_points','digital_percentage_number_of_points_non_reporting','Voltage_Level' ] , ascending = [False ,False , True ] , inplace=True)
#         merged_df.fillna('' , inplace= True)
       
#         return JsonResponse([merged_df.to_dict(orient= 'records') ],safe=False )

#     except Exception as e:
#         print(e)
#         extractdb_errormsg(e)
#         return JsonResponse( [str(e)],status=400 )
    
def statesSCADAMonthSummary(request):
    try:
        formdata = json.loads(request.body)
        monthyearid = formdata['monthyearid']
        state = formdata['indianState']
        ot_type = formdata['systemType']
        # 1. Define common filters
        filters = {
            'monthyearid': monthyearid,
            'category': 'ANALOG',
            'state': state,
            'ot_type': ot_type
        }
        

        merged_df = monthSummaryDetails(monthyearid ,  state , ot_type , filters)
        # sort by completely_not_reporting_points and voltage level
        merged_df.sort_values(by = ['analog_completely_not_reporting_points','digital_percentage_number_of_points_non_reporting','Voltage_Level' ] , ascending = [False ,False , True ] , inplace=True)
        merged_df.fillna('' , inplace= True)
       
        return JsonResponse([merged_df.to_dict(orient= 'records') ],safe=False )

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )
    

def pointDetailsSpecificSubstationSummary(request):
    try:
        formdata = json.loads(request.body)
        indianState = formdata['indianState']
        monthyearid = formdata['monthyearid']
        substation = formdata['substation']
        column_list = ['id','master_seq_id','master_point_name','Non_Availability_Percentage','Non_Availability_Percentage_PrevMonth','Status','Remarks','TimeLine','Approved_Status','Admin_Remarks']

        substation_point_summary_df = pd.DataFrame( HistoryScadaPointSummary.objects.filter(monthyearid = formdata['monthyearid']  , substation = formdata['substation'] ).values('id','non_availability_percentage','non_availability_percentage_prevmonth','status','remarks','timeline','admin_remarks' ,'master_seq_id','master_point_name','approved_status') , columns= ['id','non_availability_percentage','non_availability_percentage_prevmonth','status','remarks','timeline','admin_remarks','master_seq_id','master_point_name','approved_status'] )
        
        # add extra column as category to ANALOG
        substation_point_summary_df['category'] = 'ANALOG'

        scada_point_df = pd.DataFrame( ScadaPointNameMapping.objects.filter(Substation_Name = formdata['substation']).values('Substation_Name','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','IOA','ICCP_Name','seq_id','Point_Name') , columns=['Substation_Name','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','IOA','ICCP_Name','seq_id','Point_Name'] )
        
        if indianState in indianStatesWithICCP:
            temp_df  = pd.DataFrame( HistoryScadaDigitalIccpPointSummary.objects.filter(MonthYearID=monthyearid , State = indianState , substation_name = substation).values(*column_list) , columns = column_list )
        else:
            temp_df = pd.DataFrame( HistoryScadaDigitalFepPointSummary.objects.filter(MonthYearID=monthyearid , State = indianState , substation_name = substation).values(*column_list), columns = column_list )
            
        temp_df['category'] = 'POINT'
        # rename columns
        temp_df.rename(columns= {
            'Non_Availability_Percentage' : 'non_availability_percentage',
            'Non_Availability_Percentage_PrevMonth' : 'non_availability_percentage_prevmonth',
            'Admin_Remarks' : 'admin_remarks',
            'TimeLine' : 'timeline' ,
            'Remarks' : 'remarks' ,
            'Approved_Status' : 'approved_status' ,
            'Status' : 'status'
        } , inplace= True)

        final_df = pd.concat([substation_point_summary_df, temp_df], ignore_index=True)
        merge_df = pd.merge(final_df , scada_point_df , left_on = ['master_seq_id' , 'master_point_name'] , right_on = ['seq_id' , 'Point_Name'] , how = 'left')
        merge_df.fillna('' , inplace=True)
        return JsonResponse(merge_df.to_dict(orient= 'records') , safe=False)

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )
    
def statesPointsStatusAndRemarks(request):
    try:
        formdata = json.loads(request.body)
        selectedPointDetails = json.loads(formdata['selectedAnalogPointDetails'])
        timeline = None if formdata['pointTimeLineVal'] == 'null' or formdata['pointTimeLineVal'] is None else  formdata['pointTimeLineVal'] 
           
        if formdata['isSupervisor'] == 'true' or formdata['isSupervisor']:
            admin_remarks = formdata['pointRemarksVal'] 
            admin_createdtime = datetime.now()
            remarks = ''
        else:
            admin_remarks = '' 
            admin_createdtime =None
            remarks = formdata['pointRemarksVal']
            
        approved_status = 'Approved' if formdata['pointStatusVal'] in ['Dismantled' , 'Future_Point'] else 'Waiting for Approval'
        
        for point in selectedPointDetails:
           
            ScadaPointNameRequestsAndApprovalHistory (
                userid = formdata['user'],
                monthyearid = formdata['monthyearid'] ,
                point_name = point['master_point_name'] ,
                master_seq_id = point['master_seq_id'] ,
                remarks =  formdata['pointRemarksVal'] ,
                userrequestcreatedat = datetime.now(),
                timeline =timeline ,
                status = formdata['pointStatusVal'],
                approved_status = approved_status ,
                admin_remarks = admin_remarks ,
                admin_createdtime = admin_createdtime,
                category = point['category']
            ).save()
         
            if point['category'] == 'ANALOG':
                historypoint_modal_obj = HistoryScadaPointSummary.objects.filter(monthyearid =  formdata['monthyearid'] , substation = formdata['substationname'] )
                historypoint_modal_obj.filter(id =  point['id']).update(
                    status = formdata['pointStatusVal'] ,
                    timeline = timeline ,
                    remarks = remarks ,
                    created_at = datetime.now() ,
                    approved_status = approved_status ,
                    admin_remarks = admin_remarks ,
                    admin_createdtime = admin_createdtime
                )
                
            elif point['category'] == 'POINT':
                if formdata['indianState'] in indianStatesWithICCP:
                    historypoint_modal_obj = HistoryScadaDigitalIccpPointSummary.objects.filter(MonthYearID= formdata['monthyearid'] , State = formdata['indianState'] , substation_name = formdata['substationname'] )
                else:  
                    historypoint_modal_obj = HistoryScadaDigitalFepPointSummary.objects.filter(MonthYearID= formdata['monthyearid'] , State = formdata['indianState'] , substation_name = formdata['substationname'] )
                
                historypoint_modal_obj.filter(id =  point['id']).update(
                    Status = formdata['pointStatusVal'] ,
                    TimeLine = timeline ,
                    Remarks = remarks ,
                    Created_At = datetime.now() ,
                    Approved_Status = approved_status ,
                    Admin_Remarks = admin_remarks ,
                    Admin_Createdtime = admin_createdtime
                )
            else:
                continue

        return JsonResponse({'status':'success'} , safe=False)

    except Exception as e:
        print(e)
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )

def scadaPointHistory(request):
    try:
        formdata = json.loads(request.body)
        scada_point_history = list(ScadaPointNameRequestsAndApprovalHistory.objects.filter(master_seq_id = formdata['master_seq_id'] ,point_name = formdata['master_point_name'] , category = formdata['category']).order_by('-timeline').values('monthyearid','point_name','remarks','status','approved_status','timeline'))

        return JsonResponse(scada_point_history , safe=False)

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )

def approvePointDetails(request):
    try:
        points_list = json.loads(request.body)
       
        for point in points_list:
            HistoryScadaPointSummary.objects.filter(
                id = point['id']
            ).update(
               approved_status = 'Approved' 
            )
        return JsonResponse({'status' : True} , safe= False)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({'status' : False} , safe= False)

def dumpOldData(request):
    try:
        monthly_df =  pd.read_excel('Z:\Sharath\Output_Folder\Sep\September_SR2_Station_Summary.xlsx' , sheet_name= None)
        # take latest id from SCADA_Point_Summary before dumping data

        id= 30902
        # for station_name, station_df in monthly_df.items():
        #     if station_name == 'Station_Summary':
        #         for _ , row in station_df.iterrows():
        #             HistoryScadaMonthSummary.objects.update_or_create(
        #                 monthyearid='202409',
        #                 substation=row['Substation_Name'],
        #                 defaults={
        #                     "month": 9,
        #                     "month_name": 'September',
        #                     "year": 2024,
        #                     "completely_not_reporting_points": 0 if np.isnan(row['September_Completely_Not_Reporting_Points']) else row['September_Completely_Not_Reporting_Points'],
        #                     "no_of_points": row['No_of_Points'],
        #                     "created_at": datetime.today().date(),
        #                     "category": 'ANALOG',
        #                     "state": 'AP',
        #                     "completely_not_reporting_points_prevmonth": 0 if np.isnan(row['August_Completely_Not_Reporting_Points']) else row['August_Completely_Not_Reporting_Points'],
        #                 }
        #             )
        #     else:
        #         for _ , row in station_df.iterrows():
        #             HistoryScadaPointSummary(
        #                 id = id ,
        #                 monthyearid='202409',
        #                 month = 9,
        #                 month_name = 'September',
        #                 year = 2024,
        #                 non_availability_percentage = 0 if np.isnan(row['September_Non_Availability_Percentage']) else row['September_Non_Availability_Percentage'],

        #                 non_availability_percentage_prevmonth = 0 if np.isnan(row['August_Non_Availability_Percentage']) else row['August_Non_Availability_Percentage'],

        #                 created_at = datetime.today().date(),
        #                 status = '',
        #                 remarks = '',
        #                 approved_status = 'Waiting for Approval',
        #                 iccp_ioa = row['ICCP_IOA'],
        #                 substation = station_name
        #             ).save()

        #             id+=1

            
        return JsonResponse('success' , safe=False)
    except Exception as e:    
        return HttpResponse(e)

def updateRemarks(request):
    try:
        # nov_df =  pd.read_excel('Z:\\Sharath\\Output_Folder\\Decemeber_Remarks_Consoloidated.xlsx')

        # nov_df =  pd.read_excel('N:\\Sharath\\Output_Folder\\Decemeber_Remarks_Consoloidated.xlsx', sheet_name=None)

        # for key in nov_df.keys():

        #     for _ , row in nov_df[key].iterrows():
        #         timeline = None if row['TimeLine'] is None or (isinstance(row['TimeLine'], (int, float)) and np.isnan(row['TimeLine'])) else row['TimeLine']

        #         if timeline is not None:
        #             timeline = datetime.strptime(timeline, "%d.%m.%Y").date()

        #         if HistoryScadaPointSummary.objects.filter(monthyearid = '202412' , iccp_ioa = row['ICCP_IOA'] ).all().count() == 1:
        #             HistoryScadaPointSummary.objects.filter(monthyearid = '202412' , iccp_ioa = row['ICCP_IOA'] ).update(
        #                 remarks = row['REMARKS'] ,
        #                 timeline = timeline
        #             )
            
        return JsonResponse('success' , safe=False)
    
    except Exception as e:   
        return HttpResponse(e)
    

def scada_points_list(request):
    state = request.GET.get('state')
    queryset = ScadaPointNameMapping.objects.all()

    if state:
        queryset = queryset.filter(state=state)

    data = list(queryset.values())
    return JsonResponse(data, safe=False)