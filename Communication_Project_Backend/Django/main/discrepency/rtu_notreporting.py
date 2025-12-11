
import os , json
from fpdf import FPDF
import pandas as pd 
from django.http import JsonResponse , HttpResponse
import datetime
from .telemtery_dashboard import  substationsNotReporting
from .models import HistoryScadaMonthSummary , ScadaTelemetryReport , RTUMaster,ScadaPointNameMapping,ScadaPointNameMappingHistory
from docxtpl import DocxTemplate
from main.settings import base_dir 
from django.core.paginator import Paginator

# from .common import *
import zipfile
from io import BytesIO
from .extradb_errors import extractdb_errormsg , drive_folder_path
from django.db.models import Q
import pdb

def getRTUMasterData(request):
    try:
        rtu_master_df = pd.DataFrame(RTUMaster.objects.all().order_by('link').values())
        # drop id column
        if 'id' in rtu_master_df.columns:
            rtu_master_df.drop(columns=['id'], inplace=True)
        
        rtu_master_df.rename(columns={
            'link': 'Station',
            'protocol': 'Protocol',
            'responsibility': 'Responsibility',
            'linkMailList': 'Mail List',
            'mcc_m': 'Main Channel - Main',
            'mcc_s': 'Main Channel - Standby',
            'bcc_m': 'Backup Channel - Main',
            'bcc_s': 'Backup Channel - Standby'
        }, inplace=True)
        rtu_master = rtu_master_df.to_dict(orient='records')
        return JsonResponse({"data" : rtu_master, "status": True},  status=200)
    
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"data": [], "status": False, "error": str(e)}, status=400)
    

# def getSCADApointsMasterData(request):
#     try:
#         page = int(request.GET.get('page', 1))
#         page_size = int(request.GET.get('page_size', 1000))  # 100 per page
#         scada_points_df = pd.DataFrame(ScadaPointNameMapping.objects.all().order_by('state').values())
#         # drop id column
#         if 'id' in scada_points_df.columns:
#             scada_points_df.drop(columns=['id'], inplace=True)
        
#         paginator = Paginator(scada_points_df, page_size)
#         page_obj = paginator.get_page(page)
        
#         scada_points_df.rename(columns={
#             #'seq_id': 'Sequence Id',
#             'state': 'State',
#             'SubStation': 'Sub Station',
#             'Substation_Name': 'Substation Name',
#             'Voltage_Level': 'Voltage Level',
#             'ELEMENT_DESCRIPTION': 'Element Description',
#             'ELEMENT_CATEGORY': 'Element Category',
#             'Metric_Type': 'Metric Type',
#             'Point_Name': 'Point Name',
#             'IOA': 'IOA',
#             'ICCP_Name': 'ICCP Name',
#             'Part_Of_Island_Scheme': 'Part Of Island Scheme',
#             'ot_type': 'OT Type'
           
#         }, inplace=True)

#     except Exception as e:
#         extractdb_errormsg(e)
#     return JsonResponse({
#         "data": list(page_obj.object_list),
#         "status": True,
#         "page": page,
#         "total_pages": paginator.num_pages
#     })
        
#     #     data = list(page_obj.object_list.values())
#     #     return JsonResponse({
#     #     'results': data,
#     #     'total_pages': paginator.num_pages,
#     #     'total_records': paginator.count,
#     #     'current_page': page_obj.number,
#     # })

#         #ScadaPoints_master = scada_points_df.to_dict(orient='records')
#         #return JsonResponse({"data" : ScadaPoints_master, "status": True},  status=200)
    
#     # except Exception as e:
#     #     extractdb_errormsg(e)
#     #     return JsonResponse({"data": [], "status": False, "error": str(e)}, status=400)


