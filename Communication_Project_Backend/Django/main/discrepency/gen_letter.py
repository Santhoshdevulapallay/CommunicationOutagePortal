
import os , json
import pandas as pd 
from django.http import JsonResponse , HttpResponse
import datetime
from .telemtery_dashboard import  substationsNotReporting
from .models import HistoryScadaMonthSummary , EntityAddress , ScadaPointNameMapping
from docxtpl import DocxTemplate
from main.settings import base_dir
from .common import *
import zipfile , numpy as np
from io import BytesIO
from django.db import connections

from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from django.http import HttpResponse, JsonResponse
import json, os, zipfile
from .Point_Models import HistoryScadaDigitalIccpPointSummary , HistoryScadaDigitalFepPointSummary


def createfolderforLetters(start_date,end_date):
    try:
        foldername = "Letters\\"+ start_date.strftime('%d-%m-%Y')+'&'+end_date.strftime('%d-%m-%Y')+'\\'
        try:   
            if not os.path.exists(os.path.dirname(foldername)):
                os.makedirs(os.path.dirname(foldername))
        except IOError:
            pass

    except Exception as e:
        pass


def addSignBottom(pdf , img_path , entity_name , authroizedname):
    try:
        # add signature to bottom corner of the page
        # Signature image dimensions
        signature_width = 40  # in mm
        signature_height = 20  # in mm

        # Padding from edges
        right_padding = 10  # mm
        bottom_padding = 20  # mm (leave space for name below image)

        # Coordinates for the image
        img_x = pdf.w - signature_width - right_padding
        img_y = pdf.h - signature_height - bottom_padding

        # Add the signature image to bottom-right
        pdf.image(img_path, x=img_x, y=img_y, w=signature_width, h=signature_height)
        # Set Y position just below the image
        text_y = img_y + signature_height + 5  # Adjust gap if needed

        # Set font
        pdf.set_font("Times", "BI" ,size=12)

        # Left-aligned entity name
        pdf.text(x=10, y=text_y, txt=f"( {entity_name} )")  # 10mm is typical left margin

        # Right-aligned authorized name
        right_text = f"( {authroizedname} )"
        right_text_width = pdf.get_string_width(right_text)
        right_margin = 10  # 10mm from right edge
        pdf.text(x=pdf.w - right_text_width - right_margin, y=text_y, txt=right_text)

        return pdf
    except:
        return pdf

def Tableheader(pdf , table_header):
    try:
        pdf.set_font("Courier", "BU", 16)
        pdf.cell(0, 10, table_header, ln=True, align="C")
        return pdf
    
    except:
        return pdf

# Function to get the first day of a month N months before a given date
def get_previous_month(date_, months_back):
    from datetime import date
    year = date_.year
    month = date_.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    
    return date(year, month, 1)

def categoryMetricVoltage(df):
    try:
        # Step 1: Group by voltage_level and element_category
        grouped = df.groupby(['Voltage_Level', 'ELEMENT_CATEGORY' ,'Metric_Type']).size().reset_index(name='count')

        # Step 2: Combine element_category and voltage_level into a new string column
        grouped['text'] = grouped['ELEMENT_CATEGORY'] + '_' + grouped['Metric_Type'] + '_' +grouped['Voltage_Level'].astype(str)

        # Step 3: Arrange the columns nicely
        category_df = grouped[['text', 'count']]
        temp_category_df = category_df.copy()
        temp_category_df.rename(columns = {'count' : 'point'} ,inplace = True)
        temp_category_df.insert(0, 'slno', range(1, len(temp_category_df) + 1))
    
        return temp_category_df.to_dict(orient = 'records')

    except Exception as e:
        return [str(e)]
    
def replace_substn_with_name(latest_df, substation_master_df):
    """
    Replace 'Substn' in latest_df with corresponding 'Substation_Name' from substation_master_df.

    Parameters:
        latest_df (pd.DataFrame): DataFrame with 'Substn' column.
        substation_master_df (pd.DataFrame): DataFrame with 'Substation' and 'Substation_Name'.

    Returns:
        pd.DataFrame: Updated DataFrame with 'Substn' replaced by 'Substation_Name'.
    """
    # Create a mapping dictionary
    mapping = dict(zip(substation_master_df['Substation'], substation_master_df['Substation_Name']))

    # Replace Substn values using the mapping
    updated_df = latest_df.copy()
    updated_df['Substn'] = updated_df['Substn'].map(mapping).fillna(updated_df['Substn'])
    
    return updated_df


