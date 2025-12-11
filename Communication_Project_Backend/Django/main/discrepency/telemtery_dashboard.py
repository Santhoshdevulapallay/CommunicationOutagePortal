

from django.http import JsonResponse , HttpResponse
from .models import HistoryScadaMonthSummary , HistoryScadaPointSummary , ScadaPointNameMapping , StateEnumTable
import pandas as pd
import pdb , json
from .common import *
from dateutil.relativedelta import relativedelta
import numpy as np
from .extradb_errors import extractdb_errormsg

userid_list = ['AP' ,'TG' ,'TN' ,'KA' ,'KL' ,'PY' , 'SR1' ,'SR2' ,'CS' ,'CS_RE']
 
def MetricTypeData(indianState,monthyearid , element):
    try:
        # first get the data of ICTS , element_description__contains = '_T1'
        scada_mapping_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(state = indianState , metric_type = 'MW' , element_category__in = ['XFMR_P','XFMR_S'] , element_description__contains = '_T1' ).values('substation_name' , 'voltage_level','iccp_name') , columns= ['substation_name' , 'voltage_level','iccp_name'])
        
        scada_point_df = pd.DataFrame(HistoryScadaPointSummary.objects.filter(monthyearid = monthyearid ).values('iccp_ioa' , 'substation','non_availability_percentage') , columns= ['iccp_ioa' , 'substation','non_availability_percentage'])

        if element == 'ICT':
            merge_df = pd.merge(scada_mapping_df , scada_point_df , left_on = 'iccp_name' , right_on = 'iccp_ioa')
            # Filter rows with non_availability_percentage > 90
            filtered_df = merge_df[merge_df["non_availability_percentage"] >= 98]
            
            # Group by substation_name and voltage_level and count the rows
            result_df = filtered_df.groupby(["voltage_level"]).size().reset_index(name="count")
            # order by voltage_level and substation_name
            result_df.sort_values(by=['voltage_level'] ,inplace=True)
            # Transform the DataFrame
            transformed_df = result_df.pivot_table(index=[], columns="voltage_level", values="count", fill_value=0)
            # Reset column names for clarity
            transformed_df.columns = [f"{col}kV" for col in transformed_df.columns]
            transformed_df = transformed_df.reset_index(drop=True)
            transformed_df['element']  = element
            ict_non_available_percent_count = transformed_df.to_dict(orient= 'records')
        
        return ict_non_available_percent_count

    except Exception as e:
        extractdb_errormsg(e)
        return []


def substationsNotReporting(userid , monthyearid , scadaid , ot_type):
    try:
        if userid == 'SRLDC':
            scada_month_df = pd.DataFrame(HistoryScadaMonthSummary.objects.filter(monthyearid = monthyearid , ot_type = ot_type).values('month_name' ,'completely_not_reporting_points' ,'no_of_points' , 'state' ,'substation') , columns=['month_name' ,'completely_not_reporting_points' ,'no_of_points' ,'state' ,'substation'])
        else:
            scada_month_df = pd.DataFrame(HistoryScadaMonthSummary.objects.filter(monthyearid = monthyearid , state = scadaid , ot_type = ot_type).values('month_name' ,'completely_not_reporting_points' ,'no_of_points' ,'state' ,'substation') , columns=['month_name' ,'completely_not_reporting_points' ,'no_of_points' ,'state' ,'substation'])
        
        scada_month_df['percentage_not_reporting'] = scada_month_df.apply(
                lambda x: (x['completely_not_reporting_points'] / x['no_of_points'])*100 if x['no_of_points'] != 0 else 0,
                axis=1
            )
        
        # drop some columns
        scada_month_df.drop(columns=['completely_not_reporting_points','no_of_points'] , inplace= True)
        # Filter rows where percentage_not_reporting > 98
        temp_df = scada_month_df[scada_month_df['percentage_not_reporting'] > 98]
        
        # order by state and substation
        filtered_df = temp_df.copy()
        filtered_df.sort_values(by = ['state' , 'substation'] , inplace=True)
        substations_not_reporting = []
        for state in filtered_df['state'].unique():
            substations_not_reporting.append([state , filtered_df[filtered_df['state'] == state]['substation'].tolist()])
        
        return filtered_df , substations_not_reporting
    except Exception as e:
        extractdb_errormsg(e)
        return [str(e)] ,[]
    
