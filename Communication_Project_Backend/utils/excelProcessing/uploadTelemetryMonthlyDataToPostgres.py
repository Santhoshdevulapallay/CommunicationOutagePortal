import os
import sys
import time
import shutil
import openpyxl
import pandas as pd
import numpy as np
from dotenv import dotenv_values
import db_connection as db_conn
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sql_queries.insert_admin_bulk_station_summary import INSERT_ADMIN_BULK_STATION_SUMMARY, INSERT_ADMIN_BULK_STATION_POINT_SUMMARY
from datetime import datetime

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
def process_and_dump(pg_conn, station_name, EXCEL_FILE_PATH, excelStatus, MONTHYEARID, MONTH_NUM, MONTH_NAME, YEAR, CATEGORY, STATE, SCADA_POINT_df):
    with pd.ExcelFile(EXCEL_FILE_PATH) as xlsx:
            station_df = pd.read_excel(xlsx, station_name)
            if station_df.empty:
                print(f"Nothing to insert as dataframe for station name => {station_name} is empty\n")
                excelStatus = "Done"
                return excelStatus

            station_df['MonthYearID'] = MONTHYEARID
            station_df['Month'] = int(MONTH_NUM)
            station_df['Month_Name'] = MONTH_NAME
            station_df['Year'] = int(YEAR)
            station_df['State'] = STATE
            station_df['Created_At'] = datetime.now()
            
            current_month = month_dict[int(MONTH_NUM)]
            prev_month_num = int(MONTH_NUM) - 1
            prev_month = month_dict[12] if prev_month_num < 1 else month_dict[prev_month_num]
            
            if station_name.strip().lower() == 'station_summary':
                station_df['Category'] = CATEGORY

                station_df.rename(columns = {current_month+'_Completely_Not_Reporting_Points' : 'Completely_Not_Reporting_Points',prev_month+'_Completely_Not_Reporting_Points' : 'Completely_Not_Reporting_Points_PrevMonth' ,'Substation_Name':'Substation'} , inplace = True)
                station_df.drop(['Voltage_Level'] , axis = 1, inplace = True)
                
                # station_df_columns = list(station_df.columns)
                # station_df = station_df[station_df_columns].to_dict(orient='records')

                # #station summary data inserted
                # insert_admin_bulk_station_summary_query = text(INSERT_ADMIN_BULK_STATION_SUMMARY)
                #pg_conn.execute(insert_admin_bulk_station_summary_query, station_df)

                table_name = 'History_SCADA_Month_Summary'
                
            else:
                station_df['Approved_Status'] = 'Waiting for Approval'

                station_df = station_df.replace({np.nan : None})
                
                station_df.rename(columns = {current_month+'_Non_Availability_Percentage' : 'Non_Availability_Percentage',prev_month+'_Non_Availability_Percentage' : 'Non_Availability_Percentage_PrevMonth' ,'SubStation':'Substation'} , inplace = True)
                station_df.drop(['Voltage Level', 'ELEMENT_DESCRIPTION','ELEMENT_CATEGORY','Metric_Type', 'No_of_Points','Latest Month Remarks', 'Previous Month Remarks'] , axis =1 , inplace = True )
                
                # #station_df_columns = list(station_df.columns)
                # #station_df = station_df[station_df_columns].to_dict(orient='records')


                # #station's point details data
                # insert_admin_bulk_station_point_summary_query = text(INSERT_ADMIN_BULK_STATION_POINT_SUMMARY)
                # #pg_conn.execute(insert_admin_bulk_station_point_summary_query, station_df)

                table_name = 'History_SCADA_Point_Summary'
                
            excelStatus = 'Done'
            
            # Some Points are added in Input file but not in Master Table then Ignore those Stations
            
            merged_df = station_df.copy()
            merged_df['MonthYearID'] = MONTHYEARID
            # Get the unique Substation and MonthNum values from the DataFrame
            unique_values = merged_df[['Substation', 'MonthYearID']].drop_duplicates()

            # now State column not required can drop safely
            if table_name == 'History_SCADA_Point_Summary':
                merged_df.drop('State' , axis = 1, inplace = True)

            # Construct a DELETE query
            delete_query = """
                DELETE FROM public."{table_name}" AS t
                WHERE (t."Substation", t."MonthYearID") IN (
                    SELECT "Substation", "MonthYearID"
                    FROM unnest(array[:substations], array[:monthnums]) AS u("Substation", "MonthYearID")
            )
            """.format(table_name=table_name)

            # Execute the DELETE query using SQLAlchemy
            pg_conn.execute(
                text(delete_query),
                {
                    'substations': unique_values['Substation'].tolist(),
                    'monthnums': unique_values['MonthYearID'].tolist()
                }
            )

            merged_df.to_sql(
                    name=table_name,         # Name of the target table
                    con=pg_conn,                   # SQLAlchemy connection object
                    schema='public',               # Schema (optional, default is 'public')
                    if_exists='append',           # How to behave if the table already exists ('replace', 'append', 'fail')
                    index=False,                   # Whether to write the DataFrame index as a column
                    method='multi'                 # Optimizes insertion for bulk writes
                )

    return excelStatus