def get_ict_flows(substations ,  month_start_date , month_end_date , percentageError,substation_master_df):
    try:
        # Build placeholders for IN clause dynamically
        placeholders = ', '.join(['%s'] * len(substations))
        query = f"""
            SELECT "Substn" , "Description" , "XFMR_P (MW)" , "XFMR_S (MW)" ,"time" from "ICT_Pair_Check"  WHERE time >= %s and time <= %s  and "Substn" in ({placeholders})
           """
    
        params = [month_start_date.strftime('%Y-%m-%d')] + [month_end_date.strftime('%Y-%m-%d')] + substations 

        with connections['SCADAHabitat'].cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = [dict(zip(columns, row)) for row in rows]
        result_df = pd.DataFrame(data , columns = ['Substn' , 'Description' , 'XFMR_P (MW)' , 'XFMR_S (MW)' ,'time'] )
        # rename columns
        result_df.rename(columns = {'XFMR_P (MW)' : 'XFMR_P' , 'XFMR_S (MW)' : 'XFMR_S' } ,inplace = True)

        # add extra column as Difference (kV) after adding XFMR_P and XFMR_S , round 
        result_df['Difference'] = result_df['XFMR_P'] + result_df['XFMR_S']
        # round off to 2 digits
        result_df['Difference'] = result_df['Difference'].round(2)
        # # group by Substn and count
        grouped = result_df.groupby("Substn").size().reset_index(name="count")
        # # add percentage column
        grouped["percentage"] = (grouped["count"] / 10800 )* 100
        # filter Difference > 50
        grouped = grouped[grouped['percentage'] > percentageError]
        # Ensure time column is datetime
        result_df["time"] = pd.to_datetime(result_df["time"])
        # Filter by Substn list
        filtered_df = result_df[result_df["Substn"].isin(grouped['Substn'])]

        # Get the latest record for each Substn
        latest_df = (
            filtered_df.sort_values("time")
            .groupby("Substn", as_index=False)
            .last()
        )
        # drop time column from latest_df
        latest_df = latest_df.drop(columns=["time"])
        # replace substn with substation name
        temp_df = replace_substn_with_name(latest_df, substation_master_df)
        return temp_df.to_dict(orient = 'records')
    except Exception as e:
        extractdb_errormsg(str(e))
        return []
    
def get_line_flows(substations ,  month_start_date , month_end_date ,percentageError):
    try:
        # Build placeholders for IN clause dynamically
        placeholders = ', '.join(['%s'] * len(substations))
        query = f"""
            WITH MismatchCount AS (
                SELECT "Line_ID", "Line Desc",
                    COUNT(*) AS "Mismatches"
                FROM "Line_Pair_Check"
                WHERE time >= %s and time <= %s  
                AND "Loss" > %s 
                AND "bus1" in ({placeholders})
                GROUP BY "Line_ID", "Line Desc"
            ),
            TotalTimeCount AS (
                SELECT COUNT(DISTINCT "time") AS "total_times"
                FROM "Line_Pair_Check"
                WHERE time >= %s and time <= %s 
                AND "bus1" in ({placeholders})
            )
            SELECT M."Line_ID", M."Line Desc",
                M."Mismatches", 
                T."total_times",
                (M."Mismatches"::float / T."total_times") * 100 AS "Percentage"
            FROM MismatchCount M, TotalTimeCount T;
           """
    
        params = [month_start_date.strftime('%Y-%m-%d')] + [month_end_date.strftime('%Y-%m-%d')] + percentageError + substations + [month_start_date.strftime('%Y-%m-%d')] + [month_end_date.strftime('%Y-%m-%d')] + substations 

        with connections['SCADAHabitat'].cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = [dict(zip(columns, row)) for row in rows]
        result_df = pd.DataFrame(data , columns = [ "Line_ID"  ,"Line Desc" , "Mismatches" , "total_times" ,"Percentage"] )
        # greater than 50
        result_df = result_df[result_df['Percentage'] > percentageError].reset_index() 
        #**************** Unique Line Flows *****************
        # get unique line ids ** using these Line IDS calculate latest flow details
        unique_line_ids = result_df['Line_ID'].unique().tolist()
        placeholders2 = ', '.join(['%s'] * len(unique_line_ids))
        query2 = f"""
                SELECT DISTINCT ON ("Line Desc")  "Line Desc", "MW1", "MW2" , "time"
                FROM "Line_Pair_Check"
                WHERE "Line_ID" IN ({placeholders2})
                AND time >= %s 
            """
        # get yesterday date
        previous_day = datetime.today() - timedelta(days=1)
        params2 = unique_line_ids + [previous_day.strftime('%Y-%m-%d')]

        with connections['SCADAHabitat'].cursor() as cursor2:
            cursor2.execute(query2, params2)
            columns = [col[0] for col in cursor2.description]
            rows = cursor2.fetchall()

        data1 = [dict(zip(columns, row)) for row in rows]
        line_latest_flows_df = pd.DataFrame(data1 , columns = [ "Line Desc" , "MW1" , "MW2" ,"time"] )
        # sum MW1 and MW2 to get Total_MW
        line_latest_flows_df['Loss'] = line_latest_flows_df['MW1'] + line_latest_flows_df['MW2']
        # round off to 2 digits
        line_latest_flows_df['Loss'] = line_latest_flows_df['Loss'].round(2)
        # rename Line Desc column to Line_Desc
        line_latest_flows_df.rename(columns = {'Line Desc' : 'Line_Desc' } ,inplace = True)
        # Get the latest record for each Substn
        latest_df = (
            line_latest_flows_df.sort_values("time")
            .groupby("Line_Desc", as_index=False)
            .last()
        )
        # drop time column from latest_df
        latest_df = latest_df.drop(columns=["time"]) 
        return latest_df.to_dict(orient = 'records')
    except Exception as e:
        extractdb_errormsg(str(e))
        return []
    