def stationsCompletelyNotReporting(request):
    try: 
        formdata = json.loads(request.body)
        monthyearid = formdata['monthyearid']
        monthyearid_prev = str(getPrevMonthID(int(monthyearid)) )

        userid = formdata['userid']
        scadaid = formdata['scadaid']

        letter_date = datetime.strptime(monthyearid , '%Y%m').date()
        prev_letter_date = datetime.strptime(monthyearid_prev , '%Y%m').date()

        month = letter_date.strftime('%B %y')
        prev_month = prev_letter_date.strftime('%B %y')

        
        # ICT_non_available_percent_count = MetricTypeData(indianState,monthyearid , 'ICT')
        non_availability_month_summary = NonAvailabilityIntermittent(monthyearid , userid , scadaid)

        filtered_df , substations_not_reporting = substationsNotReporting(userid , monthyearid , scadaid)
        # Group by month_name and state and count
        result_df = filtered_df.groupby(['month_name', 'state']).size().reset_index(name='count')
        
        telemetry_summary = telemetryIssuesTable(monthyearid ,monthyearid_prev , userid)
        updated_telemetry_summary = [
            {
                **{k: v for k, v in item.items() if k not in ['slno','points_month', 'points_prevmonth']},
                month: item['points_month'],
                prev_month: item['points_prevmonth']
            }
            for item in telemetry_summary
        ]

        #3rd table
        entities_list = list(StateEnumTable.objects.all().values_list('state' , flat=True))
        
        telemetry_ex_oltc = []
        for state in entities_list:
            telemetry_failure_df = telemetryFailure(monthyearid , state)
            telemetry_failure_prevmonth_df = telemetryFailure(monthyearid_prev , state)
            
            # Step 1: Get the sets of iccp_ioa from both dataframes
            telemetry_curr_month_ioa = set(telemetry_failure_df['iccp_ioa'])
            telemetry_prev_month_ioa = set(telemetry_failure_prevmonth_df['iccp_ioa'])

            # Step 2: Find iccp_ioa present in df1 but not in df2
            resolved_in_curr_month = len(telemetry_prev_month_ioa - telemetry_curr_month_ioa)
            # Step 3: Find iccp_ioa present in df2 but not in df1
            newly_added_points = len( telemetry_curr_month_ioa - telemetry_prev_month_ioa)
            not_resolved_in_two_months = len( telemetry_curr_month_ioa & telemetry_prev_month_ioa ) # intersection
            
            telemetry_ex_oltc+= [
                {'state': state,  f'Points Not Resolved Since {prev_month}' : not_resolved_in_two_months , f'Points Resolved in {month}' : resolved_in_curr_month , f'Newly Identified Points in {month}' : newly_added_points } 
            ]

        return JsonResponse([result_df.to_dict(orient= 'records') ,substations_not_reporting , non_availability_month_summary , updated_telemetry_summary , telemetry_ex_oltc ] , safe=False)
    
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )

from concurrent.futures import ThreadPoolExecutor, as_completed
from dateutil.relativedelta import relativedelta

def process_user(userid, start, end, ot_type ):
    months = []
    no_of_points = []
    telemetry_failure = []
    oltc_points = []
    highly_intermittent = []
    intermittent = []

    current = start
    while current <= end:
        monthyearid = f"{current.year}{current.month}"
        months.append(current.strftime('%B%y'))

        non_availability_month_summary = NonAvailabilityIntermittent(monthyearid, userid, userid, ot_type)
        no_of_points.append(non_availability_month_summary['Total Non-Reporting Analog Points'])
        telemetry_failure.append(non_availability_month_summary['Telemetry Failure'])
        oltc_points.append(non_availability_month_summary['No. of OLTC'])
        highly_intermittent.append(non_availability_month_summary['Highly Intermittent'])
        intermittent.append(non_availability_month_summary['Telemetry Intermittent'])

        current += relativedelta(months=1)

    final_vals = [months, no_of_points, telemetry_failure, oltc_points, highly_intermittent, intermittent]
    return userid, final_vals

def getUsersList(ot_type):
    try:
        userid_list = list( ScadaPointNameMapping.objects.filter(ot_type = ot_type).values_list('State' , flat=True).distinct('State'))
        # remove 'Unknown' from userid_list
        return  [state for state in userid_list if state != 'Unknown']
    except Exception as e:
        extractdb_errormsg(e)
        return []
    
# def plotlyDataDashboards(request):
#     try:
#         from datetime import datetime
#         from dateutil.relativedelta import relativedelta
#         formdata = json.loads(request.body)
       
