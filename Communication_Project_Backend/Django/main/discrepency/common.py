


from datetime import datetime, timedelta
from .models import HistoryScadaMonthSummary , HistoryScadaPointSummary , ScadaPointNameMapping
import pandas as pd
import os
import zipfile
from .extradb_errors import extractdb_errormsg
import calendar , json
from django.http import JsonResponse 
from .Point_Models import HistoryScadaMonthSummaryDigital

indianStatesWithICCP = ('AP' ,'TG' ,'KA' ,'KL' ,'TN' ,'PY','SR1','SR2' )

def get_previous_months(monthyearid):
    # Parse the input monthyearid
    current_month = int(monthyearid[-2:])
    current_year = int(monthyearid[:4])
    
    # Calculate previous 3 months
    previous_months = []
    for i in range(1, 4):
        # Adjust year and month for previous month
        new_month = current_month - i
        new_year = current_year
        if new_month < 1:
            new_month += 12
            new_year -= 1
        # Format as 'YYYYMM'
        previous_months.append(f"{new_year}{new_month:02}")
    
    return previous_months

def getSubstationList(monthYearID , indianState , ot_type):
    try:
        return list( HistoryScadaMonthSummary.objects.filter(monthyearid = monthYearID , state = indianState , ot_type = ot_type).distinct('substation').values_list('substation' , flat=True) )
    except Exception as e:
        return [str(e)]

def getPrevMonthID(curr_month_id):
    try:
        year = curr_month_id // 100
        month = curr_month_id % 100
        
        month -= 1
        if month == 0 :
            month  = 12
            year -= 1
        
        return int(f"{year}{month}")
    except Exception as e:
        return ''


def NonAvailabilityIntermittent(monthyearid , userid , scadaid , ot_type):
    try:
        # Dashboard Page iterates state by state so If condition fails here always
        history_scada_qry = HistoryScadaPointSummary.objects.filter(monthyearid = monthyearid , ot_type = ot_type , non_availability_percentage__gte = 5 )
        
        if userid == 'SRLDC':
            scada_pointsummary_df = pd.DataFrame(history_scada_qry.values('master_seq_id' ,'master_point_name','non_availability_percentage') , columns= ['master_seq_id' ,'master_point_name' ,'non_availability_percentage'])
        else:
            substations_list = getSubstationList(monthyearid , userid , ot_type)
            temp_scada_pointsummary_df = pd.DataFrame(history_scada_qry.filter(substation__in = substations_list ).values('iccp_ioa' ,'substation','non_availability_percentage' ,'master_point_name' ,'master_seq_id') , columns= ['iccp_ioa' ,'substation','non_availability_percentage','master_point_name' ,'master_seq_id'])
            
            if userid in ('SR1' ,'SR2') :
                scada_point_names_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = userid , ot_type = ot_type).distinct('Point_Name' ,'seq_id').values('IOA' ,'Substation_Name','Metric_Type','Point_Name' ,'seq_id' ) , columns=['IOA' , 'Substation_Name', 'Metric_Type','Point_Name' ,'seq_id'])
                # import pdb
                # pdb.set_trace()
                # scada_point_names_df['IOA'] = scada_point_names_df['IOA'].apply(lambda x : str(x))  
                scada_pointsummary_df = pd.merge(temp_scada_pointsummary_df , scada_point_names_df , left_on = ['master_point_name' , 'master_seq_id'] , right_on = ['Point_Name' ,'seq_id'] , how = 'left')
                scada_pointsummary_df.drop(columns = ['IOA' ,'substation' ,'Substation_Name', 'master_seq_id','Point_Name', 'seq_id','Metric_Type'] , inplace=True)
                
                # scada_pointsummary_df.rename(columns={'Metric_Type' : 'iccp_ioa'} , inplace=True)
            else : 
                # other than SR1 , SR2 like states
                scada_pointsummary_df = temp_scada_pointsummary_df.dropna().copy()

        # drop NaN values from df
        scada_pointsummary_df = scada_pointsummary_df.dropna()  
        exclude_oltc_df = scada_pointsummary_df[~scada_pointsummary_df['master_point_name'].str.contains('OLTC', na=False)]
        
        non_availability_df = exclude_oltc_df[exclude_oltc_df["non_availability_percentage"] >= 98]
        
        highly_intermittent_df = exclude_oltc_df[(exclude_oltc_df["non_availability_percentage"] >= 90) & (exclude_oltc_df["non_availability_percentage"] < 98) ]
        intermittent_df = exclude_oltc_df[exclude_oltc_df["non_availability_percentage"] < 90]
        
        scada_pointsummary_df = scada_pointsummary_df[scada_pointsummary_df["non_availability_percentage"] > 98]
        oltc_df = scada_pointsummary_df[scada_pointsummary_df['master_point_name'].str.contains('OLTC')]
        
        total_points = non_availability_df.shape[0] + highly_intermittent_df.shape[0] + intermittent_df.shape[0] + oltc_df.shape[0]
        return {'Telemetry Failure': non_availability_df.shape[0] , 'Highly Intermittent':highly_intermittent_df.shape[0] ,'Telemetry Intermittent':intermittent_df.shape[0] , 'No. of OLTC':oltc_df.shape[0] , 'Total Non-Reporting Analog Points' :  total_points} 

    except Exception as e:
        extractdb_errormsg(e)
        return {'Telemetry Failure': '--' , 'Highly Intermittent':'--' ,'Telemetry Intermittent':'--' , 'No. of OLTC':'--' , 'Total Non-Reporting Analog Points' :  '--'} 


