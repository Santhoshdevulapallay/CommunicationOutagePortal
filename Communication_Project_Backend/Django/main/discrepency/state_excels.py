from django.http import JsonResponse , HttpResponse , FileResponse
from .models import HistoryScadaMonthSummary , HistoryScadaPointSummary , ScadaPointNameMapping ,ScadaPointNameRequestsAndApprovalHistory
import pandas as pd
import pdb , json , datetime
from .common import *
import json , os
from main.settings import base_dir
from .gen_letter import get_previous_month
from .extradb_errors import extractdb_errormsg
from .Point_Models import HistoryScadaDigitalFepPointSummary , HistoryScadaDigitalIccpPointSummary , HistoryScadaMonthSummaryDigital

indianStatesWithICCP = ('AP' ,'TG' ,'KA' ,'KL' ,'TN' ,'PY','SR1','SR2' )

def handleCategoryWisePointSummary(indianState, monthYearID, prev_month_str , monthQry , pointQry , mappingQry  , category):
    try:  
        substation_list = list( monthQry.objects.filter(monthyearid = monthYearID , state = indianState).distinct('substation').values_list('substation' , flat=True) )
        full_substation_list = substation_list + [indianState]
        # get the State substation list
        scada_point_mapping_df = pd.DataFrame(mappingQry.objects.filter(Substation_Name__in = full_substation_list ).values('Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','seq_id' ,'Point_Name') , columns=['Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','seq_id' ,'Point_Name'])

        columns= ['Substation_Name' , 'Voltage_Level' ,'ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','Non_Availability_Percentage','Status','Remarks' , 'Timeline(dd-mm-yyyy)' ,'Point_id' ,'Category']
        
        if category == 'ANALOG':
            # point summary data
            scadapoint_qry = pointQry.objects.filter(substation__in = full_substation_list )

            state_point_summary_df = pd.DataFrame(scadapoint_qry.filter(monthyearid = monthYearID ).values('substation','non_availability_percentage','status','remarks','timeline','master_seq_id','master_point_name','id') , columns=['substation','non_availability_percentage','status','remarks','timeline','master_seq_id','master_point_name','id'])
        
            state_point_summary_prev_month_df = pd.DataFrame(scadapoint_qry.filter(monthyearid = prev_month_str).values('substation','remarks','master_seq_id','master_point_name') , columns=['substation','remarks' ,'master_seq_id','master_point_name'])

        elif category == 'DIGITAL':
            scadapoint_qry = pointQry.objects.filter(substation_name__in = full_substation_list )

            state_point_summary_df = pd.DataFrame(scadapoint_qry.filter(MonthYearID = monthYearID ).values('substation_name','Non_Availability_Percentage','Status','Remarks','TimeLine','master_seq_id','master_point_name','id') , columns=['substation_name','Non_Availability_Percentage','Status','Remarks','TimeLine','master_seq_id','master_point_name','id'])
            # rename columns like Status to status , Remarks to remarks , TimeLine to timeline for uniformity
            state_point_summary_df.rename(columns={
                'substation_name' : 'substation' ,
                'Non_Availability_Percentage' : 'non_availability_percentage' ,
                'Status' : 'status' ,
                'Remarks' : 'remarks' ,
                'TimeLine' : 'timeline'
            } , inplace= True)

            state_point_summary_prev_month_df = pd.DataFrame(scadapoint_qry.filter(MonthYearID = prev_month_str).values('substation_name','Remarks','master_seq_id','master_point_name') , columns=['substation_name','Remarks' ,'master_seq_id','master_point_name'])
            # rename columns like Remarks to remarks for uniformity
            state_point_summary_prev_month_df.rename(columns={
                'substation_name' : 'substation' ,
                'Remarks' : 'remarks' 
            } , inplace= True)

        else :
            return pd.DataFrame( [] , columns=columns)
        
        state_point_summary_prev_month_df = state_point_summary_prev_month_df.dropna()
        merged_df = pd.merge(state_point_summary_df , scada_point_mapping_df , left_on = ['master_seq_id','master_point_name'] ,right_on = ['seq_id' ,'Point_Name'] , how='left')
        
        prev_remarks_df = pd.merge(state_point_summary_prev_month_df , scada_point_mapping_df , left_on = ['master_seq_id','master_point_name'] ,right_on = ['seq_id' ,'Point_Name'] , how='left')
        # Merge DataFrames
        final_merged_df = pd.merge(merged_df , prev_remarks_df[['remarks' ,'seq_id','Point_Name']] , on = ['seq_id' ,'Point_Name'] , how = 'left')
        # get Voltage_Level >= 220
        final_merged_df = final_merged_df[final_merged_df['Voltage_Level'] >= 220] 
       
        # Replace df2 remarks with df1 remarks where applicable
        final_merged_df['remarks_x'].update(final_merged_df['remarks_y'])
        # Drop extra remarks column
        final_merged_df.drop(columns=['master_seq_id' ,'master_point_name','seq_id','Point_Name' ,'remarks_y'], inplace=True)
        # Rename remarks column properly
        final_merged_df.rename(columns={'remarks_x': 'remarks' ,'id':'Point_id'}, inplace=True)
        # Replace 'nan' values with empty strings
        final_merged_df['remarks'] = final_merged_df['remarks'].replace("nan", "")
        # filter out only points greater than 98%
        final_merged_df = final_merged_df[final_merged_df['non_availability_percentage'] > 98]
        # add extra columns Category with value as category
        final_merged_df['Category'] = category

        if not final_merged_df.empty:
            # rename the columns and create a excel file and send that file to frontend
            final_merged_df.rename(columns= {
                'substation':'Substation_Name' ,
                'non_availability_percentage' : 'Non_Availability_Percentage' ,
                'status' : 'Status' ,
                'remarks' : 'Remarks' ,
                'timeline' : 'Timeline(dd-mm-yyyy)' 
            } , inplace= True)
        else:
            final_merged_df = pd.DataFrame([], columns=columns)
        
        final_merged_df = final_merged_df.fillna('')
        return final_merged_df
    except Exception as e:
        extractdb_errormsg(e)
        return pd.DataFrame( [] , columns=columns)
    
