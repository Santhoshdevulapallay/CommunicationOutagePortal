import os
import sys
import time
import shutil
import openpyxl
import pandas as pd
from dotenv import dotenv_values
import db_connection as db_conn
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sql_queries.insert_states_bulk_station_summary import INSERT_STATES_BULK_STATION_POINT_SUMMARY

def process_and_dump(pg_conn, station_name, EXCEL_FILE_PATH, excelStatus, MONTHYEARID, MONTH_NUM, MONTH_NAME, YEAR, CATEGORY, STATE):
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
            
            print(f"Station Point Details Dataframe for {station_name} => \n", station_df)

            station_df_columns = list(station_df.columns)
            station_df = station_df[station_df_columns].to_dict(orient='records')

            #station's point details data
            insert_states_bulk_station_point_summary_query = text(INSERT_STATES_BULK_STATION_POINT_SUMMARY)

            pg_conn.execute(insert_states_bulk_station_point_summary_query, station_df)
            excelStatus = "Done"

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

    pg_db_engine = db_conn.get_db_engine(config['POSTGRES_USER'], 
                                         config['POSTGRES_PASSWORD'],
                                         config['POSTGRES_HOST'],
                                         config['POSTGRES_DB'])

    try:
        wb = openpyxl.load_workbook(EXCEL_FILE_PATH)
        stations_names = wb.sheetnames

        with pg_db_engine.connect() as pg_conn:

            for station_name in stations_names:
                excelStatus = None
                excelStatus = process_and_dump(pg_conn, station_name, EXCEL_FILE_PATH, excelStatus, MONTHYEARID, MONTH_NUM, MONTH_NAME, YEAR, CATEGORY, STATE)

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



    