def telemetryIssuesTable(monthyearid ,monthyearid_prev ,state , ot_type ):
    try:
        telemetry_summary_month = NonAvailabilityIntermittent(monthyearid , state , state , ot_type)
        telemetry_summary_prevmonth = NonAvailabilityIntermittent(monthyearid_prev , state , state , ot_type)
        
        telemetry_summary = []
        counter = 0
        for key , val in telemetry_summary_month.items():
            for key1 , val1 in telemetry_summary_prevmonth.items():
                if key == key1:
                    counter+=1
                    telemetry_summary.append({'slno': counter , 'category':key , 'points_month': val , 'points_prevmonth':val1})
                    break
        
        return telemetry_summary
    except Exception as e:
        return [str(e)]

def telemetryFailure(monthYearID , indianState , ot_type):
    try:
        full_substation_list = getSubstationList(monthYearID , indianState , ot_type) + [indianState]
        # point summary data
        state_point_summary_df = pd.DataFrame(HistoryScadaPointSummary.objects.filter(monthyearid = monthYearID , ot_type = ot_type ,substation__in = full_substation_list   ).values('substation','master_seq_id','master_point_name','non_availability_percentage','status','remarks','timeline') , columns=['substation','master_seq_id','master_point_name','non_availability_percentage','status','remarks','timeline'])
        
        #drop rows where master_seq_id is NaN or nan
        state_point_summary_df = state_point_summary_df.dropna(subset=['master_seq_id'])
        # state_point_summary_df = state_point_summary_df[state_point_summary_df['master_seq_id'].apply(lambda x: str(x).strip().lower() != 'nan')]
        
        # Assuming df is your DataFrame
        exclude_oltc_df = state_point_summary_df[~state_point_summary_df['master_point_name'].str.contains('OLTC', na=False)]
        non_availability_df = exclude_oltc_df[exclude_oltc_df["non_availability_percentage"] >= 98]
        
        
        scada_point_mapping_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = indianState , ot_type = ot_type).values('Substation_Name','seq_id','Point_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type') , columns=['Substation_Name','seq_id','Point_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type'])
         
        failure_df = pd.merge(non_availability_df , scada_point_mapping_df , left_on = ['master_seq_id','master_point_name'] , right_on = ['seq_id','Point_Name'] , how='left')
        # drop rows where seq_id and Point_Name are NaN
        failure_df = failure_df.dropna(subset=['seq_id','Point_Name'])
        # convert master_seq_id to int then to string
        failure_df['master_seq_id'] = failure_df['master_seq_id'].apply(lambda x: str(int(x)) if pd.notnull(x) else x)
        
        failure_df.drop(columns= ['substation','seq_id','Point_Name'] , inplace= True)
        
        return failure_df
    
    except Exception as e:
        print(e)
        return pd.DataFrame([str(e)])  