def stateDownloadExcel(request ):
    try:   
        formdata = json.loads(request.body) 
        indianState = formdata['indianState']
        monthYearID = formdata['monthyearid']
        

        if indianState == "TS":
            indianState = "TG"
        
        letter_date = datetime.strptime(monthYearID , '%Y%m').date()
        prev_month = get_previous_month(letter_date, 1)

        month_num = int(prev_month.strftime('%m'))
        prev_month_str = prev_month.strftime('%Y') + str(month_num)

        final_df_columns = ['Category' ,'Substation_Name' , 'Voltage_Level' ,'ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type','Non_Availability_Percentage','Status','Remarks' , 'Timeline(dd-mm-yyyy)' ,'Point_id']  
        result_df = pd.DataFrame()
        # Analog Part
        result_df = pd.concat([result_df , handleCategoryWisePointSummary(indianState, monthYearID, prev_month_str , HistoryScadaMonthSummary , HistoryScadaPointSummary , ScadaPointNameMapping ,'ANALOG')] )
        
        # Digital Part
        if indianState in indianStatesWithICCP:
            result_df = pd.concat([result_df , handleCategoryWisePointSummary(indianState, monthYearID, prev_month_str , HistoryScadaMonthSummaryDigital , HistoryScadaDigitalIccpPointSummary , ScadaPointNameMapping ,'POINT') ])
        else:
            result_df = pd.concat([result_df , handleCategoryWisePointSummary(indianState, monthYearID, prev_month_str , HistoryScadaMonthSummaryDigital ,HistoryScadaDigitalFepPointSummary  , ScadaPointNameMapping ,'POINT') ])

        # Create an extra row with status values
        extra_row = pd.DataFrame([{
            "Substation_Name": "Status values:", 
            "Non_Availability_Percentage": "", 
            "Status": "Pending, Rectified, Dismantled , Future Point ,ICCP Name Mismatch ",
            "Remarks": "Previous Month Remarks If any filled", 
            "Timeline(dd-mm-yyyy)": "", 
            "Voltage_Level": "", 
            "ELEMENT_DESCRIPTION": "", 
            "ELEMENT_CATEGORY": "", 
            "Metric_Type": "",
            "Point_id" : "",
            "Category": ""
        }])
    
        # Insert the extra row at the top
        result_df = pd.concat([extra_row, result_df], ignore_index=True)
        # change the order 
        result_df = result_df[final_df_columns]
        # drop duplicate rows containing Point_id
        result_df.drop_duplicates(subset=['Point_id'], keep='first', inplace=True)
        # Save as CSV
        file_path = indianState +'_' +monthYearID +".csv"
        result_df.to_csv(file_path, index=False)
        response = FileResponse(open(file_path, 'rb'), content_type='text/csv')
        response['Content-Disposition'] = 'attachment'
        
        return response
    
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )


def stateUploadExcel(request):
    try:  
        formdata = request.POST
        monthyearid = formdata['monthyearid']
        indianState = formdata['indianState']
        uploaded_file = request.FILES.get('file')
        # check file extension 
        if uploaded_file.name.split('.')[1] == 'csv':
            read_df = pd.read_csv(uploaded_file)
            # drop the first row because it contains Status dropdown values
            df = read_df.iloc[1:]
            # Define the statuses that are considered "resolved" or "non-actionable"
            RESOLVED_STATUSES = ['DISMANTLED', 'RECTIFIED']

            # Create the boolean mask for the rows to be dropped (the 'stuck' points)
            rows_to_drop_mask = (
                # Condition 1: Timeline is None/NaN (missing)
                df["Timeline(dd-mm-yyyy)"].isna()
                &
                # Condition 2: Status is NOT in the resolved list (case-insensitive check for robustness)
                ~df["Status"].str.upper().isin(RESOLVED_STATUSES)
            )

            # Use the mask to drop the rows that satisfy BOTH conditions
            df_cleaned = df[~rows_to_drop_mask].copy()
            #  convert Point_id to integer
            df_cleaned['Point_id'] = df_cleaned['Point_id'].astype(int)
         
            for _ , row in df_cleaned.iterrows():
                timeline = None
                category = row['Category']
                if row['Status'] not in ('Dismantled' ,'dismantled' ,'DISMANTLED' ,'Rectified' ,'RECTIFIED') :
                    try: 
                        timeline = datetime.strptime(row['Timeline(dd-mm-yyyy)'] , '%d-%m-%Y')
                    except:
                        pass

                if category == 'ANALOG':
                    # update HistoryScadaPointSummary table
                    HistoryScadaPointSummary.objects.filter(
                       id = row['Point_id']
                    ).update(
                        status = row['Status'] ,
                        remarks = row['Remarks'] ,
                        timeline = timeline
                    )
                else:
                    # update HistoryScadaDigitalIccpPointSummary or HistoryScadaDigitalFepPointSummary table
                    if indianState in indianStatesWithICCP:
                        HistoryScadaDigitalIccpPointSummary.objects.filter(
                            id = row['Point_id']
                        ).update(
                            Status = row['Status'] ,
                            Remarks = row['Remarks'] ,
                            TimeLine = timeline
                        )
                    else:
                        HistoryScadaDigitalFepPointSummary.objects.filter(
                            id = row['Point_id']
                        ).update(
                            Status = row['Status'] ,
                            Remarks = row['Remarks'] ,
                            TimeLine = timeline
                        )
                # parallely create new record in ScadaPointNameRequestsAndApprovalHistory
                ScadaPointNameRequestsAndApprovalHistory(
                        userid = indianState ,
                        monthyearid = monthyearid,
                        remarks =row['Remarks'] ,
                        userrequestcreatedat = datetime.now() ,
                        timeline = timeline ,
                        status = row['Status'] ,
                        category = row['Category']
                ).save()

            return  JsonResponse({'status': 'File uploaded Successfully'}, status=200)
        else:
            return  JsonResponse({'status': 'Please upload file in .csv format only'}, status=404)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )