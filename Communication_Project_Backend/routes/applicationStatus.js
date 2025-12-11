var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
const { ApplicationStatus } = require("../models/applicationStatus");
const commonLinkOutage = require("./commonLinkOutage");
const commonEquipmentOutage = require("./commonEquipmentOutage");
const common = require("./common");

const { Link } = require("../models/link");
const { Equipment } = require("../models/equipment");

const { LinkOutage, validate } = require("../models/llinkOutage");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
var Excel = require("exceljs");
const { EquipmentOutage } = require("../models/equipmentOutage");
const { result } = require("lodash");
const freezeUnknownStatusOutages = require("./Functions/freezeUnknownStatusOutages");


router.post("/freezeStatus", auth, async (req, res) => {
  let applicationStatus = new ApplicationStatus({
    typeApplication: req.body.typeApplication,
    year: req.body.year,
    month: req.body.month,
    FreezedDate: new Date(),
  });
  console.log('started frezzing')
  var cod1_startDate = new Date(req.body.year, parseInt(req.body.month)-1, 1);
  var cod1_endDate = new Date(
    req.body.year,
    parseInt(req.body.month),
    1
  );
  console.log(cod1_startDate,cod1_endDate )
  if(req.body.typeApplication=="COD1"){
    if(await !freezeUnknownStatusOutages.freezeUnknownLinkOutages(cod1_startDate, cod1_endDate)){
      return res.status(404).send("Problem in freezing. Please contact administrator");
    }
  }
  if(req.body.typeApplication=="COD2"){
    if(await !freezeUnknownStatusOutages.freezeUnknownEquipmentOutages(cod1_startDate, cod1_endDate)){
      return res.status(404).send("Problem in freezing. Please contact administrator");
    }
  }
 
  applicationStatus = await applicationStatus.save();
  res.send(applicationStatus);
});

router.get("/freezeStatus/:typeApplication/:year/:month",  auth , async (req, res) => {
  

  const applicationStatus = await common.getApplicationStatus(
    req.params.typeApplication,
    req.params.year,
    req.params.month
  );

  if (!applicationStatus) return res.send([{ status: false }]);

  res.send([{ status: true }]);
});

