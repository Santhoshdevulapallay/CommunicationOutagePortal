from django.http import JsonResponse
from .Point_Models import HistoryScadaDigitalIccpPointSummary , HistoryScadaDigitalFepPointSummary
import json , pandas as pd
from .models import ScadaPointNameMapping 

indianStatesWithFep = ('AP' ,'TG' ,'KA' ,'KL' ,'TN' ,'PY','SR1','SR2' )
metric_types_exclude = ['KV','HZ','MW' ,'MVAR' ,'OLTC']

def digitalPointDetailsSummary(request):
    try:
        data = json.loads(request.body)
        monthyearid = data.get('monthyearid')
        indianState = data.get('indianState')
        substation = data.get('substation')
        systemType = data.get('systemType')

        if not monthyearid or not indianState or not substation:
            return JsonResponse({'status': 'error', 'message': 'Month and Year are required.'}, status=400)
        #  get master_seq and point_name from SCADA_Point_Name_Mapping table
        scada_point_df = pd.DataFrame( ScadaPointNameMapping.objects.filter(State = indianState, Substation_Name = substation , ot_type = systemType).exclude(Metric_Type__in = metric_types_exclude).values('seq_id', 'Point_Name','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type') , columns=['seq_id', 'Point_Name','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type'])

        if scada_point_df.empty:
            return JsonResponse({'status': 'error', 'message': 'No point mapping found for the given criteria.'}, status=404)
        
        if indianState in indianStatesWithFep:
            fep_df = pd.DataFrame( HistoryScadaDigitalFepPointSummary.objects.filter(MonthYearID=monthyearid , State = indianState , substation_name = substation).values('id','master_seq_id','master_point_name','Non_Availability_Percentage','Non_Availability_Percentage_PrevMonth','telemetry_failure','field_replaced_bad_quality','reporting_open_close','reporting_between_invalid','Status','Remarks') , columns = ['id','master_seq_id','master_point_name','Non_Availability_Percentage','Non_Availability_Percentage_PrevMonth','telemetry_failure','field_replaced_bad_quality','reporting_open_close','reporting_between_invalid','Status','Remarks'] )
            merged_df = pd.merge(fep_df, scada_point_df, left_on=['master_seq_id','master_point_name'], right_on=['seq_id','Point_Name'], how='inner')
        else:
            iccp_df = pd.DataFrame( HistoryScadaDigitalIccpPointSummary.objects.filter(MonthYearID=monthyearid , State = indianState , substation_name = substation).values() )
            merged_df = pd.merge(iccp_df, scada_point_df, left_on=['master_seq_id','master_point_name'], right_on=['seq_id','Point_Name'], how='inner')
        # drop seq_id and Point_Name columns
        merged_df = merged_df.drop(columns=['master_seq_id', 'master_point_name','seq_id','Point_Name'])
        # bring ELEMENT_DESCRIPTION , ELEMENT_CATEGORY , Metric_Type to the front
        merged_df = merged_df[['ELEMENT_DESCRIPTION', 'ELEMENT_CATEGORY', 'Metric_Type'] + [col for col in merged_df.columns if col not in ['ELEMENT_DESCRIPTION', 'ELEMENT_CATEGORY', 'Metric_Type']]]

        merged_df = merged_df.fillna('')
        summary_list = merged_df.to_dict(orient='records')
        return JsonResponse({'status': 'success', 'data': summary_list}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


    
def updateDigitalPoint(request):
    try:
        formdata = json.loads(request.body)
        record_id = formdata.get('selectedRowData')['id']
        status = formdata.get('status')
        remarks = formdata.get('remarks')
        timeline = formdata.get('timeline')
        indianState = formdata.get('params').get('indianState')
        
        if not record_id:
            return JsonResponse({'status': 'error', 'message': 'Record ID is required.'}, status=400)

        # Determine if the record is in FEP or ICCP table
        if HistoryScadaDigitalFepPointSummary.objects.filter(id=record_id).exists():
            point_record = HistoryScadaDigitalFepPointSummary.objects.get(id=record_id)
        elif HistoryScadaDigitalIccpPointSummary.objects.filter(id=record_id).exists():
            point_record = HistoryScadaDigitalIccpPointSummary.objects.get(id=record_id)
        else:
            return JsonResponse({'status': 'error', 'message': 'Record not found.'}, status=404)

        point_record.Status = status
        point_record.Remarks = remarks
        point_record.TimeLine = timeline
        point_record.save()

        return JsonResponse({'status': 'success', 'message': 'Record updated successfully.'}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)