import os
import glob
import duckdb
import pandas as pd
from sqlalchemy import text
import db_connection as db_conn
from dotenv import dotenv_values


if __name__ == '__main__':

    basedir = os.path.abspath(os.path.dirname(__file__))
    ENV_PATH = os.path.join(basedir, ".env")

    try:
            
        df = pd.read_csv(r'.\scada_point_name_mapping.csv')
        result = duckdb.sql("""
                               WITH SCHEMA_CTE AS (
                                    SELECT TRIM(Point_Name) AS Point_Name, IOA, ICCP_Name
                                    FROM df
                               )
                               SELECT Point_Name, IOA, ICCP_Name
                               FROM SCHEMA_CTE
                            """).df()
        
        config = dotenv_values(ENV_PATH)
        pg_db_engine = db_conn.get_db_engine(config['POSTGRES_USER'], 
                                             config['POSTGRES_PASSWORD'],
                                             config['POSTGRES_HOST'],
                                             config['POSTGRES_DB'])
        
        with pg_db_engine.connect() as pg_conn:

            result_columns = list(result.columns)
            result = result[result_columns].to_dict(orient='records')

            update_query = """
                              WITH Data_CTE AS (
                                SELECT TRIM(:Point_Name)::TEXT AS Point_Name, (:IOA)::SMALLINT AS IOA, 
                                TRIM(:ICCP_Name)::TEXT AS ICCP_Name
                              )
                              INSERT INTO "SCADA_Point_Name_Mapping" ("Point_Name", "IOA", "ICCP_Name")
                              SELECT *
                              FROM Data_CTE
                              ON CONFLICT("Point_Name") DO UPDATE
                              SET "IOA" = EXCLUDED."IOA",
                              "ICCP_Name" = EXCLUDED."ICCP_Name"
                           """
            
            pg_conn.execute(text(update_query), result)
            pg_conn.commit()

    except Exception as e:
        print(e)