# def get_kcl_flows(substations ,  month_start_date , month_end_date , percentageError , substation_master_df):
#     try:
#         # Build placeholders for IN clause dynamically
#         placeholders = ', '.join(['%s'] * len(substations))
#         query = f"""
#             WITH MismatchCount AS (
#                 SELECT "BUS", 
#                     COUNT(*)/2 AS "Mismatches"
#                 FROM "KCL_Substation_Flows"
#                 WHERE time >= %s AND  "BUS" in ({placeholders})
#                 AND abs("KCL") > %s 
#                 GROUP BY "BUS"
#             ),
#             TotalTimeCount AS (
#                 SELECT COUNT(DISTINCT "time") AS "total_times"
#                 FROM "KCL_Substation_Flows"
#                 WHERE time >= %s
#             )
#             SELECT M."BUS",
#                 M."Mismatches", 
#                 T."total_times",
#                 (M."Mismatches"::float / T."total_times") * 100 AS "Percentage"
#             FROM MismatchCount M, TotalTimeCount T;
#         """
    
#         params = [month_start_date.strftime('%Y-%m-%d')] + substations + percentageError +[month_end_date.strftime('%Y-%m-%d')]

#         with connections['SCADAHabitat'].cursor() as cursor:
#             cursor.execute(query, params)
#             columns = [col[0] for col in cursor.description]
#             rows = cursor.fetchall()

#         data = [dict(zip(columns, row)) for row in rows]
#         result_df = pd.DataFrame(data , columns = ['BUS' ,'Mismatches','total_times' ,'Percentage'] )
#         # filter percentage 
#         result_df = result_df[result_df['Percentage'] > percentageError]
#         # replace substn with substation name
#         temp_df = replace_substn_with_name(result_df, substation_master_df)
#         return temp_df.to_dict(orient = 'records')
#     except Exception as e:
#         extractdb_errormsg(str(e))
#         return pd.DataFrame([e] ,  columns = ['BUS' ,'Mismatches','total_times' ,'Percentage'])
    

    
def get_busflows_voltagewise(latest_time , placeholders , substations , voltage_level):
    try:
        if voltage_level == 400:
            query = """
                    SELECT
                        "SUBSTN",
                        ABS(MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B1%%' AND "Value" <> 0) - MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B2%%' AND "Value" <> 0)) AS "Difference" ,
                        MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B1%%' AND "Value" <> 0) AS "4B1",
                        MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B2%%' AND "Value" <> 0) AS "4B2" ,
                        "KV"
                        FROM "BusVoltageMismatch"
                        WHERE "Time" = %s
                        AND "SUBSTN" IN ({})
                        AND "KV" = %s
                        GROUP BY "SUBSTN" ,"KV"
                        ORDER BY "SUBSTN"
                """.format(placeholders)
            columns = ['SUBSTN' ,'KV','4B1' ,'4B2' ,'Difference']
        elif voltage_level == 220:
            query = """
                    SELECT
                        "SUBSTN",
                        ABS(MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B1%%' AND "Value" <> 0) - MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B2%%' AND "Value" <> 0)) AS "Difference",
                        MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B1%%' AND "Value" <> 0) AS "2B1",
                        MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B2%%' AND "Value" <> 0) AS "2B2" ,
                        "KV"
                        FROM "BusVoltageMismatch"
                        WHERE "Time" = %s
                        AND "SUBSTN" IN ({})
                        AND "KV" = %s
                        GROUP BY "SUBSTN" ,"KV"
                        ORDER BY "SUBSTN"
                """.format(placeholders)
            columns = ['SUBSTN' ,'KV','2B1' ,'2B2' ,'Difference']
            
        else : return []

        params = [latest_time , *substations , voltage_level]
        with connections['SE_Database'].cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
        data = [dict(zip(columns, row)) for row in rows]
        
        result_df = pd.DataFrame(data , columns = columns)
        # drop rows contains NaN
        result_df = result_df.dropna()
        # rename 4B1 to BUS1 and 4B2 to BUS2 or 2B1 to BUS1 and 2B2 to BUS2
        result_df.rename(columns={
            400: {'4B1': 'BUS1', '4B2': 'BUS2'},
            220: {'2B1': 'BUS1', '2B2': 'BUS2'}
        }.get(voltage_level, {}), inplace=True)
        # filter Difference > 5
        result_df = result_df[result_df['Difference'] > 5].reset_index(drop=True)
        return result_df
    except Exception as e:
        extractdb_errormsg(str(e))
        return pd.DataFrame(data , columns = ['SUBSTN' ,'KV','BUS1' ,'BUS2' ,'Difference'] )