def getSCADApointsMasterData(request):
    try:
        # --- Get format parameter (json/excel/csv)
        output_format = request.GET.get('format', 'json')  # default json
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 1000))  # default 1000

        # --- Get queryset and convert to DataFrame
        queryset = ScadaPointNameMapping.objects.filter(ot_type='SCADA').order_by('seq_id').values()
        scada_points_df = pd.DataFrame(queryset)

        # Drop 'id' column if exists
        if 'id' in scada_points_df.columns:
            scada_points_df.drop(columns=['id'], inplace=True)

        # Rename columns for frontend
        scada_points_df.rename(columns={
            'seq_id': 'Sequence_ID',
            'State': 'State',
            'SubStation': 'Sub Station',
            'Substation_Name': 'Substation Name',
            'Voltage_Level': 'Voltage Level',
            'ELEMENT_DESCRIPTION': 'Element Description',
            'ELEMENT_CATEGORY': 'Element Category',
            'Metric_Type': 'Metric Type',
            'Point_Name': 'Point Name',
            'IOA': 'IOA',
            'ICCP_Name': 'ICCP Name',
            'Part_Of_Island_Scheme': 'Part Of Island Scheme',
            'ot_type': 'OT Type'
           
        }, inplace=True)

        # --- If no data found
        if scada_points_df.empty:
            if output_format in ['excel', 'csv']:
                return HttpResponse("No records available", content_type="text/plain")
            return JsonResponse({
                "data": [], "status": True, "page": page,
                "total_pages": 0, "total_records": 0
            })

        # --- If download as Excel
        if output_format == 'excel':
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="scada_points.xlsx"'
            scada_points_df.to_excel(response, index=False)
            return response

        # --- If download as CSV
        if output_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="scada_points.csv"'
            scada_points_df.to_csv(response, index=False)
            return response

        # --- Otherwise: JSON pagination
        total_records = len(scada_points_df)
        total_pages = (total_records + page_size - 1) // page_size  # ceil division

        start = (page - 1) * page_size
        end = start + page_size
        page_data = scada_points_df.iloc[start:end].to_dict(orient='records')

        return JsonResponse({
            "data": page_data,
            "status": True,
            "page": page,
            "total_pages": total_pages,
            "total_records": total_records
        }, safe=False, status=200)

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({
            "data": [], "status": False, "error": str(e)
        }, status=400)

    
def getEntitiesDetailsForRTU():
    try: 
        entity_list = RTUMaster.objects.values_list('link', flat=True).distinct()
        entity_list = [entity for entity in entity_list if entity is not None and entity.strip() != ''] 
        entity_list = list(set(entity_list))  # Remove duplicates
        entity_list.sort()  # Sort alphabetically
       
        return entity_list
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse([str(e)],status=400 )

def convertStrToTimestamp(timestamp_str):
    try:
        from datetime import datetime, timedelta
        # Convert to datetime object if not None
        if timestamp_str:
            try:
                timestamp_value_tmp = datetime.fromisoformat(timestamp_str)
                timestamp_value = timestamp_value_tmp - timedelta(hours=5, minutes=30)
            except ValueError:
                timestamp_value = None  # If format is wrong
        else:
            timestamp_value = None
        return timestamp_value
    except Exception as e:
        extractdb_errormsg(e)
        return None

def getLatestRecordsDF():
    try:
        # get latest 10 records
        latest_records_df = pd.DataFrame(ScadaTelemetryReport.objects.all().order_by('-id')[:50].values('createdDate' ,'link','channel_type','mainChannel','mainOutageTime','mainChannelStatus','standByChannel','standByOutageTime' ,'standByChannelStatus' ,'mainactionNeeded','standbyactionNeeded','mail_sent') ,columns=['createdDate' ,'link','channel_type','mainChannel','mainOutageTime','mainChannelStatus','standByChannel','standByOutageTime' ,'standByChannelStatus' ,'mainactionNeeded','standbyactionNeeded','mail_sent'])
        # conver mail sent bool to string
        latest_records_df['mail_sent'] = latest_records_df['mail_sent'].apply(lambda x: 'Yes' if x else 'No')
        latest_records_df.rename(columns={
            'createdDate': 'Created Date',
            'link': 'Station',
            'channel_type': 'Channel Type',
            'mainChannel': 'Main Channel',
            'mainOutageTime': 'Main Outage Time',
            'mainChannelStatus': 'Main Channel Status',
            'mainactionNeeded': 'Main Action Needed',
            'standByChannel': 'Stand By Channel',
            'standByOutageTime': 'Stand By Outage Time',
            'standByChannelStatus': 'Stand By Channel Status',
            'standbyactionNeeded': 'Standby Action Needed',
            'mail_sent':'Mail Sent'
        }, inplace=True)
      
        return latest_records_df
    except Exception as e: 
        extractdb_errormsg(e)
        return None

def getRTUDailyDates():
    try:
        # get unique dates from SCADA Telemetry
        return list( ScadaTelemetryReport.objects.values_list('createdDate', flat=True).distinct().order_by('-createdDate'))
    except Exception as e:
        extractdb_errormsg(e)
        return []
    
def getLatestRTUData(request):
    try:
        entity_list = getEntitiesDetailsForRTU()

        latest_records = getLatestRecordsDF().to_dict(orient='records')

        report_dates = getRTUDailyDates()
        # get latest date from SCADATelemetryReport table
        previous_day = ScadaTelemetryReport.objects.values_list('createdDate', flat=True).exclude(createdDate__isnull = True).distinct().order_by('-createdDate').first()
        if not previous_day:
            previous_day = datetime.datetime.now() - datetime.timedelta(days=1)

        previous_day_records = ScadaTelemetryReport.objects.filter(createdDate=previous_day).values('link', 'channel_type', 'mainChannel', 'mainOutageTime', 'mainChannelStatus', 'standByChannel', 'standByOutageTime', 'standByChannelStatus', 'mainactionNeeded', 'standbyactionNeeded')
        
        previous_day_records_df = pd.DataFrame(previous_day_records , columns = ['link', 'channel_type', 'mainChannel', 'mainOutageTime', 'mainChannelStatus', 'standByChannel', 'standByOutageTime', 'standByChannelStatus', 'mainactionNeeded', 'standbyactionNeeded'])
        # group by link ,and channel_type to m_cc and b_cc for all other fields make main and backup
        
        result_df = previous_day_records_df.pivot_table(index='link', columns='channel_type' ,aggfunc='first' ,dropna=False )

        # Flatten multi-level columns
        result_df.columns = [f"{col2}_{col1}" for col1, col2 in result_df.columns]
        result_df = result_df.reset_index()
        
        # Rename columns to desired format
        result_df = result_df.rename(columns={
            'link': 'station',
            'MCC_mainChannel': 'mcc_m_status',
            'MCC_standByChannel': 'mcc_s_status',
            'MCC_mainOutageTime': 'mcc_dateTime1',
            'MCC_standByOutageTime': 'mcc_dateTime2',
            'MCC_mainChannelStatus': 'mccremarks1',
            'MCC_standByChannelStatus': 'mccremarks2',
            'MCC_mainactionNeeded': 'mccactionNeeded1',
            'MCC_standbyactionNeeded': 'mccactionNeeded2',
            
            'BCC_mainChannel': 'bcc_m_status',
            'BCC_standByChannel': 'bcc_s_status',
            'BCC_mainOutageTime': 'bcc_dateTime1',
            'BCC_standByOutageTime': 'bcc_dateTime2',
            'BCC_mainChannelStatus': 'bccremarks1',
            'BCC_standByChannelStatus': 'bccremarks2',
            'BCC_mainactionNeeded': 'bccactionNeeded1',
            'BCC_standbyactionNeeded': 'bccactionNeeded2',
        })
      
        return JsonResponse({"status": True , "data" : [entity_list , latest_records , report_dates , result_df.to_dict(orient='records')] }, status=200)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"status": False, "error": str(e)}, status=400)
        
def get_status_list(value):
    return ["Reporting", "Not Reporting"] if value == "Provided" else ["Not Provided"]

def rtuMasterChange(request):
    try:
        # if request.content_type != 'application/json':
        #     return JsonResponse({"status": False, "error": "Invalid content type"}, status=400)

        formdata = json.loads(request.body)
        station = formdata['value']
        if not station:
            return JsonResponse({"status": False, "error": "Station not provided"}, status=400)

        # get required details from RTUMaster
        rtu_master = RTUMaster.objects.filter(link=station).values().first()
        if not rtu_master:
            return JsonResponse({"status": False, "error": "RTU Master data not found for the station."}, status=404)
      
        mcc_m_list = get_status_list(rtu_master.get('mcc_m'))
        mcc_s_list = get_status_list(rtu_master.get('mcc_s'))
        bcc_m_list = get_status_list(rtu_master.get('bcc_m'))
        bcc_s_list = get_status_list(rtu_master.get('bcc_s'))
        
        return JsonResponse({"status": True, "data": [mcc_m_list , mcc_s_list ,bcc_m_list ,bcc_s_list]}, status=200)
    
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"status": False, "error": str(e)}, status=400)
    
