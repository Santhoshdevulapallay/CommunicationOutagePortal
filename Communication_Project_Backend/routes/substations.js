const express = require("express");
const router = express.Router();


const cp = require('child_process')
const auth = require("../middleware/auth");
const pool = require("../startup/postgresDb")()
const upload = require("../middleware/multer.middleware")
const ApiResponse = require('../utils/ApiResponse')
const ApiError = require('../utils/ApiError');
var Excel = require("exceljs");
const { result } = require("lodash");
const { stat } = require("fs/promises");
const { error } = require("console");

router.post("/statesPointsStatusAndRemarks/", auth, async(req, res) => {


    const { monthyearid, year, monthnum, 
            monthname, indianState, substationname,
            pointStatusVal, pointTimeLineVal, pointRemarksVal,
            selectedAnalogPointDetails
          } = req.body;

    try{
        await pool.query(`BEGIN`);

        for (let point of selectedAnalogPointDetails){

            const response = await pool.query(`WITH Data_CTE AS (
                                                    SELECT $1::TEXT AS "MonthYearID", $2::TEXT AS "State", 
                                                    $3::TEXT AS "Substation", $4::TEXT AS "ELEMENT_DESC",
                                                    $5::TEXT AS "ELEMENT_CATEGORY", $6::TEXT AS "Metric_Type",
                                                    $7::TEXT AS "Point_Status",
                                                    to_timestamp($8::TEXT, 'YYYY-MM-DD')::timestamp with time zone AS "TimeLine", 
                                                    $9::TEXT AS "Remarks",
                                                    NOW() AS "UserRequestCreatedAt",
                                                    NOW() AS "ApprovalCreatedAt"
                                                ),
                                                GET_Point_Name_CTE AS (
                                                        SELECT "State", "Substation", "ELEMENT_DESCRIPTION", "ELEMENT_CATEGORY", "Metric_Type",
                                                        "Point_Name"
                                                        FROM "SCADA_Point_Name_Mapping"
                                                        WHERE "State" = $2::TEXT
                                                        AND "Substation" = $3::TEXT
                                                        AND "ELEMENT_DESCRIPTION" = $4::TEXT
                                                        AND "ELEMENT_CATEGORY" = $5::TEXT
                                                        AND "Metric_Type" = $6::TEXT
                                                ),
                                                Get_Mapping_CTE AS (
                                                    SELECT t1."MonthYearID", t1."State", t2."Point_Name", 
                                                    t1."Point_Status", t1."Remarks", t1."UserRequestCreatedAt", t1."TimeLine",
                                                    CASE WHEN "Point_Status" = 'Pending' AND "TimeLine" IS NOT NULL THEN 'Approved'
                                                         WHEN "Point_Status" = 'Pending' AND "TimeLine" IS NULL THEN 'Rejected'
                                                         WHEN "Point_Status" IN (SELECT TRIM("Status") FROM "Status_Enum_Table" 
                                                                                  WHERE "Status" != 'Rectified' AND "Status" != 'Pending')
                                                                                  THEN 'Approved'
                                                         WHEN "Point_Status" = 'Rectified' THEN 'On Hold'
                                                    ELSE 'Waiting for Approval' END AS "Approved_Status",

                                                    CASE WHEN "Point_Status" = 'Pending' AND "TimeLine" IS NOT NULL THEN 'Approved'
                                                         WHEN "Point_Status" = 'Pending' AND "TimeLine" IS NULL THEN 'TimeLine Date is needed'
                                                         WHEN "Point_Status" IN (SELECT TRIM("Status") FROM "Status_Enum_Table" 
                                                                        WHERE "Status" != 'Rectified' AND "Status" != 'Pending') THEN 'Approved'
                                                         WHEN "Point_Status" = 'Rectified' THEN 'On Hold'
                                                    ELSE 'Waiting for Approval' END AS "Approved_Remarks",
                                                    t1."ApprovalCreatedAt"
                                                    FROM Data_CTE t1
                                                    INNER JOIN GET_Point_Name_CTE t2
                                                    ON TRIM(t1."State") = TRIM(t2."State")
                                                    AND TRIM(t1."Substation") = TRIM(t2."Substation")
                                                    AND TRIM(t1."ELEMENT_DESC") = TRIM(t2."ELEMENT_DESCRIPTION")
                                                    AND TRIM(t1."ELEMENT_CATEGORY") = TRIM(t2."ELEMENT_CATEGORY")
                                                    AND TRIM(t1."Metric_Type") = TRIM(t2."Metric_Type")
                                                ),
                                                Check_Data_Existence_CTE AS (
                                                    SELECT t2."MonthYearID", t2."State", t1."Point_Name",
                                                    t2."Point_Status", t2."Remarks", t2."TimeLine", t2."UserRequestCreatedAt",
                                                    t2."Approved_Status", t2."Approved_Remarks", t2."ApprovalCreatedAt"
                                                    FROM "History_SCADA_Point_Summary" t1
                                                    INNER JOIN Get_Mapping_CTE t2
                                                    ON TRIM(t1."MonthYearID") = TRIM(t2."MonthYearID")
                                                    AND TRIM(t1."Point_Name") = TRIM(t2."Point_Name")	
                                                ),
                                                INSERT_CTE AS (
                                                    INSERT INTO "SCADA_Point_Name_Requests_And_Approval_History"("MonthYearID", "UserId", "UserRequestCreatedAt", 
                                                    "Point_Name", "Status", "Remarks", "TimeLine", 
                                                    "Approved_Status", "Approved_Remarks", "ApprovalCreatedAt")
                                                    SELECT "MonthYearID", "State", "UserRequestCreatedAt", "Point_Name", "Point_Status", "Remarks",
                                                    "TimeLine", "Approved_Status", "Approved_Remarks", "ApprovalCreatedAt"
                                                    FROM Check_Data_Existence_CTE
                                                )
                                                UPDATE "History_SCADA_Point_Summary"
                                                SET "Status" = (SELECT "Point_Status" 
                                                                FROM Check_Data_Existence_CTE
                                                                LIMIT 1
                                                                ),
                                                "Remarks" = (SELECT "Remarks"
                                                             FROM Check_Data_Existence_CTE
                                                             LIMIT 1
                                                            ),
                                                "TimeLine" = (SELECT "TimeLine"
                                                             FROM Check_Data_Existence_CTE
                                                             LIMIT 1
                                                             ),
                                                "Approved_Status" = (SELECT "Approved_Status"
                                                                     FROM Check_Data_Existence_CTE
                                                                     LIMIT 1
                                                                    )
                                                WHERE "Point_Name" IN (SELECT "Point_Name"
                                                                       FROM Check_Data_Existence_CTE
                                                                       WHERE "MonthYearID" = $1::TEXT
                                                                      )
                                                ;
                                                `, [monthyearid, indianState, substationname, point.element_desc, 
                                                    point.element_category, point.metric_type, pointStatusVal, pointTimeLineVal, 
                                                    pointRemarksVal]);
        }
        await pool.query(`COMMIT`);

        res.status(201).json("Success");
    }
    catch(error){
        console.log(error);
        errorData = error.toString()
        await pool.query('ROLLBACK');
        console.log("Transaction Rolled Back");
        res.status(500).json({
            errorData
        })
    }
})

