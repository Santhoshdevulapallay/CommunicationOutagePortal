import json
from django.http import JsonResponse , FileResponse
from .models import SubstationList
from .extradb_errors import extractdb_errormsg
from .IntraState_models import IntraStateRequests, IntraStateElements
import os , pandas as pd
from datetime import datetime
from django.core.files.storage import default_storage
from django.db import connections

def getFileExt(file):
    try:
        return file.name.split('.')[1] 
    except Exception as e:
        return 

def save_file(request, key, folder, utility, todays_date):
    """Helper to safely fetch and save uploaded files."""
    file_obj = request.FILES.get(key)
    if file_obj:
        return default_storage.save(f"{folder}/{utility}_{todays_date}.{getFileExt(file_obj)}", file_obj)
    return None
  
def intraStateForm(request):
    try:
        all_requests = json.loads(request.POST['data'])['requests']
        # check the file folder IntraState if not exists create one
        if not os.path.exists('IntraState'):
            os.makedirs('IntraState')

        utility = json.loads(request.POST['data'])['user'] #utility name
        todays_date = datetime.now().strftime('%d%m%Y')
        count = 0
        
        for req in all_requests:
            # Save request-level files
            sld_path = save_file(request, f"requests[{count}][sld]", "IntraState", utility, todays_date)  #here requests[0][sld] in request.FILES
            subtop_path = save_file(request, f"requests[{count}][subtop]", "IntraState", utility, todays_date)
            oag_path = save_file(request, f"requests[{count}][devicefile]", "IntraState", utility, todays_date)

            # Create IntraState request object
            is_obj = IntraStateRequests.objects.create(
                utility=utility,
                type_of_request=req.get("typeOfRequest"),
                end_a_substation=req.get("endASubstation"),
                util_sld=sld_path,
                util_subtop=subtop_path,
                util_oag=oag_path,
                remarks=req.get("remarks", "")
            )
            
            # Save elements for this request
            for element_count, element in enumerate(req.get("elements", [])):
                elements_sld_path = save_file(
                    request,
                    f"requests[{count}][elements][{element_count}][sld]",
                    "IntraState",
                    utility,
                    todays_date
                )
                elements_subtop_path = save_file(
                    request,
                    f"requests[{count}][elements][{element_count}][subtop]",
                    "IntraState",
                    utility,
                    todays_date
                )
                IntraStateElements.objects.create(
                    element_fk=is_obj,
                    element_type=element.get("elementType", ""),
                    element_no=element.get("elementNo") or 0,
                    no_of_bays=element.get("noOfBays") or 0,
                    name_of_element=element.get("nameOfElement", ""),
                    date_of_charging=element.get("dateOfCharging"),
                    end_b_substation=element.get("endBSubstation", ""),
                    element_sld=elements_sld_path,
                    element_subtop=elements_subtop_path
                )

            count += 1

        return JsonResponse({"message" : 'Form created Successfully', "status": True},  status=200)
    
    except Exception as e:
        print(e)
        extractdb_errormsg(e)
        return JsonResponse({"message" : f'Failed to create , error is --  {str(e)}', "status": False},status=400 )

def getIntraStateReq(_):
    try:
        get_all_requests = pd.DataFrame(IntraStateRequests.objects.all().order_by('-intrastateelements__date_of_charging').values('utility', 'type_of_request', 'end_a_substation', 'util_sld', 'util_subtop', 'remarks','util_oag' ,'intrastateelements__element_type','intrastateelements__element_no' ,'intrastateelements__no_of_bays' ,'intrastateelements__name_of_element' ,'intrastateelements__date_of_charging' ,'intrastateelements__end_b_substation','intrastateelements__element_sld' ,'intrastateelements__element_subtop'))
        # replace nan with empty string
        
        get_all_requests = get_all_requests.fillna('')
        # replace column names from intrastateelements__ to blank
        get_all_requests.columns = [col.replace('intrastateelements__', '') for col in get_all_requests.columns]
        get_all_requests = get_all_requests.to_dict(orient='records')
        
        return JsonResponse({"data" : get_all_requests, "status": True} , safe=False)

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"message" : f'Failed to fetch , error is --  {str(e)}', "status": False},status=400 )
    
def getSubstationsList(request):
    try:
        formdata = json.loads(request.body)
        entity_name = formdata.get('entityName', None)
        # get id from SELECT * FROM public."Owner" where name = 'APTRANSCO'
        if entity_name != 'SRLDC':
            query = f"""
            SELECT "elementName" FROM public."Elements" where "elementType_id" = 13 AND "owner_id" = (SELECT id FROM public."Owner" where name = '{entity_name}')
            """
        else:
            query = """
            SELECT "elementName" FROM public."Elements" where "elementType_id" = 13
            """
        with connections['Trip_Database'].cursor() as cursor:
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = [dict(zip(columns, row)) for row in rows]
        flat_list = [item['elementName'] for item in data]
        
        get_all_substations = sorted(list(set(flat_list)))  # Remove duplicates
        return JsonResponse({"substations" : get_all_substations, "status": True} , safe=False)

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"message" : f'Failed to fetch , error is --  {str(e)}', "status": False},status=400 )
    

def downloadIntraStateUploads(request):
    try:
        file_path = json.loads(request.body)['fileurl']
        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True)
        
        else : return JsonResponse({"message" : f'File not found', "status": False},status=400 )

    except Exception as e:
        extractdb_errormsg(e)
        return  JsonResponse({"message" : f'File not found', "status": False},status=400 )