def saveRTUMasterTable(request):
    try:
        edited_rows = json.loads(request.body)
        # update RTUMaster table
        for row in edited_rows:
            RTUMaster.objects.filter(link=row['Station']).update(
                protocol=row['Protocol'],
                responsibility=row['Responsibility'],
                linkMailList=row['Mail List'],
                mcc_m=row['Main Channel - Main'],
                mcc_s=row['Main Channel - Standby'],
                bcc_m=row['Backup Channel - Main'],
                bcc_s=row['Backup Channel - Standby']
            )
        return JsonResponse({"status": True ,'message':'Fields updated successfully'}, status=200)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"status": False, "error": str(e)}, status=400)
    

   

def saveSCADAPointsMasterTable(request):
    # try:
        #pdb.set_trace()
    edited_rows = json.loads(request.body)
    # update SCADAPointName table
    for row in edited_rows:
        ScadaPointNameMappingHistory.objects.filter(seq_id=row['Sequence_ID']).update(
            State=row['State'],
            Substation=row['Substation'],
            Substation_Name=row['Substation Name'],
            Voltage_Level=row['Voltage Level'],
            ELEMENT_DESCRIPTION=row['Element Description'],
            ELEMENT_CATEGORY=row['Element Category'],
            Metric_Type=row['Metric Type'],
            Point_Name=row['Point Name'],
            IOA=row['IOA'],
            ICCP_Name=row['ICCP Name'],
            Part_Of_Island_Scheme=row['Part Of Island Scheme'],
            ot_type=row['OT Type']
        )
    return JsonResponse({"status": True ,'message':'Fields updated successfully'}, status=200)
    # except Exception as e:
    #     extractdb_errormsg(e)
    #     return JsonResponse({"status": False, "error": str(e)}, status=400)


    
def update_row(row, df, ctype):
    # Map columns based on type
    col_map = {
        'MCC': ('mcc_m_status', 'mcc_s_status'),
        'BCC': ('bcc_m_status', 'bcc_s_status')
    }
    main_status_str, standby_status_str = col_map.get(ctype, (None, None))
    if not main_status_str:
        return row  # invalid ctype, just return

    # Find match for station
    match = df[df['link'] == row['station']]
    if match.empty:
        # No match found → both not provided
        row[main_status_str] = 'Not Provided'
        row[standby_status_str] = 'Not Provided'
        return row

    # Get statuses quickly
    main_status = match.at[match.index[0], 'mainChannel']
    standby_status = match.at[match.index[0], 'standByChannel']

    # Apply rules
    if main_status == 'Not Provided':
        row[main_status_str] = 'Not Provided'
    if standby_status == 'Not Provided':
        row[standby_status_str] = 'Not Provided'

    return row
 