router.get("/downloadcoa1/:year/:month", auth, async (req, res) => {
  var linkoutages;

  //gets 10 so 11th month start date
  var coa1_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa1_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  var coa1For =
    coa1_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    req.params.year;
  //   if (req.user.isAdmin || req.user.isSupervisor || req.user.isOperator) {
  linkoutages = await LinkOutage.find({
    proposedStartDate: {
      $gte: coa1_startDate,
      $lt: coa1_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  }).sort({requestingAgency:1,  proposedStartDate : 1})
    .populate("link")
    .populate("requestingAgency");

  var workbook = new Excel.Workbook();
  workbook.xlsx
    .readFile("samplecoa1.xlsx")
    .then(function () {
      var worksheet = workbook.getWorksheet(1);
      var row = worksheet.getRow(4);
      row.getCell(13).value = new Date();
      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      var row = worksheet.getRow(3);
      row.getCell(1).value = coa1For;
      row.commit();
      var allActionNotTaken = false;
      worksheet.pageSetup.printArea = 'A1:M'+(linkoutages.length+7).toString();


      for (var i = 0; i < linkoutages.length; i++) {
        var row = worksheet.getRow(i + 8);
        row.getCell(1).value = i + 1;
        row.getCell(1).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        
        // for( var i=2; i<=12;i++)
        // {
        //   row.getCell(i).alignment = { vertical: 'justify', horizontal: 'justify' };
        // }

        row.getCell(2).value = linkoutages[i].requestingAgency.userName;
        row.getCell(3).value = linkoutages[i].link.description;
        row.getCell(4).value = linkoutages[i].link.source;
        row.getCell(5).value = linkoutages[i].link.destination;
        row.getCell(6).value = linkoutages[i].alternateChannelStatus;
        row.getCell(7).value = linkoutages[i].link.ownership.toString();
        row.getCell(8).value = linkoutages[i].reasonPrecautions;
        row.getCell(9).value = moment(linkoutages[i].proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
        row.getCell(10).value = moment(linkoutages[i].proposedEndDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
        hourminutes= moment
          .duration(
            moment(linkoutages[i].proposedEndDate).diff(
              moment(linkoutages[i].proposedStartDate)
            )
          )
          .format("hh:mm");
        if(hourminutes.includes(':'))
        {
          row.getCell(11).value = hourminutes
        }           
        else
        {
          row.getCell(11).value ='00:'+ hourminutes
        }
        row.getCell(12).value = linkoutages[i].Approvalstatus;
        if (linkoutages[i].Approvalstatus == "Pending") {
          allActionNotTaken = true;
        }
        row.getCell(13).value = linkoutages[i].rpcRemarks;
        row.commit();
      }
      if (allActionNotTaken) {
        var row = worksheet.getRow(2);
        row.getCell(1).value =
          "List of outages of Communication Links, proposed during the month of";
        row.commit();
      }

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});

router.get("/downloadcod1/:year/:month", auth, async (req, res) => {
  var availedOutages;

  var cod1_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  var cod1_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  var cod1For =
    cod1_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    req.params.year;

  // if (req.user.isAdmin) {
  availedOutages = await LinkOutage.find({ deleteStatus: 0 })
    .or([
      {
        $and: [
          {
            approvedStartDate: {
              $gte: cod1_startDate,
              $lt: cod1_endDate,
            },
          },
          { Approvalstatus: "Approved" },
        ],
      },
      {
        $and: [
          {
            proposedStartDate: {
              $gte: cod1_startDate,
              $lt: cod1_endDate,
            },
          },
          { outageType: "Emergency" },
        ],
      },
      {
        $and: [
          {
            outageStartDate: {
              $gte: cod1_startDate,
              $lt: cod1_endDate,
            },
          },
          { outageType: "Forced" },
        ],
      },
    ]).sort({requestingAgency:1,  outageStartDate : 1})
    .populate("link")
    .populate("requestingAgency");

  var workbook = new Excel.Workbook();

  workbook.xlsx
    .readFile("samplecod1.xlsx")
    .then(async function () {
      var worksheet = workbook.getWorksheet(1);
      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      var row = worksheet.getRow(3);
      row.getCell(1).value = cod1For;
      row.commit();

      for (var i = 0; i < availedOutages.length; i++) {
        var row = worksheet.getRow(i + 8);
        row.getCell(1).value = i + 1;
        row.getCell(1).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        row.getCell(2).value = availedOutages[i].requestingAgency.userName;
        row.getCell(3).value = availedOutages[i].link.description;
        row.getCell(4).value = availedOutages[i].link.source;
        row.getCell(5).value = availedOutages[i].link.destination;
        row.getCell(6).value = availedOutages[i].alternateChannelStatus;
        row.getCell(7).value = availedOutages[i].link.ownership.toString();
        row.getCell(8).value = availedOutages[i].reasonPrecautions;
        if(availedOutages[i].outageType == "Forced")
        {
          row.getCell(9).value='';
          row.getCell(10).value='';
          row.getCell(11).value='';
        }
        else if(availedOutages[i].outageType == "Planned"){
          row.getCell(9).value = moment(availedOutages[i].approvedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
          row.getCell(10).value = moment(availedOutages[i].approvedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");

          row.getCell(11).value = moment
            .duration(
              moment(availedOutages[i].approvedEndDate).diff(
                moment(availedOutages[i].approvedStartDate)
              )
            )
            .format("hh:mm");

        }
        else if(availedOutages[i].outageType == "Emergency"){
          row.getCell(9).value = moment(availedOutages[i].proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
          row.getCell(10).value = moment(availedOutages[i].proposedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");

          row.getCell(11).value = moment
            .duration(
              moment(availedOutages[i].proposedEndDate).diff(
                moment(availedOutages[i].proposedStartDate)
              )
            )
            .format("hh:mm");

        }
        
        if(availedOutages[i].outageStartDate){
          row.getCell(12).value = moment(availedOutages[i].outageStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
          row.getCell(13).value = moment(availedOutages[i].outageEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");
          var hourminutes = moment
            .duration(
              moment(availedOutages[i].outageEndDate).diff(
                moment(availedOutages[i].outageStartDate)
              )
            )
            .format("hh:mm");
          if(hourminutes.includes(':'))
          {
            row.getCell(14).value = hourminutes
          }           
          else
          {
            row.getCell(14).value ='00:'+ hourminutes
          }
           
                
        }
        else{
          row.getCell(12).value=''
          row.getCell(13).value=''
          row.getCell(14).value=''
        }

        if (availedOutages[i].outageType == "Forced") {
            row.getCell(15).value = "Y";
        } else if (
          availedOutages[i].outageType == "Planned" &&
          new Date(availedOutages[i].outageStartDate) >=
            new Date(availedOutages[i].approvedStartDate) &&
          new Date(availedOutages[i].outageEndDate) <=
            new Date(availedOutages[i].approvedEndDate)
        ) {
          row.getCell(15).value = "N";
        } else if (
          availedOutages[i].outageType == "Emergency" &&
          new Date(availedOutages[i].outageStartDate) >=
            new Date(availedOutages[i].proposedStartDate) &&
          new Date(availedOutages[i].outageEndDate) <=
            new Date(availedOutages[i].proposedEndDate)
        ) {
          row.getCell(15).value = "N";
        }else {
          row.getCell(15).value = "Y";
        }
        if(availedOutages[i].availedStatus==0){
          row.getCell(16).value = "Not Entered";
        }
        else if(availedOutages[i].availedStatus==1){
          row.getCell(16).value = "Availed";
        }
        else if(availedOutages[i].availedStatus==2){
          row.getCell(16).value = "Un Availed";
        }

        row.getCell(17).value = availedOutages[i].outageType;
        row.commit();
      }

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});


router.get("/downloadoutageSummary/:year/:month", auth, async (req, res) => {
  try {
    const LinkOutage = mongoose.model("LinkOutage");

    var startDate = new Date(req.params.year, parseInt(req.params.month), 1);
    var endDate = new Date(
      req.params.year,
      parseInt(req.params.month) + 1,
      1
    );


   

    console.log("reached")

    console.log(startDate, endDate)

    // const linkoutages = await LinkOutage.find(
    //   {
    //     $or: [
    //       {
    //         outageType: { $in: ["Planned", "Emergency", "Forced"] },
    //         outageStartDate: { $gte: startDate },
    //         outageEndDate: { $lte: endDate }
    //       },
    //       {
    //         outageType: { $in: ["Planned", "Emergency", "Forced"] },
    //         approvedStartDate: { $gte: startDate },
    //         approvedEndDate: { $lte: endDate }
    //       }
    //     ]
    //     // Add additional match conditions if needed, e.g., based on year and month
    //   });
    
    // console.log(linkoutages)

    const result = await LinkOutage.aggregate([
      {
        $match: {
          $or: [
            {
              outageType: { $in: ["Planned", "Emergency", "Forced"] },
              outageStartDate: { $gte: startDate },
              outageEndDate: { $lte: endDate }
            },
            {
              outageType: { $in: ["Planned", "Emergency", "Forced"] },
              approvedStartDate: { $gte: startDate },
              approvedEndDate: { $lte: endDate }
            }
          ]
          // Add additional match conditions if needed, e.g., based on year and month
        }
      },
      {
        $lookup: {
          from: "users", // The name of the "User" collection
          localField: "requestingAgency",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $group: {
          _id: "$user.userName", // Group by user name
          plannedCount: {
            $sum: {
              $cond: [
                { $eq: ["$outageType", "Planned"] }, 
                { $cond: [{ $ifNull: ["$outageStartDate", null] }, 1, 0] }, 
                0
              ]
            }
          },
          approvedCount: {
            $sum: {
              $cond: [
                { $eq: ["$outageType", "Planned"] }, 
                { $cond: [{ $ifNull: ["$approvedStartDate", null] }, 1, 0] }, 
                0
              ]
            }
          },
          emergencyCount: {
            $sum: {
              $cond: [{ $eq: ["$outageType", "Emergency"] }, 1, 0]
            }
          },
          forcedCount: {
            $sum: {
              $cond: [{ $eq: ["$outageType", "Forced"] }, 1, 0]
            }
          }
        }
      }
    ]);
    const EquipmentOutage = mongoose.model("EquipmentOutage");

    var startDate = new Date(req.params.year, parseInt(req.params.month), 1);
    var endDate = new Date(
      req.params.year,
      parseInt(req.params.month) + 1,
      1
    );
    console.log(startDate, endDate)
    console.log("reached")
    const resulte = await EquipmentOutage.aggregate([
      {
        $match: {
          $or: [
            {
              outageType: { $in: ["Planned", "Emergency", "Forced"] },
              outageStartDate: { $gte: startDate },
              outageEndDate: { $lte: endDate }
            },
            {
              outageType: { $in: ["Planned", "Emergency", "Forced"] },
              approvedStartDate: { $gte: startDate },
              approvedEndDate: { $lte: endDate }
            }
          ]
          // Add additional match conditions if needed, e.g., based on year and month
        }
      },
      {
        $lookup: {
          from: "users", // The name of the "User" collection
          localField: "requestingAgency",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $group: {
          _id: "$user.userName", // Group by user name
          plannedCountE: {
            $sum: {
              $cond: [
                { $eq: ["$outageType", "Planned"] }, 
                { $cond: [{ $ifNull: ["$outageStartDate", null] }, 1, 0] }, 
                0
              ]
            }
          },
          approvedCountE: {
            $sum: {
              $cond: [
                { $eq: ["$outageType", "Planned"] }, 
                { $cond: [{ $ifNull: ["$approvedStartDate", null] }, 1, 0] }, 
                0
              ]
            }
          },
          emergencyCountE: {
            $sum: {
              $cond: [{ $eq: ["$outageType", "Emergency"] }, 1, 0]
            }
          },
          forcedCountE: {
            $sum: {
              $cond: [{ $eq: ["$outageType", "Forced"] }, 1, 0]
            }
          }
        }
      }
    ]);
    summaryUsers = ["PGCIL SR 1", "PGCIL SR 2", "APTRANSCO", "KPTCL", "KSEBL", "TANTRANSCO", "TSTRANSCO", "PED, Puducherry"]

    summaryUsers = {
      "PGCIL SR 1":
        {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "PGCIL SR 2":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "APTRANSCO":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "KPTCL":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "KSEBL":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "TANTRANSCO":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "TSTRANSCO":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0},
      "PED, Puducherry":
      {'plannedCount':0, 'approvedCount': 0, 'emergencyCount':0, 'forcedCount':0, 'plannedCountE':0, 'approvedCountE': 0, 'emergencyCountE':0, 'forcedCountE':0}
    }
    

    for (var i = 0; i < result.length; i++) { 
     
      summaryUsers[result[i]['_id']]['plannedCount'] = result[i]['plannedCount']
      summaryUsers[result[i]['_id']]['approvedCount'] = result[i]['approvedCount']
      summaryUsers[result[i]['_id']]['emergencyCount'] = result[i]['emergencyCount']
      summaryUsers[result[i]['_id']]['forcedCount'] = result[i]['forcedCount']
    }

    
    for (var i = 0; i < resulte.length; i++) { 
      summaryUsers[resulte[i]['_id']]['plannedCountE'] = resulte[i]['plannedCountE']
      summaryUsers[resulte[i]['_id']]['approvedCountE'] = resulte[i]['approvedCountE']
      summaryUsers[resulte[i]['_id']]['emergencyCountE'] = resulte[i]['emergencyCountE']
      summaryUsers[resulte[i]['_id']]['forcedCountE'] = resulte[i]['forcedCountE']
    }

    console.log(summaryUsers)

    // // Merge the data based on _id
    // const mergedData = data1.map(item1 => {
    //   const matchingItem = data2.find(item2 => item1._id === item2._id);
    //   return { ...item1, ...matchingItem };
    // });

    // Create a JSON response
    // res.setHeader("Content-Type", "application/json");
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename=outageSummary-${req.params.year}-${req.params.month}.json`
    // );
    // res.status(200).json(result);
    var workbook = new Excel.Workbook();

    workbook.xlsx
      .readFile("outagesummary1.xlsx")
      .then(async function () {
        var worksheet = workbook.getWorksheet(1);
        var borderStyles = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        
        i=0
        for (key in summaryUsers) {
          console.log(key)
          var row = worksheet.getRow(5 + 2*i);
          row.getCell(1).value = key;
          row.getCell(2).value = summaryUsers[key].approvedCount;
          row.getCell(3).value = summaryUsers[key].plannedCount;
          row.getCell(4).value = (summaryUsers[key].plannedCount / summaryUsers[key].approvedCount) * 100;
          row.getCell(5).value = summaryUsers[key].approvedCountE;
          row.getCell(6).value = summaryUsers[key].plannedCountE;
          row.getCell(7).value = (summaryUsers[key].plannedCountE/ summaryUsers[key].approvedCountE)*100;
          row.getCell(11).value = summaryUsers[key].emergencyCount;
          row.getCell(12).value = summaryUsers[key].emergencyCountE;
          row.getCell(13).value = summaryUsers[key].forcedCount;
          row.getCell(14).value = summaryUsers[key].forcedCountE;
          row.commit();
          i=i+1
        }

        for (var i = 0; i < result.length; i++) {
          
          
          
        }

        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
            cell.border = borderStyles;
          });
        });
      })
      .then(function () {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "Report.xlsx"
        );
        workbook.xlsx.write(res).then(function () {
          res.end();
        });
      })
      .then(function () {
        console.log("Done");
      });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/downloadcod3/:year/:month", auth, async (req, res) => {
  var cod3outages;

  const cod3_startDate = new Date(req.params.year, req.params.month - 12, 1);
  const cod3_endDate = new Date(req.params.year, req.params.month - 1, 1);

  var cod3For =
    cod3_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    cod3_startDate.getFullYear().toString() +
    " to " +
    (cod3_endDate.toLocaleDateString("default", { month: "long" }).toString() +
      " " +
      cod3_endDate.getFullYear().toString());

  var links = (links = await Link.find({
    requestApprovalStatusTaken: { $exists: false },
    hide: { $exists: false },
  }));

  // console.log(linkOutage[0]._id.link)

  var workbook = new Excel.Workbook();

  workbook.xlsx
    .readFile("samplecod3.xlsx")
    .then(async function () {
      var worksheet = workbook.getWorksheet(1);

      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      for (var linki = 0; linki < links.length; linki++) {
        var row = worksheet.getRow(linki * 4 + 10);
        row.getCell(1).value = linki + 1;
        row.getCell(2).value = links[linki].user;
        row.getCell(3).value = links[linki].description;
        row.getCell(4).value = links[linki].source;
        row.getCell(5).value = links[linki].destination;
        row.getCell(6).value = links[linki].channelRouting;
        row.getCell(7).value = links[linki].ownership.toString();
        row.commit();
      }

      var row = worksheet.getRow(3);
      row.getCell(1).value = cod3For;
      row.commit();

      // for every month

      for (var monthi = 12; monthi > 0; monthi--) {
        var monthStartDate = new Date(
          req.params.year,
          req.params.month - monthi,
          1
        );
        var monthEndDate = new Date(
          req.params.year,
          req.params.month - monthi + 1,
          1
        );
        var MonthName =
          monthStartDate.toLocaleDateString("default", { month: "long" }) +
          " " +
          monthStartDate.getFullYear();

        var row = worksheet.getRow(7);
        row.getCell(9 + (12 - monthi)).value = MonthName;
        row.commit();

        var linkOutage = await LinkOutage.aggregate([
          {
            $match: {
              $or: [
                {
                  $and: [
                    {
                      approvedStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { Approvalstatus: "Approved" },
                  ],
                },
                {
                  $and: [
                    {
                      proposedStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { outageType: "Emergency" },
                  ],
                },
                {
                  $and: [
                    {
                      outageStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { outageType: "Forced" },
                  ],
                },
              ],
            },
          },
          {
            $group: {
              _id: { link: "$link", outageType: "$outageType" },
              totalMilliSec: {
                $sum: {
                  $subtract: ["$outageEndDate", "$outageStartDate"],
                },
              },
            },
          },
        ]);
        // console.log(linkOutage);
        
        for (var linki = 0; linki < links.length; linki++) {
          var totalHours =0;
          var x = linkOutage.filter(
            (lo) =>
              lo._id.link == links[linki]._id.toString() &&
              lo._id.outageType == "Planned"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(linki * 4 + 10);
            totalHours +=x[0].totalMilliSec;
              hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
              if(hourminutes.includes(':'))
              {
                row.getCell(9 + (12 - monthi)).value = hourminutes
              }           
              else
              {
                row.getCell(9 + (12 - monthi)).value ='00:'+ hourminutes
              }           
            row.commit();
          }

          var x = linkOutage.filter(
            (lo) =>
              lo._id.link == links[linki]._id.toString() &&
              lo._id.outageType == "Forced"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(linki * 4 + 11);
            totalHours +=x[0].totalMilliSec;
            hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
              if(hourminutes.includes(':'))
              {
                row.getCell(9 + (12 - monthi)).value = hourminutes
              }           
              else
              {
                row.getCell(9 + (12 - monthi)).value ='00:'+ hourminutes
              }           
            row.commit();
          }

          var x = linkOutage.filter(
            (lo) =>
              lo._id.link == links[linki]._id.toString() &&
              lo._id.outageType == "Emergency"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(linki * 4 + 12);
            totalHours +=x[0].totalMilliSec;
            hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
              if(hourminutes.includes(':'))
              {
                row.getCell(9 + (12 - monthi)).value = hourminutes
              }           
              else
              {
                row.getCell(9 + (12 - monthi)).value ='00:'+ hourminutes
              }
            row.commit();
          }

          var row = worksheet.getRow(linki * 4 + 13);
          //total hours of that month of that type
          totalHours = moment.duration(totalHours).format("hh:mm");
          if(totalHours.includes(':'))
          {
            row.getCell(9 + (12 - monthi)).value = totalHours;
          }
          else
          {
            row.getCell(9 + (12 - monthi)).value ='00:'+ totalHours;
          }
         
          row.commit();

          //total all months
          if(monthi==1){
            //Planned
            var row = worksheet.getRow(linki * 4 + 10);
            const linkOutageP = await commonLinkOutage.getRollingOutageMillisecDBByType(
              links[linki]._id ,
              req.params.year,
              req.params.month,
              "Planned"
            );
            if (linkOutageP.length > 0) {
                  hourminutes = moment.duration(linkOutageP[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(9 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(9 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //Forced
            var row = worksheet.getRow(linki * 4 + 11);
            const linkOutageF = await commonLinkOutage.getRollingOutageMillisecDBByType(
              links[linki]._id ,
              req.params.year,
              req.params.month,
              "Forced"
            );
            if (linkOutageF.length > 0) {
                  hourminutes = moment.duration(linkOutageF[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(9 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(9 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //Emergency
            var row = worksheet.getRow(linki * 4 + 12);
            const linkOutageE = await commonLinkOutage.getRollingOutageMillisecDBByType(
              links[linki]._id ,
              req.params.year,
              req.params.month,
              "Emergency"
            );
            if (linkOutageE.length > 0) {
                  hourminutes = moment.duration(linkOutageE[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(9 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(9 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //All
            var row = worksheet.getRow(linki * 4 + 13);
            const linkOutageALL = await commonLinkOutage.getRollingOutageMillisecDB(
              links[linki]._id ,
              req.params.year,
              req.params.month
            );
            if (linkOutageALL.length > 0) {
                  hourminutes = moment.duration(linkOutageALL[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(9 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(9 + (12)).value ='00:'+ hourminutes;
                  }

              var linkOutageALLhours = Math.floor(
                linkOutageALL[0].totalMilliSec / (1000 * 60 * 60)
              );
              var row = worksheet.getRow(linki * 4 + 10);
              if (linkOutageALLhours <= 48){
                row.getCell(9 + (13)).value="N";
              }
              else{
                row.getCell(9 + (13)).value="Y";
              }
            }
            
          }

        }
      }
      //end

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});

router.get("/downloadcod2/:year/:month", auth, async (req, res) => {
  var availedOutages;

  var cod2_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  var cod2_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  var cod2For =
    cod2_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    req.params.year;

  availedOutages = await EquipmentOutage.find({ deleteStatus: 0 })
    .or([
      {
        $and: [
          {
            approvedStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
          { Approvalstatus: "Approved" },
        ],
      },
      {
        $and: [
          {
            proposedStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
          { outageType: "Emergency" },
        ],
      },
      {
        $and: [
          {
            outageStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
          { outageType: "Forced" },
        ],
      },
    ]).sort({requestingAgency:1,  outageStartDate : 1})
    .populate("equipment")
    .populate("requestingAgency")
    .populate("linksAffected");

  var workbook = new Excel.Workbook();

  workbook.xlsx
    .readFile("samplecod2.xlsx")
    .then(async function () {
      var worksheet = workbook.getWorksheet(1);
      // var row = worksheet.getRow(5);
      // row.getCell(1).value = 5; // A5's value set to 5

      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      var row = worksheet.getRow(3);
      row.getCell(1).value = cod2For;
      var row = worksheet.getRow(4);
      row.getCell(14).value = new Date();
      row.commit();

      for (var i = 0; i < availedOutages.length; i++) {
        // console.log(availedOutages[i])
        var row = worksheet.getRow(i + 8);
        row.getCell(1).value = i + 1;
        row.getCell(1).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        row.getCell(2).value = availedOutages[i].requestingAgency.userName;
        row.getCell(3).value = availedOutages[i].equipment.description;
        row.getCell(4).value = availedOutages[i].equipment.location;
        row.getCell(5).value = getLinksAffectedText(availedOutages[i]);
        row.getCell(6).value = availedOutages[i].alternateChannelPathStatus;
        row.getCell(7).value = availedOutages[i].equipment.ownership.toString();
        row.getCell(8).value = availedOutages[i].reasonPrecautions;
        
        if(availedOutages[i].outageType == "Forced")
        {
          row.getCell(9).value='';
          row.getCell(10).value='';
          row.getCell(11).value='';
        }
        else if(availedOutages[i].outageType == "Planned"){
          row.getCell(9).value = moment(availedOutages[i].approvedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
          row.getCell(10).value = moment(availedOutages[i].approvedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");

          row.getCell(11).value = moment
            .duration(
              moment(availedOutages[i].approvedEndDate).diff(
                moment(availedOutages[i].approvedStartDate)
              )
            )
            .format("hh:mm");

        }
        else if(availedOutages[i].outageType == "Emergency"){
          row.getCell(9).value = moment(availedOutages[i].proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
          row.getCell(10).value = moment(availedOutages[i].proposedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");

          row.getCell(11).value = moment
            .duration(
              moment(availedOutages[i].proposedEndDate).diff(
                moment(availedOutages[i].proposedStartDate)
              )
            )
            .format("hh:mm");

        }
        
        if(availedOutages[i].outageStartDate){
          row.getCell(12).value = moment(availedOutages[i].outageStartDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");
          row.getCell(13).value = moment(availedOutages[i].outageEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm");

          var hourminutes = moment
            .duration(
              moment(availedOutages[i].outageEndDate).diff(
                moment(availedOutages[i].outageStartDate)
              )
            )
            .format("hh:mm");
          if(hourminutes.includes(':'))
          {
            row.getCell(14).value = hourminutes
          }           
          else
          {
            row.getCell(14).value ='00:'+ hourminutes
          }
        }
        else
        {
          row.getCell(12).value='';
          row.getCell(13).value='';
          row.getCell(14).value='';
        }
        
        if (availedOutages[i].outageType == "Forced") {
          row.getCell(15).value = "Y";
        } else if (
          availedOutages[i].outageType == "Planned" &&
          new Date(availedOutages[i].outageStartDate) >=
            new Date(availedOutages[i].approvedStartDate) &&
          new Date(availedOutages[i].outageEndDate) <=
            new Date(availedOutages[i].approvedEndDate)
        ) {
          row.getCell(15).value = "N";
        } else if (
          availedOutages[i].outageType == "Emergency" &&
          new Date(availedOutages[i].outageStartDate) >=
            new Date(availedOutages[i].proposedStartDate) &&
          new Date(availedOutages[i].outageEndDate) <=
            new Date(availedOutages[i].proposedEndDate)
        ) {
          row.getCell(15).value = "N";
        }  else {
          row.getCell(15).value = "Y";
        }
        if(availedOutages[i].availedStatus==0){
          row.getCell(16).value = "Not Entered";
        }
        else if(availedOutages[i].availedStatus==1){
          row.getCell(16).value = "Availed";
        }
        else if(availedOutages[i].availedStatus==2){
          row.getCell(16).value = "Un Availed";
        }
        row.getCell(17).value = availedOutages[i].outageType;
        row.commit();
      }

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});

router.get("/downloadcoa2/:year/:month", auth, async (req, res) => {
  var equipmentoutages;

  //gets 10 so 11th month start date
  var coa2_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa2_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  var coa2For =
    coa2_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    req.params.year;
  equipmentoutages = await EquipmentOutage.find({
    proposedStartDate: {
      $gte: coa2_startDate,
      $lt: coa2_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  }).sort({requestingAgency:1,  proposedStartDate : 1})
    .populate("equipment")
    .populate("requestingAgency")
    .populate("linksAffected");

  var workbook = new Excel.Workbook();

  workbook.xlsx
    .readFile("samplecoa2.xlsx")
    .then(function () {
      var worksheet = workbook.getWorksheet(1);

      var row = worksheet.getRow(4);
      row.getCell(13).value = new Date(); // A5's value set to 5

      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      var row = worksheet.getRow(3);
      row.getCell(1).value = coa2For;
      row.commit();
      var allActionNotTaken = false;
      for (var i = 0; i < equipmentoutages.length; i++) {
        var row = worksheet.getRow(i + 8);
        row.getCell(1).value = i + 1;
        row.getCell(1).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        row.getCell(2).value = equipmentoutages[i].requestingAgency.userName;
        row.getCell(3).value = equipmentoutages[i].equipment.description;
        row.getCell(4).value = equipmentoutages[i].equipment.location;

        row.getCell(5).value = getLinksAffectedText(equipmentoutages[i]);
        row.getCell(6).value = equipmentoutages[i].alternateChannelPathStatus;
        row.getCell(7).value = equipmentoutages[
          i
        ].equipment.ownership.toString();
        row.getCell(8).value = equipmentoutages[i].reasonPrecautions;
        row.getCell(9).value = moment(equipmentoutages[i].proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
        row.getCell(10).value = moment(equipmentoutages[i].proposedEndDate)
          .local()
          .format("DD-MMM-YYYY HH:mm");
        var hourminutes = moment
          .duration(
            moment(equipmentoutages[i].proposedEndDate).diff(
              moment(equipmentoutages[i].proposedStartDate)
            )
          )
          .format("hh:mm");
        if(hourminutes.includes(':'))
        {
          row.getCell(11).value = hourminutes
        }           
        else
        {
          row.getCell(11).value ='00:'+ hourminutes
        }
        row.getCell(12).value = equipmentoutages[i].Approvalstatus;
        if (equipmentoutages[i].Approvalstatus == "Pending") {
          allActionNotTaken = true;
        }

        row.getCell(13).value = equipmentoutages[i].rpcRemarks;
        row.commit();
      }

      if (allActionNotTaken) {
        var row = worksheet.getRow(2);
        row.getCell(1).value =
          "List of outages of Communication Links, proposed during the month of";
        row.commit();
      }

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});

router.get("/downloadcod4/:year/:month", auth, async (req, res) => {
  var cod4outages;

  const cod4_startDate = new Date(req.params.year, req.params.month - 12, 1);
  const cod4_endDate = new Date(req.params.year, req.params.month - 1, 1);

  var cod4For =
    cod4_startDate.toLocaleDateString("default", { month: "long" }) +
    " " +
    cod4_startDate.getFullYear().toString() +
    " to " +
    (cod4_endDate.toLocaleDateString("default", { month: "long" }).toString() +
      " " +
      cod4_endDate.getFullYear().toString());

  var equipments = await Equipment.find({
    requestApprovalStatusTaken: { $exists: false },
    hide: { $exists: false },
  });

  var workbook = new Excel.Workbook();

  workbook.xlsx
    .readFile("samplecod4.xlsx")
    .then(async function () {
      var worksheet = workbook.getWorksheet(1);

      var borderStyles = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      for (var equipmenti = 0; equipmenti < equipments.length; equipmenti++) {
        var row = worksheet.getRow(equipmenti * 4 + 10);
        row.getCell(1).value = equipmenti + 1;
        row.getCell(2).value = equipments[equipmenti].user;
        row.getCell(3).value = equipments[equipmenti].description;
        row.getCell(4).value = equipments[equipmenti].location;
        row.getCell(5).value = equipments[equipmenti].ownership.toString();
        row.commit();
      }

      var row = worksheet.getRow(3);
      row.getCell(1).value = cod4For;
      row.commit();

      // for every month

      for (var monthi = 12; monthi > 0; monthi--) {
        var monthStartDate = new Date(
          req.params.year,
          req.params.month - monthi,
          1
        );
        var monthEndDate = new Date(
          req.params.year,
          req.params.month - monthi + 1,
          1
        );
        var MonthName =
          monthStartDate.toLocaleDateString("default", { month: "long" }) +
          " " +
          monthStartDate.getFullYear();

        var row = worksheet.getRow(7);
        row.getCell(7 + (12 - monthi)).value = MonthName;
        row.commit();

        var equipmentOutage = await EquipmentOutage.aggregate([
          {
            $match: {
              $or: [
                {
                  $and: [
                    {
                      approvedStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { Approvalstatus: "Approved" },
                  ],
                },
                {
                  $and: [
                    {
                      proposedStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { outageType: "Emergency" },
                  ],
                },
                {
                  $and: [
                    {
                      outageStartDate: {
                        $gte: monthStartDate,
                        $lt: monthEndDate,
                      },
                    },
                    { outageType: "Forced" },
                  ],
                },
              ],
            },
          },
          {
            $group: {
              _id: { equipment: "$equipment", outageType: "$outageType" },
              totalMilliSec: {
                $sum: {
                  $subtract: ["$outageEndDate", "$outageStartDate"],
                },
              },
            },
          },
        ]);
        console.log(equipmentOutage);
        for (var equipmenti = 0; equipmenti < equipments.length; equipmenti++) {
          var totalHours =0;
          if (
            equipments[equipmenti].description ==
            "VRLA 48V 100 AH Battery ,Make : HBL"
          ) {
            console.log("ok");
          }

          var x = equipmentOutage.filter(
            (eo) =>
              eo._id.equipment == equipments[equipmenti]._id.toString() &&
              eo._id.outageType == "Planned"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(equipmenti * 4 + 10);

            totalHours +=x[0].totalMilliSec;
              hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
              if(hourminutes.includes(':'))
              {
                row.getCell(7 + (12 - monthi)).value = hourminutes
              }           
              else
              {
                row.getCell(7 + (12 - monthi)).value ='00:'+ hourminutes
              }           
            row.commit();
          }

          var x = equipmentOutage.filter(
            (eo) =>
              eo._id.equipment == equipments[equipmenti]._id.toString() &&
              eo._id.outageType == "Forced"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(equipmenti * 4 + 11);
            totalHours +=x[0].totalMilliSec;
              hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
                if(hourminutes.includes(':'))
                {
                  row.getCell(7 + (12 - monthi)).value = hourminutes
                }           
                else
                {
                  row.getCell(7 + (12 - monthi)).value ='00:'+ hourminutes
                }           
              row.commit();
          }

          var x = equipmentOutage.filter(
            (eo) =>
              eo._id.equipment == equipments[equipmenti]._id.toString() &&
              eo._id.outageType == "Emergency"
          );
          if (x.length > 0) {
            var row = worksheet.getRow(equipmenti * 4 + 12);
            totalHours +=x[0].totalMilliSec;
              hourminutes = moment.duration(x[0].totalMilliSec).format("hh:mm")
                if(hourminutes.includes(':'))
                {
                  row.getCell(7 + (12 - monthi)).value = hourminutes
                }           
                else
                {
                  row.getCell(7 + (12 - monthi)).value ='00:'+ hourminutes
                }           
              row.commit();
          }

          var row = worksheet.getRow(equipmenti * 4 + 13);
            //total hours of that month of that type
            totalHours = moment.duration(totalHours).format("hh:mm");
            if(totalHours.includes(':'))
            {
              row.getCell(7 + (12 - monthi)).value = totalHours;
            }
            else
            {
              row.getCell(7 + (12 - monthi)).value ='00:'+ totalHours;
            }
           
            row.commit();


          //total all months
          if(monthi==1){
            //Planned
            var row = worksheet.getRow(equipmenti * 4 + 10);
            const euipmentOutageP = await commonEquipmentOutage.getRollingOutageMillisecDBByType(
              equipments[equipmenti]._id ,
              req.params.year,
              req.params.month,
              "Planned"
            );
            if (euipmentOutageP.length > 0) {
                  hourminutes = moment.duration(euipmentOutageP[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(7 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(7 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //Forced
            var row = worksheet.getRow(equipmenti * 4 + 11);
            const euipmentOutageF = await commonEquipmentOutage.getRollingOutageMillisecDBByType(
              equipments[equipmenti]._id ,
              req.params.year,
              req.params.month,
              "Forced"
            );
            if (euipmentOutageF.length > 0) {
                  hourminutes = moment.duration(euipmentOutageF[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(7 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(7 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //Emergency
            var row = worksheet.getRow(equipmenti * 4 + 12);
            const euipmentOutageE = await commonEquipmentOutage.getRollingOutageMillisecDBByType(
              equipments[equipmenti]._id ,
              req.params.year,
              req.params.month,
              "Emergency"
            );
            if (euipmentOutageE.length > 0) {
                  hourminutes = moment.duration(euipmentOutageE[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(7 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(7 + (12)).value ='00:'+ hourminutes;
                  }
            }
            //All
            var row = worksheet.getRow(equipmenti * 4 + 13);
            const euipmentOutageALL = await commonEquipmentOutage.getRollingOutageMillisecDB(
              equipments[equipmenti]._id ,
              req.params.year,
              req.params.month,
            );
            if (euipmentOutageALL.length > 0) {
                  hourminutes = moment.duration(euipmentOutageALL[0].totalMilliSec).format("hh:mm");
                  if(hourminutes.includes(':'))
                  {
                    row.getCell(7 + (12)).value=hourminutes;
                  }
                  else
                  {
                    row.getCell(7 + (12)).value ='00:'+ hourminutes;
                  }

              var euipmentOutageALLhours = Math.ceil(
                euipmentOutageALL[0].totalMilliSec / (1000 * 60 * 60)
              );
              var row = worksheet.getRow(equipmenti * 4 + 10);
              if (euipmentOutageALLhours <= 48){
                row.getCell(7 + (13)).value="N";
              }
              else{
                row.getCell(7 + (13)).value="Y";
              }
            }
            
          }


        }
      }
      //end

      worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
          cell.border = borderStyles;
        });
      });
    })
    .then(function () {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "Report.xlsx"
      );
      workbook.xlsx.write(res).then(function () {
        res.end();
      });
    })
    .then(function () {
      console.log("Done");
    });
});

getLinksAffectedText = (outageRequest) => {
  var LinkOutageText = "";
  if (outageRequest.linksAffected) {
    for (var i = 0; i < outageRequest.linksAffected.length; i++) {
      LinkOutageText +=
        "Description: " +
        outageRequest.linksAffected[i].description +
        " Source:" +
        outageRequest.linksAffected[i].source +
        " Destination:" +
        outageRequest.linksAffected[i].destination +
        "     ";
    }
  }

  return LinkOutageText;
};

module.exports = router;
