const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const axios = require('axios');
const upload = require("../middleware/multer.middleware")

const FormData = require("form-data");
const fs = require("fs");

const base_url = 'http://localhost:5352/backend/'

function handleError(error ,res) {
    // Error: Send 400 status with error message
    const errMsg = error?.response?.data?.error || error.message || "Something went wrong";
    res.status(400).json({ error: errMsg });
}
// Utility function to handle forwarding requests to the Django backend
async function forwardRequest(req, res, endpoint) {
    try {
        const djangoResponse = await axios.post(`${base_url}${endpoint}/`, req.body, {
            headers: {
                'Content-Type': 'application/json'
            },
        });
        // Send the response back to the React frontend
        res.json(djangoResponse.data);
    } catch (error) {
        handleError(error , res)
    }
}

async function downloadStateExcel(req, res, endpoint) {
    try {
        // Forward POST request to Django
        const djangoResponse = await axios.post(`${base_url}${endpoint}/`, req.body, {
            responseType: "stream", // Expect a file as response
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Set response headers for file download
        res.setHeader("Content-Disposition", "attachment; filename=exported_data.csv");
        res.setHeader("Content-Type", "text/csv");
        // Pipe the Django response (CSV file) directly to the frontend
        djangoResponse.data.pipe(res);
    } catch (error) {
        handleError(error , res)
    }
}

async function fileUpload(req, res, endpoint) {
    try {
        
        if (!req.files) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Create a FormData instance to properly send the file to Django
        const formData = new FormData();
        
        const { monthyearid, monthnum, monthname, year, category } = req.body;
        formData.append('monthyearid' , monthyearid)
        formData.append('year' , year)
        formData.append('monthnum' , monthnum)
        formData.append('monthname' , monthname)
        formData.append('category' , category)
        
        
        Array.from(req.files).forEach((file) => {
            // formData.append("files", file); // "files" is the key (backend should accept an array)
            formData.append("files", fs.createReadStream(file.path), file.originalname);

        });
       
        const djangoResponse = await axios.post(
            `${base_url}${endpoint}/`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),  // Important! Sets correct multipart headers
                },
            });
        // // Send the response back to the React frontend
        res.json(djangoResponse.data);
    } catch (error) {
        handleError(error , res)
    }
}

async function statefileUpload(req, res, endpoint) {
    try {
        
        // Create a FormData instance to properly send the file to Django
        const formData = new FormData();
        const { monthyearid, indianState } = req.body;
        formData.append('monthyearid' , monthyearid)
        formData.append('indianState' , indianState)
        formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);
        
        const djangoResponse = await axios.post(
            `${base_url}${endpoint}/`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),  // Important! Sets correct multipart headers
                },
            });
        // // Send the response back to the React frontend
        res.json(djangoResponse.data);
    } catch (error) {
        handleError(error , res)
    }
}

async function generateLetter(req, res, endpoint) {
    try {
        // {
        //     responseType: "stream", // Expect a file as response
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        // }
        // Forward POST request to Django
        const djangoResponse = await axios.post(`${base_url}${endpoint}/`, req.body,{ responseType: 'stream' , headers: {
            "Content-Type": "application/json",
        }, } );
        // Set response headers for file download
        res.setHeader("Content-Disposition", "attachment; filename=reports.zip");
        res.setHeader("Content-Type", "application/zip");
        // Pipe the Django response (.docx file) directly to the frontend
        djangoResponse.data.pipe(res);
    } catch (error) {
        handleError(error , res)
    }
}

router.post("/getStatesSystemType/", auth, (req, res) => {
    forwardRequest(req, res, 'getStatesSystemType');
});

router.post("/fileupload/", auth, upload.array('files') , async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        // Create FormData to send files to Django
        const formData = new FormData();

        const { monthyearid, monthnum, monthname, year, category } = req.body;
        formData.append('monthyearid' , monthyearid)
        formData.append('year' , year)
        formData.append('monthnum' , monthnum)
        formData.append('monthname' , monthname)
        formData.append('category', category)
        
        req.files.forEach(file => {
            formData.append('files', fs.createReadStream(file.path)); 
            // 'files' should match the field name Django expects
        });

        // Send to Django backend
        const response = await axios.post(`${base_url}fileupload/`, formData, {
            headers: {
                ...formData.getHeaders(), // important for multipart
            }
        });

        res.status(200).json({ message: "Files sent to Django", data: response.data });

    } catch (err) {
        console.error("Error sending files to Django:", err.message);
        res.status(500).json({ error: err.message });
    }
});