def bus_flows_problematic_percentage(substations ,  placeholders , voltage_level , month_start_date , month_end_date ,percentageError ):
    try:
        if voltage_level == 400:
            query = f"""
                    WITH DiffPerTime AS (
                        SELECT
                            "Time",
                            "SUBSTN",
                            ABS(MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B1%%' AND "Value" <> 0) - MIN("Value") FILTER (WHERE "BUS" LIKE '%%4B2%%' AND "Value" <> 0)) AS "Difference" 
                        FROM "BusVoltageMismatch"
                        WHERE "Time" >= %s AND "Time" <= %s
                        AND "SUBSTN" IN ({placeholders})
                        AND "KV" = %s
                        GROUP BY "Time", "SUBSTN"
                    ),
                    MismatchCount AS (
                        SELECT
                            "SUBSTN",
                            COUNT(*) AS mismatches
                        FROM DiffPerTime
                        WHERE "Difference" > 5
                        GROUP BY "SUBSTN"
                    ),
                    TotalTimeCount AS (
                        SELECT COUNT(DISTINCT "Time") AS total_times
                        FROM "BusVoltageMismatch"
                        WHERE "Time" >= %s AND "Time" <= %s
                        AND "SUBSTN" IN ({placeholders})
                        AND "KV" = %s
                    )
                    SELECT
                        m."SUBSTN",
                        m.mismatches,
                        t.total_times,
                        (m.mismatches::float / t.total_times) * 100 AS "Percentage_Problematic"
                    FROM MismatchCount m
                    CROSS JOIN TotalTimeCount t
                    ORDER BY "Percentage_Problematic" DESC, m."SUBSTN";
                """
        else:
            query = f"""
                    WITH DiffPerTime AS (
                        SELECT
                            "Time",
                            "SUBSTN",
                            ABS(MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B1%%' AND "Value" <> 0) - MIN("Value") FILTER (WHERE "BUS" LIKE '%%2B2%%' AND "Value" <> 0)) AS "Difference"
                        FROM "BusVoltageMismatch"
                        WHERE "Time" >= %s AND "Time" <= %s
                        AND "SUBSTN" IN ({placeholders})
                        AND "KV" = %s
                        GROUP BY "Time", "SUBSTN"
                    ),
                    MismatchCount AS (
                        SELECT
                            "SUBSTN",
                            COUNT(*) AS mismatches
                        FROM DiffPerTime
                        WHERE "Difference" > 5
                        GROUP BY "SUBSTN"
                    ),
                    TotalTimeCount AS (
                        SELECT COUNT(DISTINCT "Time") AS total_times
                        FROM "BusVoltageMismatch"
                        WHERE "Time" >= %s AND "Time" <= %s
                        AND "SUBSTN" IN ({placeholders})
                        AND "KV" = %s
                    )
                    SELECT
                        m."SUBSTN",
                        m.mismatches,
                        t.total_times,
                        (m.mismatches::float / t.total_times) * 100 AS "Percentage_Problematic"
                    FROM MismatchCount m
                    CROSS JOIN TotalTimeCount t
                    ORDER BY "Percentage_Problematic" DESC, m."SUBSTN";
                """
        params = [
            month_start_date.strftime('%Y-%m-%d'),
            month_end_date.strftime('%Y-%m-%d'),
            *substations,
            voltage_level,
            month_start_date.strftime('%Y-%m-%d'),
            month_end_date.strftime('%Y-%m-%d'),
            *substations ,
            voltage_level
        ]
        
        with connections['SE_Database'].cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        data = [dict(zip(columns, row)) for row in rows]
        result_df = pd.DataFrame(data , columns = ['SUBSTN' ,'mismatches','total_times' ,'Percentage_Problematic'] )
        # filter percentage > percentageError
        # result_df = result_df[result_df['Percentage_Problematic'] > percentageError].reset_index()
        # drop mismatches and total_times columns
        result_df = result_df.drop(columns=['mismatches', 'total_times'])
        return result_df
    except Exception as e:
        extractdb_errormsg(str(e))
        return pd.DataFrame(data , columns = ['SUBSTN','Percentage_Problematic'] )
      
def get_bus_flows(substations ,  month_start_date , month_end_date , substation_master_df ,percentageError):
    try:
        latest_time_query = """
            select to_char(max("Time"),'YYYY-MM-DD HH24:MI:SS') as "Latest Time" FROM "BusVoltageMismatch" 
        """
        with connections['SE_Database'].cursor() as cursor:
            cursor.execute(latest_time_query)
            latest_time = cursor.fetchone()[0]
             
        # Build placeholders for IN clause dynamically
        placeholders = ', '.join(['%s'] * len(substations))
        #**************** 1st Query to get Latest Flows *****************
        result_df_400 = get_busflows_voltagewise(latest_time , placeholders , substations , 400)
        result_df_220 = get_busflows_voltagewise(latest_time , placeholders , substations , 220)
        # concatenate both dataframes
        result_df = pd.concat([result_df_400, result_df_220], ignore_index=True)
        
        #**************** 2nd Query to get Percentage Problematic *****************
        problematic_df_400 = bus_flows_problematic_percentage(substations ,  placeholders , 400 , month_start_date , month_end_date ,percentageError )
        problematic_df_220 = bus_flows_problematic_percentage(substations ,  placeholders , 220 , month_start_date , month_end_date ,percentageError)
      
        # concatenate both dataframes
        result_df2 = pd.concat([problematic_df_400, problematic_df_220], ignore_index=True)
        # merge result_df and result_df2 on SUBSTN
        result_df = pd.merge(result_df, result_df2, left_on='SUBSTN', right_on='SUBSTN', how='inner')
        # round off to 2 decimal places
        result_df = result_df.round(2)
        #conver column KV to int
        result_df['KV'] = result_df['KV'].astype(int).astype(str)
        # rename SUBSTN column to Substn
        result_df.rename(columns = {'SUBSTN' : 'Substn'} ,inplace = True)
        # replace substn with substation name
        temp_df = replace_substn_with_name(result_df, substation_master_df)
        # sort by Substn and KV
        temp_df = temp_df.sort_values(by=['Substn', 'KV']).reset_index(drop=True)
        return temp_df.to_dict(orient = 'records')
    except Exception as e:
        extractdb_errormsg(str(e))
        return []

def getDigitalNonReportingCategoryWise(state , monthyearid , ot_type):
    try:
        scada_point_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = state , ot_type = ot_type , ELEMENT_CATEGORY__in = ('BIS','IS','CB','LIS'),Voltage_Level__gte = 220).values('Substation_Name','Voltage_Level','ELEMENT_CATEGORY','Point_Name','seq_id') , columns = ['Substation_Name','Voltage_Level','ELEMENT_CATEGORY','Point_Name','seq_id'])
        if state in indianStatesWithICCP:
            point_df = pd.DataFrame(HistoryScadaDigitalIccpPointSummary.objects.filter(MonthYearID = monthyearid , State = state).values('master_seq_id' , 'master_point_name' , 'substation_name' , 'Non_Availability_Percentage') , columns = ['master_seq_id' , 'master_point_name' , 'substation_name' , 'Non_Availability_Percentage'] )
        else:
            point_df = pd.DataFrame(HistoryScadaDigitalFepPointSummary.objects.filter(MonthYearID = monthyearid , State = state).values('master_seq_id' , 'master_point_name' , 'substation_name' , 'Non_Availability_Percentage' ) , columns= ['master_seq_id' , 'master_point_name' , 'substation_name' , 'Non_Availability_Percentage'])
        
        # merge scada_point_df and point_df based on 
        merged_df = pd.merge(point_df, scada_point_df, left_on=['master_seq_id', 'master_point_name'], right_on=['seq_id', 'Point_Name'], how='inner')
        # Assuming your DataFrame is named final_df
        grouped_df = merged_df.groupby(['Voltage_Level', 'ELEMENT_CATEGORY']).size().reset_index(name='total')
        # filter Non_Availability_Percentage > 98
        filtered_df = merged_df[merged_df['Non_Availability_Percentage'] > 98]
        filtered_grouped_df = filtered_df.groupby(['Voltage_Level', 'ELEMENT_CATEGORY']).size().reset_index(name='non_reporting')
        # merge grouped_df and filtered_grouped_df
        result_df = pd.merge(grouped_df, filtered_grouped_df, on=['Voltage_Level', 'ELEMENT_CATEGORY'], how='left')
        result_df['non_reporting'] = result_df['non_reporting'].fillna(0)
        # calculate Non_Availability_Percentage
        result_df['Non_Availability_Percentage'] = (result_df['non_reporting'] / result_df['total']) * 100
        # round off to 2 decimal places
        result_df['Non_Availability_Percentage'] = result_df['Non_Availability_Percentage'].round(2)
        # add slno column to result_df
        result_df.insert(0, 'slno', range(1, len(result_df) + 1))
        # add bootom row Total
        total_row = pd.DataFrame({
            'slno': [''],
            'Voltage_Level': ['Total'],
            'ELEMENT_CATEGORY': [''],
            'total': [result_df['total'].sum()],
            'non_reporting': [result_df['non_reporting'].sum()],
            'Non_Availability_Percentage': [(result_df['non_reporting'].sum() / result_df['total'].sum()).round(2) * 100 if result_df['total'].sum() > 0 else 0]
        })
        result_df = pd.concat([result_df, total_row], ignore_index=True)
        result_df.rename(columns = {'ELEMENT_CATEGORY' : 'el_category' , 'Voltage_Level' : 'voltage' , 'count' : 'total' ,'Non_Availability_Percentage':'percent'} ,inplace = True)
        # replace el_category values with dictionary like BIS with Bus Isolator , IS with Isolator , CB with Circuit Breaker , LIS with Line Isolator
        el_category_dict = {
            'BIS': 'Bus Isolator',
            'IS': 'Isolator',
            'CB': 'Circuit Breaker',
            'LIS': 'Line Isolator'
        }
        result_df['el_category'] = result_df['el_category'].map(el_category_dict)
        # sort by voltage descending and el_category
        result_df = result_df.sort_values(by=['el_category' ,'voltage'], ascending=[True, True]).reset_index(drop=True)
        result_df.fillna('', inplace=True)
        return result_df.to_dict(orient = 'records')
    except Exception as e:
        extractdb_errormsg(str(e))
        return []

def getNonReportingCBs(state , monthyearid , ot_type):
    try:
        scada_point_df = pd.DataFrame(ScadaPointNameMapping.objects.filter(State = state , ot_type = ot_type , ELEMENT_CATEGORY = 'CB', Voltage_Level__gte = 220).values('Substation_Name','Voltage_Level','ELEMENT_CATEGORY','ELEMENT_DESCRIPTION','Point_Name','seq_id') , columns = ['Substation_Name','Voltage_Level','ELEMENT_CATEGORY','ELEMENT_DESCRIPTION','Point_Name','seq_id'])
        if state in indianStatesWithICCP:
            point_df = pd.DataFrame(HistoryScadaDigitalIccpPointSummary.objects.filter(MonthYearID = monthyearid , State = state).values('master_seq_id' , 'master_point_name' , 'Non_Availability_Percentage') , columns = ['master_seq_id' , 'master_point_name' ,'Non_Availability_Percentage'] )
        else:
            point_df = pd.DataFrame(HistoryScadaDigitalFepPointSummary.objects.filter(MonthYearID = monthyearid , State = state).values('master_seq_id' , 'master_point_name' , 'Non_Availability_Percentage' ) , columns= ['master_seq_id' , 'master_point_name' , 'Non_Availability_Percentage'])
        # merge scada_point_df and point_df based on 
        merged_df = pd.merge(point_df, scada_point_df, left_on=['master_seq_id', 'master_point_name'], right_on=['seq_id', 'Point_Name'], how='inner')
        # drop 'master_seq_id', 'master_point_name' columns
        merged_df = merged_df.drop(columns=['master_seq_id', 'master_point_name', 'seq_id', 'Point_Name'])
        # filter Non_Availability_Percentage > 98
        filtered_df = merged_df[merged_df['Non_Availability_Percentage'] > 98].reset_index(drop=True)
        # add slno column to filtered_df
        filtered_df.insert(0, 'slno', range(1, len(filtered_df) + 1))
        return filtered_df.to_dict(orient = 'records')
       
    except Exception as e:
        extractdb_errormsg(str(e))
        return []
    