if __name__ == '__main__':

    print(f"Called python script for data processing on Excel File => {sys.argv[len(sys.argv) - 1]}")

    basedir = os.path.abspath(os.path.dirname(__file__))
    EXCEL_FOLDER_PATH = os.path.join(basedir, "EXCEL_FILES")

    ENV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(basedir)), '.env')

    print("ENV FILE PATH => ", ENV_FILE_PATH)

    config = dotenv_values(ENV_FILE_PATH)
    MONTHYEARID = sys.argv[1]
    MONTH_NUM = sys.argv[2]
    MONTH_NAME = sys.argv[3]
    YEAR = sys.argv[4]
    CATEGORY = sys.argv[5]
    STATE = sys.argv[6]
    INPUT_FILENAME = sys.argv[7]

    EXCEL_FILE_PATH = os.path.join(EXCEL_FOLDER_PATH, INPUT_FILENAME)

    print("EXCEL FILE PATH => ", EXCEL_FILE_PATH)

    print("STATE => ", STATE)
    print("INPUT_STATE => ", INPUT_FILENAME)

    pg_db_engine = db_conn.get_db_engine(config['POSTGRES_USER'], 
                                         config['POSTGRES_PASSWORD'],
                                         config['POSTGRES_HOST'],
                                         config['POSTGRES_DB'])

    try:
        wb = openpyxl.load_workbook(EXCEL_FILE_PATH)
        stations_names = wb.sheetnames

        with pg_db_engine.connect() as pg_conn:
            query = """SELECT DISTINCT "State" , "Substation_Name" as "Substation"  FROM "SCADA_Point_Name_Mapping" WHERE "State" = '{state}' """.format(state=STATE)
            SCADA_POINT_df = pd.read_sql(query, pg_conn)
            
            for station_name in stations_names:
                excelStatus = None
                excelStatus = process_and_dump(pg_conn, station_name, EXCEL_FILE_PATH, excelStatus, MONTHYEARID, MONTH_NUM, MONTH_NAME, YEAR, CATEGORY, STATE , SCADA_POINT_df)
                if excelStatus is None:
                    break

            print("Excel Status => ", excelStatus)
            if excelStatus is None:
                pass
            else:
                pg_conn.commit()

    except SQLAlchemyError as sql_alchemy_exception:
        print("Printing SQL Alchemy Exceptions")
        
        if hasattr(sql_alchemy_exception, 'orig') and sql_alchemy_exception.orig:
        # If there's an original exception, use its message
            print(str(sql_alchemy_exception.orig), file=sys.stderr) 
        elif hasattr(sql_alchemy_exception, '_message') and callable(sql_alchemy_exception._message):
            # If there's a _message method, call it
            print(sql_alchemy_exception._message(), file=sys.stderr)
        else:
            # Fallback to string representation of the error
            print(str(sql_alchemy_exception), file=sys.stderr)

    except Exception as e:
        if hasattr(e, 'message'):
            print(e.message, file=sys.stderr)
        else:
            print(e, file=sys.stderr)


    if excelStatus is not None and os.path.exists(EXCEL_FILE_PATH):
        os.remove(EXCEL_FILE_PATH)
        print(f"{EXCEL_FILE_PATH} has been removed after successful postgres database insertion")



    