router.post("/ScadaPointsFileUpload/", auth, upload.array('file'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const formData = new FormData();

        req.files.forEach(file => {
            formData.append('file', fs.createReadStream(file.path));
        });

        const token = req.headers['authorization']; // forward token to Django
       
        const response = await axios.post(`${base_url}ScadaPointsFileUpload/`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: token,
            },
        
        });
         console.log("Hello");
        // Clean up temp files
        req.files.forEach(file => fs.unlinkSync(file.path));

        res.status(200).json({
            message: "Files sent to Django successfully",
            data: response.data
        });

    } catch (err) {
        console.error("Error sending files to Django:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
});



router.get("/getScadaPointMasterList/", auth, (req, res) => {
    forwardRequest(req, res, 'getScadaPointMasterList');
    
});

router.post("/statesSCADAMonthSummary/", auth, (req, res) => {
    forwardRequest(req, res, 'statesSCADAMonthSummary');
    
});

router.post("/stationsCompletelyNotReporting/", auth, (req, res) => {
    forwardRequest(req, res, 'stationsCompletelyNotReporting');
});

router.post("/getPointDetailsForSpecificSubstationAndSpecificMonthYear/", auth, (req, res) => {
    forwardRequest(req, res, 'getPointDetailsForSpecificSubstationAndSpecificMonthYear');
});


router.post("/statesPointsStatusAndRemarks/", auth, (req, res) => {
    forwardRequest(req, res, 'statesPointsStatusAndRemarks');
});

router.post("/scadaPointHistory/", auth, (req, res) => {
    forwardRequest(req, res, 'scadaPointHistory');
});


router.post("/stateDownloadExcel/", auth, (req, res) => {
    downloadStateExcel(req, res, 'stateDownloadExcel');
});

router.post("/stateUploadExcel/", auth, upload.single('file') ,(req, res) => {
    statefileUpload(req, res, 'stateUploadExcel');
});

// download state letter part
router.post("/generate_letter/", auth, (req, res) => {
    generateLetter(req, res, 'generate_letter');
});

router.post("/approvePointDetails/", auth, (req, res) => {
    forwardRequest(req, res, 'approvePointDetails');
});

router.post("/plotlyDataDashboards/", auth, (req, res) => {
    forwardRequest(req, res, 'plotlyDataDashboards');
});

router.post("/remarksTimelineTableDashboard/", auth, (req, res) => {
    forwardRequest(req, res, 'remarksTimelineTableDashboard');
});

router.post("/notReportingTableDashboard/", auth, (req, res) => {
    forwardRequest(req, res, 'notReportingTableDashboard');
});

router.post("/notRectifiedTableDashboard/", auth, (req, res) => {
    forwardRequest(req, res, 'notRectifiedTableDashboard');
});

// RTU
router.get("/getRTUMasterList/", auth, (req, res) => {
    forwardRequest(req, res, 'getRTUMasterList');
});

router.get("/getLatestRTUData/", auth, (req, res) => {
    forwardRequest(req, res, 'getLatestRTUData');
});

router.post("/rtuMasterChange/", auth, (req, res) => {
    forwardRequest(req, res, 'rtuMasterChange');
});

router.post("/saveRTUNotReporting/", auth, (req, res) => {
    forwardRequest(req, res, 'saveRTUNotReporting');
});

router.post("/sendRTUReportMail/", auth, (req, res) => {
    forwardRequest(req, res, 'sendRTUReportMail');
});


async function downloadFile(req, res, endpoint) {
    try {
        const djangoResponse = await axios.get(`${base_url}${endpoint}/`, {
            responseType: "stream", // Important for large PDFs
        });
        
        if (djangoResponse.headers["content-type"]) {
            res.setHeader("Content-Type", djangoResponse.headers["content-type"]);
        }
        if (djangoResponse.headers["content-disposition"]) {
            res.setHeader("Content-Disposition", djangoResponse.headers["content-disposition"]);
        }
    
        // Stream PDF to client
        djangoResponse.data.pipe(res).on("error", (err) => {
            console.error("Stream error:", err);
            res.status(500).send("Error streaming PDF");
        });
    } catch (error) {
        handleError(error, res);
    }
}