#         start = datetime.strptime(formdata['start_month'], "%Y-%m")
#         end = datetime.strptime(formdata['end_month'], "%Y-%m")
#         ot_type = formdata['system_type']
#         entity_name = formdata.get('entity_name', None)
#         states_dict = {}
#         userid_list = getUsersList(ot_type) if entity_name in ('SRLDC' , 'SRPC') else [entity_name] 
#         import pdb; pdb.set_trace()
#         states_dict = {}
#         with ThreadPoolExecutor(max_workers=8) as executor:
#             futures = {executor.submit(process_user, userid, start, end, ot_type ): userid for userid in userid_list}
#             for future in as_completed(futures):
#                 userid, final_vals = future.result()
#                 states_dict[userid] = final_vals

        
#         return JsonResponse(states_dict , safe=False)
#     except Exception as e:
#         extractdb_errormsg(e)
#         return JsonResponse( [str(e)],status=400 )


def plotlyDataDashboards(request):
    try:
        formdata = json.loads(request.body)
        
        start = datetime.strptime(formdata['start_month'], "%Y-%m")
        end = datetime.strptime(formdata['end_month'], "%Y-%m")
        ot_type = formdata['system_type']
        entity_name = formdata.get('entity_name', None)
        
        # 1. Define your desired strict order
        desired_order = ['AP', 'KA', 'KL', 'TG', 'TN' ,'PY', 'SR1', 'SR2','TL','CS', 'CS_RE', 'CS_REMC']

        # Determine the user list to process
        if entity_name in ('SRLDC' , 'SRPC'):
            userid_list = getUsersList(ot_type) 
        else:
            userid_list = [entity_name]

        # 2. Use a temporary dictionary to hold results (Order will be random here)
        temp_results = {}
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(process_user, userid, start, end, ot_type): userid for userid in userid_list}
            
            for future in as_completed(futures):
                try:
                    userid, final_vals = future.result()
                    temp_results[userid] = final_vals
                except Exception as exc:
                    # Optional: Handle individual thread errors so one failure doesn't crash the whole view
                    print(f"Error processing {futures[future]}: {exc}")

        # 3. Create the final dictionary in the specific order
        states_dict = {}
        # If the entity is a single user, just return that single result
        if entity_name not in ('SRLDC' , 'SRPC'):
            # If specific entity, just return that entity's data
            states_dict = temp_results
        else:
            if ot_type != 'REMC':
                # Iterate through your HARDCODED order list to ensure correct JSON sequence
                for key in desired_order:
                    # Check if this key exists in the calculated results 
                    # (Prevents errors if getUsersList returns fewer items than the full list)
                    if key in temp_results:
                        states_dict[key] = temp_results[key]
            else:
                # For REMC, sort keys alphabetically
                for key in sorted(temp_results.keys()):
                    states_dict[key] = temp_results[key]
        return JsonResponse(states_dict, safe=False)

    except Exception as e:
        extractdb_errormsg(e) 
        return JsonResponse([str(e)], status=400, safe=False) 

def remarksTimelineTableDashboard(request):
    try:
        formdata = json.loads(request.body)
        start = datetime.strptime(formdata['start_month'], "%Y-%m")
        end = datetime.strptime(formdata['end_month'], "%Y-%m")
        ot_type = formdata['system_type']
    
        entity_name = formdata.get('entity_name', None)
        states_dict = {}
        userid_list = getUsersList(ot_type) if entity_name  in ('SRLDC','SRPC') else [entity_name] 

        col_type = formdata['btnType']
        for userid in userid_list:
            remarks_df = pd.DataFrame([] , columns=[col_type])
            current = start
            while current <= end:
                monthyearid = f"{current.year}{current.month}"
                # Unique Remarks chart
                substations_list = getSubstationList(monthyearid , userid ,ot_type)
                point_summary = HistoryScadaPointSummary.objects.filter(substation__in = substations_list)
                
                point_summary_df = pd.DataFrame(point_summary.filter(monthyearid = monthyearid).exclude(remarks__isnull = True).values(col_type ) , columns=[col_type] )
                point_summary_df.replace('nan', np.nan, inplace=True)
                point_summary_df.replace('\n', '', inplace=True)
                point_summary_df.dropna(subset=[col_type], inplace=True)
                
                remarks_df = pd.concat([remarks_df , point_summary_df])
                current += relativedelta(months=1)

            if remarks_df.empty:
                lables , values = [] , []
            else :
                # If remarks_df is a DataFrame with a column 'remarks'/'timeline'
                value_counts = remarks_df[col_type].value_counts()
                # Convert to lists
                lables = value_counts.index.tolist()
                values = value_counts.values.tolist()
            states_dict[userid] = [lables , values]
    
        return JsonResponse(states_dict , safe=False)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )
    

