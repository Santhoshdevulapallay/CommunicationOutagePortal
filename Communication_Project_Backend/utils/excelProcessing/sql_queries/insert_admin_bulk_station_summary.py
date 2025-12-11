INSERT_ADMIN_BULK_STATION_SUMMARY = """
                                       WITH Dataframe_CTE AS (
                                            SELECT :MonthYearID AS MonthYearID, :Month AS Month, :Month_Name AS Month_Name, :Year AS Year, 
                                                   :Category AS Category, :State AS State, :Substation AS Substation,
                                                   :No_of_Non_Reporting_Points AS No_of_Non_Reporting_Points, :No_of_Points AS No_of_Points 
                                       ),
                                       Get_Unique_State_Substation_CTE AS (
                                            SELECT DISTINCT "State", "Substation" FROM "SCADA_Point_Name_Mapping"
                                       ),
                                       Check_Substation_Existence_CTE AS (
                                            SELECT t1.MonthYearID::TEXT AS MonthYearID, t1.Month::SMALLINT AS Month, t1.Month_Name, t1.Year::SMALLINT AS Year,
                                            t1.Category::"Category_Enum" AS Category, t1.State::TEXT AS State, t2."Substation", 
                                            t1.No_of_Non_Reporting_Points::SMALLINT AS No_of_Non_Reporting_Points, t1.No_of_Points::SMALLINT AS No_of_Points, 
                                            NOW() AS Created_At
                                            FROM Get_Unique_State_Substation_CTE t2
                                            INNER JOIN Dataframe_CTE t1 
                                            ON trim(t1.Substation) = trim(t2."Substation") 
                                            AND trim(t1.State) = trim(t2."State")
                                       )
                                       INSERT INTO "History_SCADA_Month_Summary"("MonthYearID", "Month", "Month_Name", "Year", 
                                       "Category", "State", "Substation", 
                                       "No_of_Non_Reporting_Points", "No_of_Points", "Created_At")
                                       SELECT MonthYearID, Month, Month_Name, Year, Category, State, "Substation", No_of_Non_Reporting_Points,
                                       No_of_Points, Created_At
                                       FROM Check_Substation_Existence_CTE
                                       ON CONFLICT ("MonthYearID", "Substation")
                                       DO UPDATE
                                       SET "State" = EXCLUDED."State",
                                       "No_of_Non_Reporting_Points" = EXCLUDED."No_of_Non_Reporting_Points",
                                       "No_of_Points" = EXCLUDED."No_of_Points",
                                       "Created_At" = NOW()
                                       ;
                                    """


INSERT_ADMIN_BULK_STATION_POINT_SUMMARY = """
                                       WITH Dataframe_CTE AS (
                                            SELECT :MonthYearID AS MonthYearID, :Month AS Month, :Month_Name AS Month_Name, :Year AS Year, 
                                                   :Metric_Value AS Metric_Value, :State AS State,
                                                   :No_of_Times_Non_Availability AS No_of_Non_Available_Time_Instances,
                                                   :No_of_Time_Instances AS No_of_Time_Instances,
                                                   'Waiting for Approval'::TEXT AS Approved_Status
                                       ),
                                       Get_Unique_State_Substation_CTE AS (
                                            SELECT DISTINCT "State", "Point_Name" FROM "SCADA_Point_Name_Mapping"
                                       ),
                                       Check_Substation_Existence_CTE AS (
                                            SELECT t1.MonthYearID::TEXT AS MonthYearID, t1.Month::SMALLINT AS Month, t1.Month_Name, 
                                            t1.Year::SMALLINT AS Year,
                                            t1.Metric_Value AS Point_Name,
                                            t1.No_of_Non_Available_Time_Instances::SMALLINT AS No_of_Non_Available_Time_Instances, 
                                            t1.No_of_Time_Instances::SMALLINT AS No_of_Time_Instances, NOW() AS Created_At,
                                            t1.Approved_Status
                                            FROM Get_Unique_State_Substation_CTE t2
                                            INNER JOIN Dataframe_CTE t1 
                                            ON trim(t1.Metric_Value) = trim(t2."Point_Name") 
                                            AND TRIM(t1.State) = TRIM(t2."State")
                                       )
                                       INSERT INTO "History_SCADA_Point_Summary"("MonthYearID", "Month", "Month_Name", "Year", 
                                       "Point_Name",
                                       "No_of_Non_Available_Time_Instances", "No_of_Time_Instances", "Created_At", "Approved_Status")
                                       SELECT MonthYearID, Month, Month_Name, Year, Point_Name, 
                                       No_of_Non_Available_Time_Instances, No_of_Time_Instances, Created_At, Approved_Status 
                                       FROM Check_Substation_Existence_CTE
                                       ON CONFLICT ("MonthYearID", "Point_Name")
                                       DO UPDATE
                                       SET "Point_Name" = EXCLUDED."Point_Name",
                                       "Remarks" = EXCLUDED."Remarks",
                                       "Status" = EXCLUDED."Status",
                                       "TimeLine" = EXCLUDED."TimeLine",
                                       "No_of_Non_Available_Time_Instances" = EXCLUDED."No_of_Non_Available_Time_Instances",
                                       "No_of_Time_Instances" = EXCLUDED."No_of_Time_Instances",
                                       "Created_At" = NOW(),
                                       "Approved_Status" = EXCLUDED."Approved_Status";
                                    """