def saveRTUNotReporting(request):
    try:
        from datetime import datetime, timedelta
        in_data = json.loads(request.body)  
        today = datetime.now().date()  # Get today's date
        get_unique_links = [record['station'] for record in in_data['selectedrows']]
        rtu_master_records_df = pd.DataFrame(RTUMaster.objects.filter(link__in=get_unique_links).values('link', 'mcc_m', 'mcc_s', 'bcc_m', 'bcc_s'))

        mcc_df = rtu_master_records_df[['link', 'mcc_m', 'mcc_s']].rename(columns={'mcc_m': 'mainChannel', 'mcc_s': 'standByChannel'})
        bcc_df = rtu_master_records_df[['link', 'bcc_m', 'bcc_s']].rename(columns={'bcc_m': 'mainChannel', 'bcc_s': 'standByChannel'})

        def adjust_datetime_fields(row):
            """Convert UTC ISO strings ending with Z to IST (+5:30)."""
            for key, value in row.items():
                if isinstance(value, str) and "dateTime" in key and value.endswith("Z"):
                    dt = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
                    dt = dt + timedelta(hours=5, minutes=30)
                    row[key] = dt.strftime("%Y-%m-%dT%H:%M")
            return row

        def process_row(row, df, prefix):
            """Update row with MCC/BCC info and return extracted fields."""
            row = update_row(row, df, prefix)

            main_status = row[f"{prefix.lower()}_m_status"]
            standby_status = row[f"{prefix.lower()}_s_status"]

            main_outage_time = (
                convertStrToTimestamp(row[f"{prefix.lower()}_dateTime1"])
                if main_status not in ("Not Provided", "Reporting")
                else None
            )
            standby_outage_time = (
                convertStrToTimestamp(row[f"{prefix.lower()}_dateTime2"])
                if standby_status not in ("Not Provided", "Reporting")
                else None
            )

            return {
                "channelType": prefix,
                "mainChannel": main_status,
                "standbyChannel": standby_status,
                "mainOutageTime": main_outage_time,
                "standbyOutageTime": standby_outage_time,
                "mainRemarks": row[f"{prefix.lower()}remarks1"],
                "standbyRemarks": row[f"{prefix.lower()}remarks2"],
                "mainAction": row[f"{prefix.lower()}actionNeeded1"],
                "standbyAction": row[f"{prefix.lower()}actionNeeded2"],
            }

        processed_keys = []
        for row in in_data['selectedrows']:
            # Adjust all datetime fields first
            row = adjust_datetime_fields(row)
            
            for prefix, df in [("MCC", mcc_df), ("BCC", bcc_df)]:
                data = process_row(row, df, prefix)
                # Store the key combination
                key = (row["station"], data["channelType"], today)
                processed_keys.append(key)

                ScadaTelemetryReport.objects.update_or_create(
                        link=row["station"],
                        channel_type=data["channelType"],
                        createdDate=today,
                        defaults={
                            "mainChannel": data["mainChannel"],
                            "mainOutageTime": data["mainOutageTime"],
                            "mainChannelStatus": data["mainRemarks"],
                            "standByChannel": data["standbyChannel"],
                            "standByOutageTime": data["standbyOutageTime"],
                            "standByChannelStatus": data["standbyRemarks"],
                            "mainactionNeeded": data["mainAction"],
                            "standbyactionNeeded": data["standbyAction"],
                            "createdDate": today,
                            "mail_sent": False,
                        },
                    )
                
        # ---- Delete old records not in processed_keys ----
        if processed_keys:
            q_objects = Q()
            for link, ctype, _ in processed_keys:
                q_objects |= Q(link=link, channel_type=ctype, createdDate=today)

            ScadaTelemetryReport.objects.filter(createdDate=today).exclude(q_objects).delete()       
                
        return JsonResponse({"status": True , "data" : [getLatestRecordsDF().to_dict(orient='records') , getRTUDailyDates() ]}, status=200)
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"status": False },status=400 )


def newRTUCreate(request):
    try:
        formdata = json.loads(request.body)
        RTUMaster(
            link = formdata['station'],
            protocol = formdata['protocol'],
            responsibility =formdata['responsibility'],
            linkMailList = formdata['mailList'],
            mcc_m = formdata['mainChannelMain'],
            mcc_s =formdata['mainChannelStandby'],
            bcc_m = formdata['backupChannelMain'],
            bcc_s = formdata['backupChannelStandby'],
        ).save()

        return JsonResponse({"message" : 'RTU added successfully', "status": True},  status=200)
    
    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"message" : f'Failed to create , error is --  {str(e)}', "status": False},status=400 )

def get_latest_modified_file(folder_path):
      files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
      files_with_timestamp = [(f, os.path.getmtime(os.path.join(folder_path, f))) for f in files]
      latest_file = max(files_with_timestamp, key=lambda x: x[1], default=(None, None))
      return latest_file[0]

def downloadLoggerFile(request):
    latest_file_name = get_latest_modified_file(drive_folder_path)
    if latest_file_name:
        file_path = os.path.join(drive_folder_path, latest_file_name)
        with open(file_path, 'rb') as file_content:
            response = HttpResponse(file_content, content_type='text/plain')
            response['Content-Disposition'] = f'attachment; filename="{latest_file_name}"'
            return response
    else:
        return HttpResponse("No log files found in the specified folder.")