async function downloadPreviewPDF(req, res, endpoint) {
    try {
        const djangoResponse = await axios.post(`${base_url}${endpoint}/`,req.body , {
            responseType: "stream", // Important for large PDFs
        });
        
        if (djangoResponse.headers["content-type"]) {
            res.setHeader("Content-Type", djangoResponse.headers["content-type"]);
        }
        if (djangoResponse.headers["content-disposition"]) {
            res.setHeader("Content-Disposition", djangoResponse.headers["content-disposition"]);
        }
    
        // Stream PDF to client
        djangoResponse.data.pipe(res).on("error", (err) => {
            console.error("Stream error:", err);
            res.status(500).send("Error streaming PDF");
        });
    } catch (error) {
        handleError(error, res);
    }
}

async function  fileUpload(req, res, endpoint) {
    try {
        
        // Create a FormData instance to properly send the file to Django
        const formData = new FormData();
        formData.append("file", fs.createReadStream(req.file.path), req.file.originalname);
        
        const djangoResponse = await axios.post(
            `${base_url}${endpoint}/`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),  // Important! Sets correct multipart headers
                },
            });
        // // Send the response back to the React frontend
        res.json(djangoResponse.data);
    } catch (error) {
        handleError(error , res)
    }
}

router.get("/downloadRTUTemplate/", auth, (req, res) => {
    downloadFile(req, res, 'downloadRTUTemplate');
});

router.post("/uploadRTUMaster/", auth, upload.single('file') ,(req, res) => {
    fileUpload(req, res, 'uploadRTUMaster');
});

router.post("/newRTUCreate/", auth, (req, res) => {
    forwardRequest(req, res, 'newRTUCreate');
});

router.get("/downloadRTULog/", auth, (req, res) => {
    downloadFile(req, res, 'downloadRTULog');
});

router.post("/saveRTUMasterTable/", auth, (req, res) => {
    forwardRequest(req, res, 'saveRTUMasterTable');
    
});

router.post("/saveSCADAPointsMasterTable/", auth, (req, res) => {
    forwardRequest(req, res, 'saveSCADAPointsMasterTable');
    
});

router.post("/previewReport/", auth, (req, res) => {
    
    downloadPreviewPDF(req, res, 'previewReport');
});
// Intra state data

function parseRequestData(body) {
    const result = {};
  
    for (let key in body) {
      const value = body[key];
  
      // Convert keys like requests[0][elements][0][nameOfElement]
      const parts = key.split(/\[|\]/).filter(Boolean); // ["requests", "0", "elements", "0", "nameOfElement"]
  
      let current = result;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const next = parts[i + 1];
  
        if (i === parts.length - 1) {
          // last part → assign value
          current[part] = value;
        } else {
          if (!current[part]) {
            // decide whether to create array or object
            current[part] = /^\d+$/.test(next) ? [] : {};
          }
          current = current[part];
        }
      }
    }
  
    return result;
}
  
router.post("/intraStateReq/", auth, upload.any(), async (req, res) => {
    try {
      // Step 1: Parse only input fields (req.body) into nested JSON
      const structuredData = parseRequestData({ ...req.body });
  
      // Step 2: Build FormData for Django
      const formData = new FormData();
      formData.append("data", JSON.stringify(structuredData));
  
      // Step 3: Append all files directly (keep fieldname)
      req.files.forEach(file => {
        formData.append(file.fieldname, fs.createReadStream(file.path));
      });
  
      // Step 4: Send to Django backend
      const response = await axios.post(`${base_url}intraStateReq/`, formData, {
        headers: formData.getHeaders(),
      });
  
      res.json(response.data );
    } catch (err) {
        handleError(err , res)
    }
  });
  

router.get("/getIntraStateReq/", auth, (req, res) => {
    forwardRequest(req, res, 'getIntraStateReq');
});

router.post("/getSubstationsList/", auth, (req, res) => {
    forwardRequest(req, res, 'getSubstationsList');
});
//  Digital

router.post("/digitalPointDetailsSummary/", auth, (req, res) => {
    forwardRequest(req, res, 'digitalPointDetailsSummary');
});

router.post("/updateDigitalPoint/", auth, (req, res) => {
    forwardRequest(req, res, 'updateDigitalPoint');
});


async function downloadIntraStateUploads(req, res, endpoint) {
    try {
        // Forward POST request to Django
        const djangoResponse = await axios.post(`${base_url}${endpoint}/`, req.body, {
            responseType: "stream", // Expect a file as response
            headers: {
                "Content-Type": "application/json",
            },
        });
        djangoResponse.data.pipe(res);
    } catch (error) {
        handleError(error , res)
    }
}


router.post("/downloadIntraStateUploads/", auth, (req, res) => {
    downloadIntraStateUploads(req, res, 'downloadIntraStateUploads');
});


module.exports = router;