def readLatestSnapshot():
    try:
        # Step 1: Define the path
        folder_path = r"Y:\snapshots\RTCA_Data_Raghava\Data"
        # Step 2: Get all zip files and find the latest one
        zip_files = [f for f in os.listdir(folder_path) if f.endswith('.zip')]
        if not zip_files:
            raise FileNotFoundError("No zip files found in the folder.")

        # Get the latest zip file by modified time
        zip_files_fullpath = [os.path.join(folder_path, f) for f in zip_files]
        latest_zip = max(zip_files_fullpath, key=os.path.getmtime)

        # Step 3: Extract the latest zip file
        extract_path = "extracted"
        if not os.path.exists(extract_path):
            os.makedirs(extract_path)

    
        with zipfile.ZipFile(latest_zip, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        # Step 4: Search for ANALOG.csv in extracted contents
        analog_csv_path = None
        for root, dirs, files in os.walk(extract_path):
            for file in files:
                if file.upper() == "ANALOG.CSV":
                    analog_csv_path = os.path.join(root, file)
                    break
            if analog_csv_path:
                break

        if not analog_csv_path:
            raise FileNotFoundError("ANALOG.csv not found in extracted zip.")

        return analog_csv_path

    except Exception as e:
        return FileNotFoundError(str(e))

def convert_to_hindi_date(date_str):
    # Month mapping
    hindi_months = {
        1: "जनवरी",
        2: "फ़रवरी",
        3: "मार्च",
        4: "अप्रैल",
        5: "मई",
        6: "जून",
        7: "जुलाई",
        8: "अगस्त",
        9: "सितंबर",
        10: "अक्टूबर",
        11: "नवंबर",
        12: "दिसंबर"
    }
    
    # Extract year and month
    year = int(date_str[:4])
    month = int(date_str[4:])

    # Convert to Hindi
    hindi_month = hindi_months.get(month, "")
    return f"{hindi_month} {year}"


def monthEndDate(letter_date):
    try:
        import datetime # to override any other datetime import
        year, month = letter_date.year, letter_date.month
        last_day = calendar.monthrange(year, month)[1]
        end_date = datetime.date(year, month, last_day)
        return end_date
    except Exception as e:
        return None

# Required functions for REMC Letters
def getStatesSystemType(request):
    try:
        sys_type = json.loads(request.body)['systemType']
        scada_point_qry = list(ScadaPointNameMapping.objects.filter(ot_type =  sys_type).values('State' ).distinct('State'))
        converted = [{'key': d['State'], 'value': d['State']} for d in scada_point_qry]
        # remove value contains Unknown
        converted = [d for d in converted if d['key'] != 'Unknown']
        return JsonResponse({'statesList': converted} , status=200, safe=False)
    
    except Exception as e:
        return [str(e)]
    
def telemetryIssuesTableREMC(monthyearid , state):
    try:
        # first get the substation list for the state
        substation_list = list(ScadaPointNameMapping.objects.filter(State = state ).values('Substation_Name' ).distinct('Substation_Name'))
        full_substation_list = [d['Substation_Name'] for d in substation_list] + [state]

        temp_scada_pointsummary_df = pd.DataFrame(HistoryScadaPointSummary.objects.filter(monthyearid = monthyearid , substation__in = full_substation_list ).values('remc_element_type' ,'substation','non_availability_percentage' ,'master_point_name' ,'master_seq_id') , columns= ['remc_element_type' ,'substation','non_availability_percentage','master_point_name' ,'master_seq_id'])
        # replace remc_element_type value INV with WTG
        temp_scada_pointsummary_df['remc_element_type'] = temp_scada_pointsummary_df['remc_element_type'].replace({'WTG': 'INV'})
    
        scada_point_names_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = state , ot_type = 'REMC').distinct('Point_Name' ,'seq_id').values('ELEMENT_DESCRIPTION' ,'Substation_Name','Point_Name' ,'seq_id' ) , columns=['ELEMENT_DESCRIPTION' , 'Substation_Name','Point_Name' ,'seq_id'])
      
        temp_scada_pointsummary_df_1 = temp_scada_pointsummary_df.copy()
        # filter where non_availability_percentage is > 98
        temp_scada_pointsummary_df_1 = temp_scada_pointsummary_df_1[temp_scada_pointsummary_df_1["non_availability_percentage"] >= 98]

        scada_pointsummary_df = pd.merge(temp_scada_pointsummary_df_1 , scada_point_names_df , left_on = ['master_point_name' , 'master_seq_id'] , right_on = ['Point_Name' ,'seq_id'] , how = 'left')
        # sort by substation name and remc_element_type
        scada_pointsummary_df = scada_pointsummary_df.sort_values(by=['Substation_Name','remc_element_type'])
        # Add serial number
        scada_pointsummary_df['slno'] = range(1, len(scada_pointsummary_df) + 1)
        scada_pointsummary_df = scada_pointsummary_df[['slno','Substation_Name','remc_element_type','ELEMENT_DESCRIPTION','non_availability_percentage']]

        # Define helper functions for conditions
        def telemetry_failure(x):
            return (x >= 98).sum()

        def intermittent(x):
            return ((x >= 5) & (x < 98)).sum()

        # Group by and aggregate
        result = (
            temp_scada_pointsummary_df.groupby(['remc_element_type', 'substation'])
            .agg(
                total_rows=('non_availability_percentage', 'count'),
                telemetry_failure=('non_availability_percentage', telemetry_failure),
                intermittent=('non_availability_percentage', intermittent)
            )
            .reset_index()
        )
        # Initialize summary list
        telemetry_summary = []

        # Unique substations
        for substation in result['substation'].unique():
            sub_df = result[result['substation'] == substation]
            
            # Helper to extract safely
            def get_vals(element):
                row = sub_df[sub_df['remc_element_type'] == element]
                if not row.empty:
                    return row.iloc[0]['total_rows'], row.iloc[0]['telemetry_failure'], row.iloc[0]['intermittent']
                return 0, 0, 0
            
            # Extract values by element type
            total_p, fail_p, inter_p = get_vals('PS')
            total_i, fail_i, inter_i = get_vals('INV')
            total_w, fail_w, inter_w = get_vals('WMS')
            
            telemetry_summary.append({
                'station_name': substation,
                'total_analog_p': total_p,
                'tel_failure_p': fail_p,
                'intermittent_p': inter_p,
                'total_analog_i': total_i,
                'tel_failure_i': fail_i,
                'intermittent_i': inter_i,
                'total_analog_w': total_w,
                'tel_failure_w': fail_w,
                'intermittent_w': inter_w
            })
        return telemetry_summary , scada_pointsummary_df.to_dict(orient='records')
    except Exception as e:
        return [str(e)] , []