router.post("/getPointDetailsForSpecificSubstationAndSpecificMonthYear/", auth, async(req, res) => {
    const { monthyearid, substation_name } = req.body

    try{
        let response = await pool.query(` WITH Data_CTE AS (
                                                SELECT *
                                                FROM "History_SCADA_Point_Summary"
                                                WHERE "MonthYearID" = $1::TEXT
                                                AND "Point_Name" IN (
                                                    SELECT DISTINCT "Point_Name"
                                                    FROM "SCADA_Point_Name_Mapping"
                                                    WHERE "Substation" = $2::TEXT
                                                )
                                            ),
                                            Mapping_Details_CTE AS (
                                                SELECT 
                                                CASE WHEN t2."IOA" = 0 AND t2."ICCP_Name" IS NULL THEN 'No IOA/ICCP_Name Found'
                                                     WHEN t2."State" IN (SELECT DISTINCT "State"
                                                                         FROM "SCADA_Point_Name_Mapping"
                                                                         WHERE "State" != 'CS' AND "State" != 'SR1' AND "State" != 'SR2'
                                                                        )
                                                                        AND t2."ICCP_Name" IS NOT NULL THEN t2."ICCP_Name"
                                                     WHEN t2."State" IN (SELECT DISTINCT "State"
                                                                         FROM "SCADA_Point_Name_Mapping"
                                                                         WHERE "State" = 'CS' OR "State" = 'SR1' OR "State" = 'SR2'
                                                                        )
                                                                        AND t2."IOA" IS NOT NULL AND t2."IOA" != 0 THEN t2."IOA"::TEXT
                                                ELSE 'No IOA/ICCP_Name Found' END AS "IOA/ICCP_Name",
                                                t1."Point_Name", t2."ELEMENT_DESCRIPTION", t2."ELEMENT_CATEGORY", t2."Metric_Type",
                                                t1."No_of_Non_Available_Time_Instances", t1."No_of_Time_Instances",
                                                ROUND((t1."No_of_Non_Available_Time_Instances"::NUMERIC/t1."No_of_Time_Instances")*100, 2) 
                                                AS "Non_Availability_Percentage", t1."Remarks", t1."Status", t1."TimeLine", 
                                                t1."Approved_Status"
                                                FROM Data_CTE t1
                                                LEFT JOIN "SCADA_Point_Name_Mapping" t2
                                                ON TRIM (t1."Point_Name") = TRIM(t2."Point_Name")
                                            )
                                            SELECT jsonb_agg(
                                                    jsonb_build_object(
                                                        'ioa_iccp_name', "IOA/ICCP_Name",
                                                        'analog_point', "Point_Name",
                                                        'element_desc', "ELEMENT_DESCRIPTION",
                                                        'element_category', "ELEMENT_CATEGORY",
                                                        'metric_type', "Metric_Type",
                                                        'no_of_non_available_time_instances', "No_of_Non_Available_Time_Instances",
                                                        'no_of_time_instances' , "No_of_Time_Instances",
                                                        'non_availability_percentage', "Non_Availability_Percentage",
                                                        'remarks' , "Remarks",
                                                        'status' , "Status",
                                                        'timeline', "TimeLine",
                                                        'approved_status', "Approved_Status"
                                                    )
                                                ) AS Point_Details
                                            FROM Mapping_Details_CTE              
                                            `, [monthyearid, substation_name]);
        response = await response.rows;
        res.status(201).json(response)
    }
    catch(err){
        console.log(err)
        res.status(500).json("Server error")
    }
})