def generateEntityWise(state , monthyearid , percentageError , ot_type):
    try:
        doc = DocxTemplate("templates/Ltr_Template.docx")
        letter_date = datetime.strptime(monthyearid , '%Y%m').date()
        year = letter_date.strftime('%y') 
        month = letter_date.strftime('%B')
        
        month_end_date = monthEndDate( letter_date) # this end date is to calculate KCL and ICT Flows for a month
        
        sl_no = f'{month} - 1'
        
        prev_month = get_previous_month(letter_date, 1)
        before_prev_month = get_previous_month(letter_date, 2)
        
        month_year = f'{month} {year}'
        prev_month_year = f"{prev_month.strftime('%B')} {prev_month.strftime('%y')}"
        prev_month_year_1 = f"{before_prev_month.strftime('%B')} {before_prev_month.strftime('%y')}"
        
        monthyearid_prev = getPrevMonthID(int(monthyearid)) 
        
        usr_address_lst = list(EntityAddress.objects.filter(entity_name = state).values_list('address' , flat=True))
        if len(usr_address_lst) :
            usr_address = usr_address_lst[0]
        else : usr_address = None
        
        # 1st table
        telemetry_summary = telemetryIssuesTable(monthyearid ,monthyearid_prev , state , ot_type)
        
        #2nd table
        filtered_df , _ = substationsNotReporting(state , monthyearid , state , ot_type)
        complete_220_notreporting = filtered_df['substation'].tolist()
        #3rd tabble Anaog and Point Summary
        filters = {
            'monthyearid': monthyearid,
            'category': 'ANALOG',
            'state': state,
            'ot_type': ot_type
        }

        analog_point_summary_df = monthSummaryDetails(monthyearid ,  state , ot_type , filters)
        
        # remove some columns
        analog_point_summary_df = analog_point_summary_df.drop(columns=['Substation_Name', 'Voltage_Level','analog_completely_not_reporting_points', 'digital_completely_not_reporting_points'])
        # add extra column weighted_avg it is average of analog_weighted_avg and digital_weighted_avg
        analog_point_summary_df['weighted_avg'] = (
                (analog_point_summary_df['analog_percentage_number_of_points_non_reporting'] +
                analog_point_summary_df['digital_percentage_number_of_points_non_reporting']) / 2
            ).round(2)
        # Assuming 30% is represented as 30 (not 0.30) in your percentage columns
        analog_point_summary_df = analog_point_summary_df[
                analog_point_summary_df['weighted_avg'] > 30 
            ].sort_values(
                by='weighted_avg', 
                ascending=False
            ).head(10)
        #  rename columns
        analog_point_summary_df.rename(columns = {
            'analog_no_of_points' : 'tot_analog' ,
            'digital_no_of_points' : 'tot_point' ,
            'analog_percentage_number_of_points_non_reporting' : 'tot_non_analog',
            'digital_percentage_number_of_points_non_reporting' : 'tot_non_point'
            } ,inplace = True)
        
        # add Slno column
        analog_point_summary_df.insert(0, 'slno', range(1, len(analog_point_summary_df) + 1))
        #4th table
        telemetry_failure_df = telemetryFailure(monthyearid , state , ot_type)
        telemetry_failure_prevmonth_df = telemetryFailure(monthyearid_prev , state , ot_type)
        
        telemetry_failure_df["key"] = telemetry_failure_df["master_seq_id"].astype(str) + "_" + telemetry_failure_df["master_point_name"]
        telemetry_failure_prevmonth_df["key"] = telemetry_failure_prevmonth_df["master_seq_id"].astype(str) + "_" + telemetry_failure_prevmonth_df["master_point_name"]
        
        # 1. Rows present in df1 and not in df2
        resolved_in_curr_month =  len(telemetry_failure_prevmonth_df[~telemetry_failure_prevmonth_df["key"].isin(telemetry_failure_df["key"])]) 

        # 2. Rows present in both df1 and df2
        not_resolved_in_two_months = len(telemetry_failure_df[telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])])

        # 3. Rows present in df2 and not in df1
        newly_added_points = len(telemetry_failure_df[~telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])])

        telemetry_ex_oltc = [
            {'slno' : 1 ,'text' :f'Points Resolved in {month_year} ' ,'points': resolved_in_curr_month} ,
            {'slno' : 2 ,'text' : f'Points Still Not Resolved & pending Since {prev_month.strftime("%B")} or earlier' ,'points': not_resolved_in_two_months} ,
            {'slno' : 3 ,'text' :f'Newly Identified Non-Reporting Analog Points in {month_year}' ,'points': newly_added_points} 
        ]

        #table 5
        category_metric = categoryMetricVoltage(telemetry_failure_df)
        # table 6
        latest_identified_points_df = telemetry_failure_df[~telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])]
        resolved_points_df = telemetry_failure_prevmonth_df[~telemetry_failure_prevmonth_df["key"].isin(telemetry_failure_df["key"])]
        
        # table 7 , KCL Flows
        # get the substation list for state from SCADA POINT MASTER
        scada_qry = ScadaPointNameMapping.objects.filter(State = state , ot_type = ot_type)
        substation_lst = list(scada_qry.distinct('Substation').values_list('Substation' , flat=True))
        substation_master_df = pd.DataFrame( scada_qry.values('Substation','Substation_Name') , columns= ['Substation','Substation_Name']).drop_duplicates()
        
        ict_flows_mismatch = get_ict_flows(substation_lst , letter_date , month_end_date , percentageError , substation_master_df)
        line_flows_mismatch = get_line_flows(substation_lst , letter_date , month_end_date , percentageError)
        bus_flows_mismatch = get_bus_flows(substation_lst , letter_date , month_end_date , substation_master_df , percentageError)
        
        # add Slno column
        latest_identified_points_df.insert(0, 'slno', range(1, len(latest_identified_points_df) + 1))
        # get only required columns
        latest_identified_points = latest_identified_points_df[['slno','Substation_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY' ,'Metric_Type']].to_dict(orient='records')
        # add Slno column
        resolved_points_df.insert(0, 'slno', range(1, len(resolved_points_df) + 1))
        # get only required columns
        resolved_points = resolved_points_df[['slno','Substation_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY' ,'Metric_Type']].to_dict(orient='records')

        # table 8 Digital Points Not Reporting
        non_reporting_points_digital = getDigitalNonReportingCategoryWise(state ,monthyearid , ot_type )
        
        #table 8 , Points not reporting since previous month or earlier
        full_telemetry_summary_df = telemetry_failure_df[telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])]
        # add Slno column
        full_telemetry_summary_df.insert(0, 'slno', range(1, len(full_telemetry_summary_df) + 1))
        # drop rows where key is nan
        full_telemetry_summary_df = full_telemetry_summary_df[full_telemetry_summary_df['key'].notna()]
        
        full_telemetry_summary = full_telemetry_summary_df[['slno','Substation_Name','Voltage_Level','ELEMENT_DESCRIPTION','ELEMENT_CATEGORY' ,'Metric_Type']].to_dict(orient='records')
       
        # table 9 Circuit Breakers Not Reporting
        non_reporting_cbs = getNonReportingCBs(state ,monthyearid , ot_type)
        context={
                  'date': datetime.today().strftime('%d-%m-%y'),
                  'sl_no': sl_no,
                  'usr_address' : usr_address ,
                  'month_year':month_year,
                  'state':state,
                  'prev_month_year':prev_month_year,
                  'prev_month_year_1':prev_month_year_1,
                  'telemetry_summary': telemetry_summary,
                  'complete_220_notreporting':complete_220_notreporting,
                  'analog_point_summary':analog_point_summary_df.to_dict(orient='records'),
                  'telemetry_ex_oltc':telemetry_ex_oltc,
                  'resolved_in_curr_month' : resolved_in_curr_month ,
                  'not_resolved_in_two_months': not_resolved_in_two_months + newly_added_points ,
                  'not_reporting_points' : not_resolved_in_two_months ,
                  'category_metric':category_metric,
                  'ict_flows_mismatch':ict_flows_mismatch,
                  'line_flows_mismatch':line_flows_mismatch,
                  'bus_flows_mismatch':bus_flows_mismatch,
                  'non_reporting_points_digital': non_reporting_points_digital,
                  'total_not_reporting_points' : (not_resolved_in_two_months + newly_added_points) ,
                  'latest_identified_points':latest_identified_points,
                  'resolved_points':resolved_points,
                  'full_telemetry_summary':full_telemetry_summary,
                  'non_reporting_cbs' : non_reporting_cbs
        }
 
        doc.render(context)
        # all MWH files goes to this folder
        parent_folder = os.path.abspath(os.path.join(base_dir, os.pardir))
        directory = os.path.join(parent_folder, 'StateLetters')

        docx_directory=os.path.join(directory,'Docx')
        if not os.path.exists(docx_directory):
            os.makedirs(docx_directory)

        inname_docx= state + 'letter-'+ monthyearid +'.docx'
        output_file=os.path.join(docx_directory, inname_docx)
        doc.save(output_file)

        return output_file

    except Exception as e:
        extractdb_errormsg(str(e))
        return ''
    
