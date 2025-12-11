INSERT_STATES_BULK_STATION_POINT_SUMMARY = """
                                       WITH Dataframe_CTE AS (
                                            SELECT :MonthYearID AS MonthYearID, :Month AS Month, :Month_Name AS Month_Name, :Year AS Year,
                                                   :Input_State AS State,
                                                   :Substation AS Substation, :ELEMENT_DESCRIPTION AS ELEMENT_DESCRIPTION, 
                                                   :ELEMENT_CATEGORY AS ELEMENT_CATEGORY, :Metric_Type AS Metric_Type,
                                                   :No_of_Times_Non_Availability AS No_of_Non_Available_Time_Instances,
                                                   :No_of_Time_Instances AS No_of_Time_Instances, :Remarks AS Remarks, :Status AS Status,
                                                   :TimeLine AS TimeLine 
                                       ),
                                       Get_Unique_State_Substation_CTE AS (
                                            SELECT DISTINCT "State", "Substation", "ELEMENT_DESCRIPTION", "ELEMENT_CATEGORY", "Metric_Type",
                                            "Point_Name" FROM "SCADA_Point_Name_Mapping"
                                       ),
                                       Check_Substation_Existence_CTE AS (
                                            SELECT t1.MonthYearID::TEXT AS MonthYearID, t1.Month::SMALLINT AS Month, t1.Month_Name, 
                                            t1.Year::SMALLINT AS Year,
                                            t1.Metric_Value AS Point_Name, t1.Remarks, t1.Status::TEXT AS Status,
                                            t1.No_of_Non_Available_Time_Instances::SMALLINT AS No_of_Non_Available_Time_Instances, 
                                            t1.No_of_Time_Instances::SMALLINT AS No_of_Time_Instances, NOW() AS Created_At,
                                            CASE WHEN Status = 'Pending' AND TimeLine IS NOT NULL THEN 'Approved'
                                                 WHEN Status = 'Pending' AND TimeLine IS NULL THEN 'Rejected'
                                                 WHEN (Status IN (SELECT TRIM("Status") FROM "Status_Enum_Table" 
                                                                  WHERE "Status" != 'Rectified' AND "Status" != 'Pending')) THEN 'Approved'
                                                 WHEN Status = 'Rectified' THEN 'On Hold'
                                             ELSE 'Waiting for Approval' END AS Approved_Status,

                                             CASE WHEN Status = 'Pending' AND TimeLine IS NOT NULL THEN 'Approved'
                                                 WHEN Status = 'Pending' AND TimeLine IS NULL THEN 'TimeLine Date is needed'
                                                 WHEN (Status IN (SELECT TRIM("Status") FROM "Status_Enum_Table" 
                                                                  WHERE "Status" != 'Rectified' AND "Status" != 'Pending')) THEN 'Approved'
                                                 WHEN Status = 'Rectified' THEN 'On Hold'
                                             ELSE 'Waiting for Approval' END AS Approved_Remarks
                                            FROM Get_Unique_State_Substation_CTE t2
                                            INNER JOIN Dataframe_CTE t1 
                                            ON trim(t1.State) = trim(t2."State")
                                            ON trim(t1.Substation) = trim(t2."Substation")
                                            ON trim(t1.ELEMENT_DESCRIPTION) = trim(t2."ELEMENT_DESCRIPTION")
                                            ON trim(t1.ELEMENT_CATEGORY) = trim(t2."ELEMENT_CATEGORY")
                                            ON trim(t1.Metric_Type) = trim(t2."Metric_Type") 
                                       ),
                                       Insert_In_Requests_CTE AS (
                                            INSERT INTO "SCADA_Point_Name_Requests_And_Approval_History"("UserId", 
                                            "MonthYearID", "Point_Name", "Status", "Remarks", "TimeLine", 
                                            "Approved_Status", "Approved_Remarks", "ApprovalCreatedAt")
                                            SELECT State
                                       )
                                       INSERT INTO "History_SCADA_Point_Summary"("MonthYearID", "Month", "Month_Name", "Year", 
                                       "Point_Name", "Remarks", "Status",
                                       "No_of_Non_Available_Time_Instances", "No_of_Time_Instances", "Created_At", "Approved_Status")
                                       SELECT MonthYearID, Month, Month_Name, Year, Point_Name, Remarks, Status, 
                                       No_of_Non_Available_Time_Instances, No_of_Time_Instances, Created_At, Approved_Status 
                                       FROM Check_Substation_Existence_CTE
                                       ON CONFLICT ("MonthYearID", "Point_Name")
                                       DO UPDATE
                                       SET "Point_Name" = EXCLUDED."Point_Name",
                                       "Remarks" = EXCLUDED."Remarks",
                                       "Status" = EXCLUDED."Status",
                                       "No_of_Non_Available_Time_Instances" = EXCLUDED."No_of_Non_Available_Time_Instances",
                                       "No_of_Time_Instances" = EXCLUDED."No_of_Time_Instances",
                                       "Created_At" = NOW(),
                                       "Approved_Status" = EXCLUDED."Approved_Status";
                                    """