router.post("/statesOutput/", auth, async(req, res) => {

    const { monthyearid, year, monthnum, monthname, category, indianState } = req.body;

    console.log("Month Year ID Val => ", monthyearid, typeof monthyearid);
    console.log("Month Num Val => ", monthnum, typeof monthnum);
    console.log("Month Name Value => ", monthname, typeof monthname);
    console.log("Year Val => ", year, typeof year);
    console.log("Category Val => ", category, typeof category);
    console.log("Indian State selected => ", indianState, typeof indianState);

    if (
        [monthyearid, monthnum, monthname, year, category, indianState ].some((filterVal) => {
            return filterVal === undefined || filterVal?.trim() === "" || filterVal?.trim() === undefined
        })
    ) {
        console.log("Some field missing happened.");
        throw ApiError(400, "All Fields are required");
    }

    try{
        let result = await pool.query(` WITH Station_Summary_CTE AS (
                                            SELECT "State", "Substation", "No_of_Non_Reporting_Points",
                                            "No_of_Points",
                                            ROUND((("No_of_Non_Reporting_Points"::decimal/"No_of_Points"::decimal)*100), 2) AS "Percentage_Number_of_Points_Non_Reporting"
                                            FROM "History_SCADA_Month_Summary"
                                            WHERE "MonthYearID" = $1::TEXT
                                            AND "Month" = $2::SMALLINT
                                            AND "Year" = $3::SMALLINT
                                            AND "State" = $4::TEXT
                                        ),
                                        Substation_Mapping_CTE AS (
                                            SELECT DISTINCT
                                            t2."Substation_Name",
                                            t1.* 
                                            FROM Station_Summary_CTE t1
                                            LEFT JOIN "SCADA_Point_Name_Mapping" t2
                                            ON TRIM(t1."State") = TRIM(t2."State")
                                            AND TRIM(t1."Substation") = TRIM(t2."Substation")
                                        )
                                        SELECT 
                                        jsonb_agg (
                                            jsonb_build_object(
                                                'state' , "State",
                                                'substation_code' , "Substation", 
                                                'substation_name' , "Substation_Name",
                                                'no_of_non_performing_points' , "No_of_Non_Reporting_Points",
                                                'no_of_points' , "No_of_Points",
                                                'percentage_number_of_points_non_reporting' , "Percentage_Number_of_Points_Non_Reporting"
                                            )
                                        ) AS Total_Point_Details
                                        FROM Substation_Mapping_CTE`, 
                                    [monthyearid, monthnum, year, indianState])

        result = await result.rows
        console.log("Result => ", result)
        res.status(201).json(result)
    }
    catch(err){
        console.log(err)
        res.status(500).json("Server error")
    }
})

