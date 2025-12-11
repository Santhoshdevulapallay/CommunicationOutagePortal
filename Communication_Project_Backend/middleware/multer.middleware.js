// import multer from "multer"
const multer = require("multer")
const getCurrentDate = require("../utils/getCurrentDate.js")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './utils/excelProcessing/EXCEL_FILES/')
    },
    filename: function (req, file, cb) {
      // const uniqueSuffix = getCurrentDate() + "_" + req.body.indianState + "_";
      const uniqueSuffix = getCurrentDate() + "_";
      cb(null, uniqueSuffix + file.originalname)
    }
  })

const upload = multer({ storage: storage })
  
module.exports = upload;