def generateEntityWiseREMC(state , monthyearid , percentageError ):
    try:
        doc = DocxTemplate("templates/Remc_Template.docx")

        letter_date = datetime.strptime(monthyearid , '%Y%m').date()
        year = letter_date.strftime('%y') 
        month = letter_date.strftime('%B')
        sl_no = f'{month} - 1'
        
        prev_month = get_previous_month(letter_date, 1)
        before_prev_month = get_previous_month(letter_date, 2)
        
        month_year = f'{month} {year}'
        prev_month_year = f"{prev_month.strftime('%B')} {prev_month.strftime('%y')}"
        prev_month_year_1 = f"{before_prev_month.strftime('%B')} {before_prev_month.strftime('%y')}"
        monthyearid_prev = getPrevMonthID(int(monthyearid)) 
        hindi_date = convert_to_hindi_date(letter_date.strftime('%Y%m'))

        usr_address_lst = list(EntityAddress.objects.filter(entity_name = state).values_list('address' , flat=True))
        if len(usr_address_lst) :
            usr_address = usr_address_lst[0]
        else : usr_address = state
        
        # 1st table
        telemetry_summary , telemetry_failure = telemetryIssuesTableREMC(monthyearid , state)

        #2nd table
        filtered_df , _ = substationsNotReporting(state , monthyearid , state , 'REMC')
        complete_220_notreporting = filtered_df['substation'].tolist()
        #3rd table
        telemetry_failure_df = telemetryFailure(monthyearid , state , 'REMC')
        telemetry_failure_prevmonth_df = telemetryFailure(monthyearid_prev , state , 'REMC')
        
        telemetry_failure_df["key"] = telemetry_failure_df["master_seq_id"].astype(str) + "_" + telemetry_failure_df["master_point_name"]
        telemetry_failure_prevmonth_df["key"] = telemetry_failure_prevmonth_df["master_seq_id"].astype(str) + "_" + telemetry_failure_prevmonth_df["master_point_name"]
        
        # 1. Rows present in df1 and not in df2
        resolved_in_curr_month =  len(telemetry_failure_prevmonth_df[~telemetry_failure_prevmonth_df["key"].isin(telemetry_failure_df["key"])]) 

        # 2. Rows present in both df1 and df2
        not_resolved_in_two_months = len(telemetry_failure_df[telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])])

        # 3. Rows present in df2 and not in df1
        newly_added_points = len(telemetry_failure_df[~telemetry_failure_df["key"].isin(telemetry_failure_prevmonth_df["key"])])

        telemetry_ex_oltc = [
            {'slno' : 1 ,'text' :f'Points Resolved in {month_year} ' ,'points': resolved_in_curr_month} ,
            {'slno' : 2 ,'text' : f'Points Still Not Resolved & pending Since {prev_month.strftime("%B")} or earlier' ,'points': not_resolved_in_two_months} ,
            {'slno' : 3 ,'text' :f'Newly Identified Non-Reporting Analog Points in {month_year}' ,'points': newly_added_points} 
        ]
      
        context={
                  'date': datetime.today().strftime('%d-%m-%y'),
                  'sl_no': sl_no,
                  'usr_address' : usr_address ,
                  'month_year':month_year,
                  'state':state,
                  'hindi_date' : hindi_date,
                  'prev_month_year':prev_month_year,
                  'prev_month_year_1':prev_month_year_1,
                  'telemetry_summary': telemetry_summary,
                  'complete_220_notreporting' : complete_220_notreporting,
                  'telemetry_ex_oltc':telemetry_ex_oltc,
                  'telemetry_failure': telemetry_failure,
        }
 
        doc.render(context)
        # all MWH files goes to this folder
        parent_folder = os.path.abspath(os.path.join(base_dir, os.pardir))
        directory = os.path.join(parent_folder, 'StateLetters')

        docx_directory=os.path.join(directory,'Docx')
        if not os.path.exists(docx_directory):
            os.makedirs(docx_directory)

        inname_docx= state + 'letter-'+ monthyearid +'.docx'
        output_file=os.path.join(docx_directory, inname_docx)
        doc.save(output_file)
        print(state)
        return output_file

    except Exception as e:
        extractdb_errormsg(str(e))
        return ''
    