router.post("/adminFileBulkImport/", auth, upload.single('file'), async(req, res) => {

    const { monthyearid, monthnum, monthname, year, category, indianState } = req.body;
    const adminBulkFile = req.file;

    if (
        [monthyearid, monthnum, monthname, year, category, indianState ].some((filterVal) => {
            return filterVal === undefined || filterVal?.trim() === "" || filterVal?.trim() === undefined
        })
    ) {
        console.log("Some field missing happened.");
        throw ApiError(400, "All Fields are required");
    }

    const runBatScript = () => {

        let errorData = "";
        let errorStatus = false;

        return new Promise((resolve, reject) => {
            const bat = cp.spawn('cmd.exe', ['/c',
                'telemetryMonthlyDataToPostgres_bat_content.bat',
                monthyearid,
                monthnum,
                monthname,
                year,
                category,
                indianState,
                adminBulkFile.filename
            ],
                { cwd: '.\\utils\\excelProcessing', shell: true }
            );

            bat.stdout.on('data', (data) => {
                console.log("Bat content on data => \n", data.toString());
            });
        
            bat.stderr.on('data', (data) => {
                console.error("Bat content on error => \n", data.toString());
                errorStatus = true;
                errorData = data.toString();
            });
        
            bat.on('exit', (code) => {
                console.log(`Bat content on exit => \nChild exited with code ${code} and errorStatus => ${errorStatus}`);
        
                if (Number.parseInt(code) == 0 && errorStatus === false){
                    errorData="";
                    resolve(new ApiResponse(201, "Excel File Uploaded", "Excel File Uploaded"))
                }
                else if (Number.parseInt(code) == 0 && errorStatus == true){
                    reject(new ApiError(500, errorData, errorData));
                }
            });
        });
    };

    runBatScript()
    .then((data) => {
        return res.status(data.statusCode).json(
            data.message
        )
    })
    .catch((err) => {
        console.log("Error => ", err);
        return res.status(err.statusCode).json(
            err.errors
        );
    })
    
})

router.post('/statesFileBulkImport/', auth, upload.single('file'), async(req, res) => {
    const { monthyearid, monthnum, monthname, year, category, indianState } = req.body;
    const  statesBulkFile = req.file;

    
    if (
        [monthyearid, monthnum, monthname, year, category, indianState ].some((filterVal) => {
            return filterVal === undefined || filterVal?.trim() === "" || filterVal?.trim() === undefined
        })
    ) {
        console.log("Some field missing happened.");
        throw ApiError(400, "All Fields are required");
    }

    const runBatScript = () => {

        let errorData = "";
        let errorStatus = false;

        return new Promise((resolve, reject) => {
            const bat = cp.spawn('cmd.exe', ['/c',
                'telemetryStatesMonthlyDataToPostgres_bat_content.bat',
                monthyearid,
                monthnum,
                monthname,
                year,
                category,
                indianState,
                statesBulkFile.filename
            ],
                { cwd: '.\\utils\\excelProcessing', shell: true }
            );

            bat.stdout.on('data', (data) => {
                console.log("Bat content on data => \n", data.toString());
            });
        
            bat.stderr.on('data', (data) => {
                console.error("Bat content on error => \n", data.toString());
                errorStatus = true;
                errorData = data.toString();
            });
        
            bat.on('exit', (code) => {
                console.log(`Bat content on exit => \nChild exited with code ${code} and errorStatus => ${errorStatus}`);
        
                if (Number.parseInt(code) == 0 && errorStatus === false){
                    errorData="";
                    resolve(new ApiResponse(201, "Excel File Uploaded", "Excel File Uploaded"))
                }
                else if (Number.parseInt(code) == 0 && errorStatus == true){
                    reject(new ApiError(500, errorData, errorData));
                }
            });
        });
    };

    runBatScript()
    .then((data) => {
        return res.status(data.statusCode).json(
            data.message
        )
    })
    .catch((err) => {
        console.log("Error => ", err);
        return res.status(err.statusCode).json(
            err.errors
        );
    })

})