def notReportingTableDashboard(request):
    try:
        formdata = json.loads(request.body)
     
        start = datetime.strptime(formdata['start_month'], "%Y-%m")
        end = datetime.strptime(formdata['end_month'], "%Y-%m")
        month_end = end + timedelta(days = 30)
        ot_type = formdata['system_type']
        entity_name = formdata.get('entity_name', None)
        states_dict = {}
        userid_list = getUsersList(ot_type) if entity_name  in ('SRLDC','SRPC') else [entity_name] 

        for userid in userid_list:
            monthyearid = f"{start.year}{start.month}"
            # Unique Remarks chart
            substations_list = getSubstationList(monthyearid , userid ,ot_type)
            point_summary = HistoryScadaPointSummary.objects.filter(substation__in = substations_list )
            point_summary_df = pd.DataFrame(point_summary.filter( monthyearid = monthyearid).exclude(timeline__isnull = True).values('iccp_ioa' ,'substation','timeline' ) , columns=['iccp_ioa' ,'substation' ,'timeline' ] )

            still_persists = []
            for _ , row in point_summary_df.iterrows():
                # iterate over each month starting from row['timeline'] to month_end
                present_count = 0
                latest_timeline = None
                temp_timeline = row['timeline']
                # checking from given timeline by Entity
                while temp_timeline <= month_end.date() :
                    row_month = f"{temp_timeline.year}{temp_timeline.month}"
                    point_qry = point_summary.filter( monthyearid = row_month , substation = row['substation'] , iccp_ioa = row['iccp_ioa'])
                    if point_qry.count() > 0 :
                        present_count = 1
                        timeline_value = point_qry.values_list('timeline', flat=True).first()
                        if timeline_value is not None:
                            # always take latest timeline instead None value
                            latest_timeline = timeline_value
                    temp_timeline+= relativedelta(months=1) 
                if present_count > 0 :
                    # still persisting the problem
                    latest_timeline = latest_timeline.strftime('%d-%m-%Y') if latest_timeline is not None else 'Not Available'
                    row_timeline = row['timeline'].strftime('%d-%m-%Y') if row['timeline'] is not None else 'Not Available'
                        
                    still_persists.append([row['substation'] ,str( row['iccp_ioa']) , row_timeline , latest_timeline])

            states_dict[userid] = still_persists
       
        return JsonResponse(states_dict , safe=False)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )
    

def notRectifiedTableDashboard(request):
    try:
        formdata = json.loads(request.body)
        end = datetime.strptime(formdata['end_month'], "%Y-%m")
        prev_month = end - relativedelta(months=1)
        ot_type = formdata['system_type']
        
        entity_name = formdata.get('entity_name', None)
        states_dict = {}
        userid_list = getUsersList(ot_type) if entity_name  in ('SRLDC','SRPC') else [entity_name] 

        # get latest SCADA snapshot zip file and extract it
        snapshot_path =  readLatestSnapshot()
        snapshot_df = pd.read_csv(snapshot_path)
        # remove trailing spaces
        snapshot_df['$key'] = snapshot_df['$key'].str.strip()
        
        for userid in userid_list:
            monthyearid = f"{prev_month.year}{prev_month.month}"
            # Unique Remarks chart
            substations_list = getSubstationList(monthyearid , userid ,ot_type)
            state_point_df = pd.DataFrame ( ScadaPointNameMapping.objects.filter(Substation_Name__in = substations_list).values('ICCP_Name','Point_Name') , columns=['ICCP_Name','Point_Name'] )

            point_summary_df = pd.DataFrame( HistoryScadaPointSummary.objects.filter( monthyearid = monthyearid , substation__in = substations_list , remarks__iexact='rectified').values('iccp_ioa' ,'substation') , columns=['iccp_ioa' ,'substation'  ] )

            state_point_df['ICCP_Name'] = state_point_df['ICCP_Name'].str.strip()
            point_summary_df['iccp_ioa'] = point_summary_df['iccp_ioa'].str.strip()

            merge_df = pd.merge( point_summary_df , state_point_df , left_on = ['iccp_ioa'] , right_on = ['ICCP_Name'] , how = 'left')
            # merge this df with snapshot_df
            result_df = pd.merge( merge_df , snapshot_df , left_on = 'Point_Name' , right_on = '$key' , how='left')
            # check the quality 
            cols_to_convert = ['ASRUSING', 'REPLACED', 'GOOD']
            result_df[cols_to_convert] = result_df[cols_to_convert].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int)

            # Drop rows based on the conditions
            filtered_df = result_df[~(
                (result_df['ASRUSING'] == 1) |
                (result_df['REPLACED'] == 1) |
                ((result_df['ASRUSING'] == 0) & (result_df['REPLACED'] == 0) & (result_df['GOOD'] == 1))
            )]
            states_dict[userid] = filtered_df[['substation','iccp_ioa']].values.tolist()
        return JsonResponse(states_dict , safe=False)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse( [str(e)],status=400 )