def generateLetter(request):
    try:
        in_data = json.loads(request.body)
        monthyearid = in_data['monthyearid']
        percentageError = in_data['percentageError']
        indian_state = in_data['indianState']
        all_output_paths = []
        ot_type = in_data['systemType']

        if indian_state == 'ALL':
            states = list(
                HistoryScadaMonthSummary.objects.filter(monthyearid=monthyearid ,  ot_type = ot_type)
                .distinct('state')
                .values_list('state', flat=True)
            )
            if ot_type == 'SCADA':
                # ✅ Use ThreadPoolExecutor for parallel processing
                with ThreadPoolExecutor(max_workers=5) as executor:  # adjust max_workers as per CPU/IO balance
                    future_to_state = {
                        executor.submit(generateEntityWise, st, monthyearid, percentageError , ot_type): st
                        for st in states
                    }
                    for future in as_completed(future_to_state):
                        state = future_to_state[future]
                        try:
                            result_path = future.result()
                            all_output_paths.append(result_path)
                        except Exception as e:
                            extractdb_errormsg(f"Error generating letter for {state}: {str(e)}")
            elif ot_type == 'REMC':
                # ✅ Use ThreadPoolExecutor for parallel processing
                with ThreadPoolExecutor(max_workers=5) as executor:  # adjust max_workers as per CPU/IO balance
                    future_to_state = {
                        executor.submit(generateEntityWiseREMC, st, monthyearid, percentageError ): st
                        for st in states
                    }

                    for future in as_completed(future_to_state):
                        state = future_to_state[future]
                        try:
                            result_path = future.result()
                            all_output_paths.append(result_path)
                        except Exception as e:
                            extractdb_errormsg(f"Error generating letter for {state}: {str(e)}")
            else : pass
        else:
            # single state
            if ot_type == 'SCADA':
                result_path = generateEntityWise(indian_state, monthyearid, percentageError , ot_type)
            elif ot_type == 'REMC':
                result_path = generateEntityWiseREMC(indian_state, monthyearid, percentageError )
            else : pass

            all_output_paths.append(result_path)

        # ✅ Combine all generated files into a ZIP
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in all_output_paths:
                zip_file.write(file_path, os.path.basename(file_path))

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.read(), content_type="application/zip")
        response['Content-Disposition'] = 'attachment; filename="StateLetters.zip"'

        # ✅ Clean up temporary files
        for file_name in all_output_paths:
            try:
                os.remove(file_name)
            except FileNotFoundError:
                pass

        return response

    except Exception as e:
        extractdb_errormsg(e)
        return JsonResponse({"error": str(e)}, status=400)