// router.post('/statesdownloadsubstationsummarydetails/', auth, async(req, res) => {
//     const {monthyearid, indianState } = req.body

//     if (
//         [monthyearid, indianState ].some((filterVal) => {
//             return filterVal === undefined || filterVal?.trim() === "" || filterVal?.trim() === undefined
//         })
//     ) {
//         console.log("Some field missing happened.");
//         throw ApiError(400, "All Fields are required");
//     }else{
//         let response = await pool.query(`WITH Raw_Data_CTE AS (
//                                             SELECT t2."State", t2."Substation", t2."Substation_Name",
//                                             CASE WHEN t2."IOA" = 0 AND t2."ICCP_Name" IS NULL THEN 'No IOA/ICCP_Name Found'
//                                                 WHEN t2."State" IN (SELECT DISTINCT "State"
//                                                                     FROM "SCADA_Point_Name_Mapping"
//                                                                     WHERE "State" != 'CS' AND "State" != 'SR1' AND "State" != 'SR2'
//                                                                     )
//                                                                     AND t2."ICCP_Name" IS NOT NULL THEN t2."ICCP_Name"
//                                                 WHEN t2."State" IN (SELECT DISTINCT "State"
//                                                                     FROM "SCADA_Point_Name_Mapping"
//                                                                     WHERE "State" = 'CS' OR "State" = 'SR1' OR "State" = 'SR2'
//                                                                     )
//                                                                     AND t2."IOA" IS NOT NULL AND t2."IOA" != 0 THEN t2."IOA"::TEXT
//                                             ELSE 'No IOA/ICCP_Name Found' END AS "IOA/ICCP_Name",
//                                             t2."ELEMENT_DESCRIPTION", t2."ELEMENT_CATEGORY", t2."Metric_Type", t1."Point_Name",
//                                             t1."No_of_Non_Available_Time_Instances", t1."No_of_Time_Instances",
//                                             ROUND((t1."No_of_Non_Available_Time_Instances"::NUMERIC/t1."No_of_Time_Instances")*100, 2) AS "Non_Availability_Percentage",
//                                             t1."Status", t1."Remarks", t1."TimeLine", t1."Approved_Status"
//                                             FROM "History_SCADA_Point_Summary" t1
//                                             LEFT JOIN "SCADA_Point_Name_Mapping" t2
//                                             ON TRIM (t1."Point_Name") = TRIM(t2."Point_Name")
//                                             WHERE t2."State" = $1::TEXT
//                                             AND t1."MonthYearID" = $2::TEXT
//                                         ),
//                                         Substation_Related_Point_Json_CTE AS (
//                                             SELECT "State", "Substation", "Substation_Name",
//                                             jsonb_agg(
//                                                 json_build_object(
//                                                     'IOA_ICCP_NAME', "IOA/ICCP_Name",
//                                                     'analog_point', "Point_Name",
//                                                     'ELEMENT_DESCRIPTION', "ELEMENT_DESCRIPTION",
//                                                     'ELEMENT_CATEGORY', "ELEMENT_CATEGORY",
//                                                     'Metric_Type', "Metric_Type",
//                                                     'No_of_Non_Available_Time_Instances', "No_of_Non_Available_Time_Instances",
//                                                     'No_of_Time_Instances', "No_of_Time_Instances",
//                                                     'Non_Availability_Percentage', "Non_Availability_Percentage",
//                                                     'Remarks', "Remarks",
//                                                     'Status', "Status",
//                                                     'TimeLine', "TimeLine",
//                                                     'Approved_Status', "Approved_Status"
//                                                 ) 
//                                             ) AS Point_Details
//                                             FROM Raw_Data_CTE
//                                             GROUP BY "State", "Substation", "Substation_Name"
//                                         )
//                                         SELECT *
//                                         FROM Substation_Related_Point_Json_CTE`,
//                                         [indianState, monthyearid]);
//         response = await response.rows;
//         console.log("To be Excel Download =>");

//         const workbook = new Excel.Workbook();

//         response.forEach((point) => {
            
//             const worksheet = workbook.addWorksheet(point.Substation_Name)
//             const point_details = point.point_details

//             if(point_details && point_details > 0){
//                 const headers = Object.keys(point_details[0]);
//                 worksheet.addRow(headers)
//             }

//             point_details.forEach()
//         })
//         // for(let station of response){
//         //     console.log(station.Substation_Name);
//         //     console.log(station.point_details);
//         // }
//     }
// })

module.exports = router;