def rename_scada_columns(df, prefix):
    """
    Renames the standard points columns to include the specified prefix (analog/digital).
    """
    # Normalize prefix to lowercase just in case
    p = prefix.lower()

    # Define the mapping
    column_mapping = {
        'completely_not_reporting_points': f'{p}_completely_not_reporting_points',
        'no_of_points': f'{p}_no_of_points'
    }
    # Rename and return
    # We use inplace=False by default to return a new object, or inplace=True to modify
    df.rename(columns=column_mapping, inplace=True)
    return df


def monthSummaryDetails(monthyearid ,  state , ot_type , filters):
    try:
        # 3. Execute a single query
        analog_qry = HistoryScadaMonthSummary.objects.filter(**filters)
        # 2. Add extra filter if needed
        if ot_type == 'REMC':
            analog_qry = analog_qry.filter(remc_element_type='all')

        df_analog = pd.DataFrame(list(analog_qry.values('substation', 'completely_not_reporting_points', 'no_of_points')) , columns= ['substation' , 'completely_not_reporting_points','no_of_points'])
        # Use the helper function for Analog
        rename_scada_columns(df_analog, 'analog')
        
        # 2. Fetch and Prepare Digital Data
        digital_qry = HistoryScadaMonthSummaryDigital.objects.filter(monthyearid=monthyearid, state=state)
        df_digital = pd.DataFrame(list(digital_qry.values('substation', 'completely_not_reporting_points', 'no_of_points')) ,columns= ['substation' , 'completely_not_reporting_points','no_of_points'])
        rename_scada_columns(df_digital, 'digital')
        
        # 3. Merge DataFrames
        if df_analog.empty and df_digital.empty:
            # Handle edge case where both are empty
            scada_month_summary_df = pd.DataFrame(columns=[
                'substation', 
                'analog_completely_not_reporting_points', 'analog_no_of_points',
                'digital_completely_not_reporting_points', 'digital_no_of_points'
            ])
        else:
            # Merge on substation. 'outer' ensures we keep substations that appear in only one list.
            scada_month_summary_df = pd.merge(df_analog, df_digital, on='substation', how='outer')
            # Fill NaN values with 0 (e.g., if a substation has no digital points, it shows as 0 instead of NaN)
            scada_month_summary_df = scada_month_summary_df.fillna(0)

      
        scada_point_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = state , ot_type = ot_type ).values('Substation_Name','Voltage_Level') , columns= ['Substation_Name','Voltage_Level'])
       
        scada_agg_result_df = scada_point_df.groupby("Substation_Name")["Voltage_Level"].max()
        # filter if Voltage_Level is >220
        scada_agg_result_df = scada_agg_result_df[scada_agg_result_df >= 220].reset_index()
        # change how = 'outer' to get all voltage levels , only 220 and above keep 'inner'
        merged_df = pd.merge(scada_month_summary_df , scada_agg_result_df , left_on = 'substation' , right_on = 'Substation_Name' , how = 'inner')
       
        merged_df['analog_percentage_number_of_points_non_reporting'] = merged_df.apply(
                lambda x: round(min((x['analog_completely_not_reporting_points'] / x['analog_no_of_points']) * 100, 100) ,2)  if x['analog_no_of_points'] != 0 else 0,
                axis=1
            )
        merged_df['digital_percentage_number_of_points_non_reporting'] = merged_df.apply(
                lambda x: round(min((x['digital_completely_not_reporting_points'] / x['digital_no_of_points']) * 100, 100) ,2)  if x['digital_no_of_points'] != 0 else 0,
                axis=1
            )
        return merged_df
    except Exception as e:
        return pd.DataFrame([str(e)] , columns=['substation' , 'analog_completely_not_reporting_points', 'analog_no_of_points', 'digital_completely_not_reporting_points', 'digital_no_of_points', 'Voltage_Level', 'analog_percentage_number_of_points_non_reporting', 'digital_percentage_number_of_points_non_reporting'])