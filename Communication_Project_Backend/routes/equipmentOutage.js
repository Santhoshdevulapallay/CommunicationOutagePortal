const validateObjectId = require("../middleware/validateObjectId");
const { Equipment } = require("../models/equipment");
const { EquipmentOutage, validate } = require("../models/equipmentOutage");
const { Meeting } = require("../models/meeting");
const { AppCounter } = require("../models/appCounters");

const commonEquipmentOutage = require("./commonEquipmentOutage");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const mongoose = require("mongoose");
const express = require("express");
const { compact } = require("lodash");

const router = express.Router();
var MailConfig = require("../startup/mail");
var gmailTransport = MailConfig.GmailTransport;
const common = require("./common");
const outageClashChecker = require("./Functions/OutageClashChecker");


router.post("/", [auth], async (req, res) => {
  if (req.body.outageType == "Planned") {
    var meeting = await Meeting.findOne({ COMSRNumber: req.body.COMSRNumber });
    // Create the original date object
    let shutDownMaxDateNextDay = new Date(meeting.shutdownMaxDate);

    // Add one day
    shutDownMaxDateNextDay.setUTCDate(shutDownMaxDateNextDay.getUTCDate() + 1);
    var date = new Date();
    if (date < new Date(meeting.reqOpeningDate)) {
      return res
        .status(400)
        .send(
          "Request opening Date is " + meeting.reqOpeningDate.toDateString()
        );
    } else if (date > new Date(meeting.reqClosingDate)) {
      return res
        .status(400)
        .send(
          "Request Closing Date is " + meeting.reqClosingDate.toDateString()
        );
    } else if (
      new Date(req.body.proposedStartDate) < new Date(meeting.shutdownMinDate)
    ) {
      return res
        .status(400)
        .send("Shutdown Min Date is " + meeting.shutdownMinDate.toDateString());
    } else if (
      new Date(req.body.proposedEndDate) > shutDownMaxDateNextDay
    ) {
      return res
        .status(400)
        .send("Shutdown Max Date is " + meeting.shutdownMaxDate.toDateString());
    }
  }
  if(req.body.outageType == "Forced"){
      if(req.body.outageStartDate> new Date())
      {
          return res
            .status(400)
            .send("Forced Outage reporting cannot be in Future Date");
      }
  }
  const equipment = await Equipment.findById(req.body.equipment);
  if (!equipment) return res.status(400).send("Invalid Equipment.");
  if (req.body.Daily_Continous_Type == "Daily") {
    temp_StartDate = new Date(req.body.proposedStartDate);
    proposedEndDate = new Date(req.body.proposedEndDate);
    while (temp_StartDate < proposedEndDate) {
      temp_EndDate = new Date(
        new Date(req.body.proposedEndDate).setDate(temp_StartDate.getDate())
      );

      const equipmentOutage = new EquipmentOutage({
        requestingAgency: req.user._id,
        equipment: req.body.equipment,
        proposedStartDate: temp_StartDate,
        proposedEndDate:
          temp_EndDate.toISOString() == temp_StartDate.toISOString()
            ? new Date(temp_EndDate.setDate(temp_EndDate.getDate() + 1))
            : temp_EndDate,
        reasonPrecautions: req.body.reasonPrecautions,
        alternateChannelPathStatus: req.body.alternateChannelPathStatus,
        outageType: req.body.outageType,
      });
      if (equipmentOutage.outageType == "Planned") {
        equipmentOutage.COMSRNumber = req.body.COMSRNumber;
      }
      await equipmentOutage.save();
      temp_StartDate.setDate(temp_StartDate.getDate() + 1);
    }
  } else {
    if (req.body.outageType != "Planned") delete req.body.COMSRNumber;
    delete req.body.Daily_Continous_Type;
    req.body.requestingAgency = req.user._id;
    const equipmentOutage = new EquipmentOutage(req.body);

     // Forced outage entry timing clash checking
     if(req.body.outageType=="Forced"){
      if(await outageClashChecker.checkEquipmentOutageTimeClash(equipmentOutage)=="Found"){
         return res.status(404).send("Outage Time clashing");
      }
    }   


    await equipmentOutage.save();
    const senderMailID = await common.getSenderMailId();
    const mailList = await common.getSupervisorAdminMailIds();
    console.log(mailList);
    var mailSubject =`${req.body.outageType} Equipment Outage Application by ${req.user.userName}`;
    var mailBody = `<table style="border: 1px solid black;">
            <tr style="border: 1px solid black;">
              <td style="border: 1px solid black;"><b>Requesting Agency</b></td>
              <td style="border: 1px solid black;"><b>${req.user.userName}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
            <td style="border: 1px solid black;"><b>Description</b></td>
            <td style="border: 1px solid black;"><b>${equipment.description}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
              <td style="border: 1px solid black;"><b>Location</b></td>
              <td style="border: 1px solid black;"><b>${equipment.location}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
            <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Outage Type</b></td>
                          <td style="border: 1px solid black;"><b>${req.body.outageType}</b></td>
            </tr>
              <td style="border: 1px solid black;"><b>Reason & Precautions</b></td>
              <td style="border: 1px solid black;"><b>${req.body.reasonPrecautions}</b></td>
            </tr>`;

      if (req.body.outageType == "Forced")
      {
        mailSubject =`${req.body.outageType} Equipment Outage Punching by ${req.user.userName} for the Month of ${(new Date(req.body.outageStartDate)).toLocaleString('default', { month: 'long' })} ${(new Date(req.body.outageStartDate)).getFullYear()}`
        mailBody+=` <tr style="border: 1px solid black;">
                      <td style="border: 1px solid black;"><b>Proposed Start Date</b></td>
                      <td style="border: 1px solid black;"><b>${req.body.outageStartDate}</b></td>
                    </tr>
                    <tr style="border: 1px solid black;">
                      <td style="border: 1px solid black;"><b>Proposed End Date</b></td>
                      <td style="border: 1px solid black;"><b>${req.body.outageEndDate}</b></td>
                    </tr>
                    </table>`
      }
      else
      {
        mailBody+=` <tr style="border: 1px solid black;">
                      <td style="border: 1px solid black;"><b>Outage Start Date</b></td>
                      <td style="border: 1px solid black;"><b>${req.body.proposedStartDate}</b></td>
                    </tr>
                    <tr style="border: 1px solid black;">
                      <td style="border: 1px solid black;"><b>Outage End Date</b></td>
                      <td style="border: 1px solid black;"><b>${req.body.proposedEndDate}</b></td>
                    </tr>
                    </table>`
      }

    const mailData = {
      from: senderMailID, // sender address
      to: mailList, // list of receivers
      subject: mailSubject,
      // text: 'That was easy!',
      html: `Dear All<br/><br/>
                  ${mailBody}<br/>
                  Thanks<br/><br/>
                  SRPC`,
    };

    gmailTransport.sendMail(mailData, function (err, info) {
      if (err) {
        return res
          .status(404)
          .send(
            "Outage Applied Successfully but Mail not sent. Please intimate the same outage application through Mail"
          );
      }
    });
  }

  res.send([{ id: "success" }]);
});

router.get("/coa2/:year/:month", [auth], async (req, res) => {
  var equipmentoutages;
  //gets 10 so 11th month start date
  var coa2_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa2_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  equipmentoutages = await EquipmentOutage.find({
    proposedStartDate: {
      $gte: coa2_startDate,
      $lt: coa2_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  })
    .populate("equipment")
    .populate("linksAffected")
    .populate("requestingAgency");

  if (req.user.isOperator) {
    equipmentoutages = equipmentoutages.filter(
      (eo) => eo.Approvalstatus == "Approved"
    );
  } else if (!(req.user.isAdmin || req.user.isSupervisor)) {
    equipmentoutages = equipmentoutages.filter(
      (eo) => eo.equipment.user == req.user.userName
    );
  }
  res.send(equipmentoutages);
});

router.put("/delete/:id", [auth], async (req, res) => {
  const equipmentOutage = await EquipmentOutage.findById(req.params.id);
  if (equipmentOutage.Approvalstatus != "Pending") {
    return res
      .status(400)
      .send(
        "The Outage Request Action already taken by RPC. Cannot be Deleted. Please refresh the page to know the status"
      );
  }
  if (!equipmentOutage)
    return res
      .status(404)
      .send("The Equipment Outage with the given ID was not found.");
  var meeting = await Meeting.findOne({
    COMSRNumber: equipmentOutage.COMSRNumber,
  });
  var date = new Date();
  if (date > new Date(meeting.reqClosingDate)) {
    return res
      .status(400)
      .send("Request Closing Date is " + meeting.reqClosingDate.toDateString());
  }
  equipmentOutage.deleteStatus = 1;
  equipmentOutage.save();
  res.send(equipmentOutage);
});

router.put("/editOutage/:id", [auth], async (req, res) => {
  const equipmentOutage = await EquipmentOutage.findById(req.params.id);

  if (equipmentOutage.Approvalstatus != "Pending") {
    return res
      .status(400)
      .send(
        "The Outage Request Action already taken by RPC. Cannot be edited. Please refresh the page to know the status"
      );
  }
  if (!equipmentOutage)
    return res
      .status(404)
      .send("The Equipment Outage with the given ID was not found.");

  if (req.user.isSupervisor) {
    equipmentOutage.supervisorRemarks = req.body.supervisorRemarks;
  } else {
    equipmentOutage.reasonPrecautions = req.body.reasonPrecautions;
    equipmentOutage.proposedStartDate = req.body.proposedStartDate;
    equipmentOutage.proposedEndDate = req.body.proposedEndDate;
    var meeting = await Meeting.findOne({
      COMSRNumber: equipmentOutage.COMSRNumber,
    });
    var date = new Date();
    if (date > new Date(meeting.reqClosingDate)) {
      return res
        .status(400)
        .send(
          "Request Closing Date is " + meeting.reqClosingDate.toDateString()
        );
    }
  }

  equipmentOutage.requestSubmittedDate = new Date();
  equipmentOutage.save();

  res.send(equipmentOutage);
});

router.put("/approveAll/:year/:month", [auth, admin], async (req, res) => {
  var coa2_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa2_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );

  equipmentOutages = await EquipmentOutage.find({
    proposedStartDate: {
      $gte: coa2_startDate,
      $lt: coa2_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  }).populate("equipment");

  for (var i = 0; i < equipmentOutages.length; i++) {
    if (equipmentOutages[i].approvedStartDate) {
      var approvedStartDate = new Date(equipmentOutages[i].approvedStartDate);
      approvedStartDate.setDate(approvedStartDate.getDate() - 1);
      var date = new Date();
      if (date > approvedStartDate) {
        return res
          .status(400)
          .send("Cannot be approved as some of them failing D-1 criteria");
      }
    }

    equipmentOutages[i].approvedStartDate =
      equipmentOutages[i].proposedStartDate;
    equipmentOutages[i].approvedEndDate = equipmentOutages[i].proposedEndDate;
    equipmentOutages[i].Approvalstatus = "Approved";
    equipmentOutages[i].requestApprovedDate = new Date();
    equipmentOutages[i].save();
  }

  res.status(200).send({ Success: 1 });
});

router.put("/outageApproval/:id", [auth, admin], async (req, res) => {
  const equipmentOutage = await EquipmentOutage.findById(req.params.id);
  if (!equipmentOutage)
    return res
      .status(404)
      .send("The Equipment Outage Request with the given ID was not found.");

  if (equipmentOutage.approvedStartDate) {
    var approvedStartDate = new Date(equipmentOutage.approvedStartDate);
    approvedStartDate.setDate(approvedStartDate.getDate() - 1);
    var date = new Date();
    if (date > approvedStartDate) {
      return res.status(400).send("Cannot be changed as D-1 criteria");
    }
  }

  if (req.body.Approvalstatus == "Approved") {
    equipmentOutage.approvedStartDate = req.body.approvedStartDate;
    equipmentOutage.approvedEndDate = req.body.approvedEndDate;
  } else {
    equipmentOutage.approvedStartDate = "";
    equipmentOutage.approvedEndDate = "";
  }
  equipmentOutage.rpcRemarks = req.body.rpcRemarks;
  equipmentOutage.Approvalstatus = req.body.Approvalstatus;
  equipmentOutage.approvedBy = req.user._id;
  equipmentOutage.requestApprovedDate = new Date();
  equipmentOutage.save();
  res.send(equipmentOutage);
});

router.get("/getRollingOutageMillisec/:id/:year/:month", auth, async (req, res) => {
  const equipmentOutage = await commonEquipmentOutage.getRollingOutageMillisecDB(
    req.params.id,
    req.params.year,
    req.params.month
  );
  if (!equipmentOutage)
    return res
      .status(404)
      .send("The Equipment Outage with the given ID was not found.");
  res.send(equipmentOutage);
});

router.get("/cod2/:year/:month", [auth], async (req, res) => {
  var availedOutages;

  var cod2_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  var cod2_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  availedOutages = await EquipmentOutage.find({ deleteStatus: 0 })
    .or([
      {
        $and: [
          { Approvalstatus: "Approved" },
          {
            approvedStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
        ],
      },
      {
        $and: [
          { outageType: "Emergency" },
          {
            proposedStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
        ],
      },
      {
        $and: [
          { outageType: "Forced" },
          {
            outageStartDate: {
              $gte: cod2_startDate,
              $lt: cod2_endDate,
            },
          },
        ],
      },
    ])
    .populate("equipment")
    .populate("linksAffected")
    .populate("requestingAgency");

  if (!(req.user.isAdmin || req.user.isSupervisor)) {
    availedOutages = availedOutages.filter(
      (eo) => eo.equipment.user == req.user.userName
    );
  }
  res.send(availedOutages);
});

router.put("/saveCOD2Outage/:id", [auth], async (req, res) => {
  const cod2Outage = await EquipmentOutage.findById(req.params.id);
  //can write code for freezing status check for updating
  if (!cod2Outage)
    return res
      .status(404)
      .send("The COD2 Outage with the given ID was not found.");
  
  
  var applicationStatus = true;
  if ((req.user.isAdmin || req.user.isSupervisor)) {
    applicationStatus = false;
  }
  else{
    applicationStatus = await common.getApplicationStatus(
      "COD2",
      req.body.year,
      req.body.month
    );
  }
  
  if (applicationStatus) {
    return res.status(404).send("Cannot be edited as COD2 is freezed");
  }
  cod2Outage.outageStartDate = req.body.outageStartDate;
  cod2Outage.outageEndDate = req.body.outageEndDate;
  cod2Outage.cod1SubmittedDate = new Date();
  cod2Outage.availedStatus = 1;

  if(await outageClashChecker.checkEquipmentOutageTimeClash(cod2Outage)=="Not Found")
  {
    cod2Outage.save();
    res.send(cod2Outage);
  }
  else
  {
    return res.status(404).send("Outage Time clashing");
  }

  
});

router.put("/makeNotAvailed/:id", [auth], async (req, res) => {
  const cod2Outage = await EquipmentOutage.findById(req.params.id);
  //can write code for freezing status check for updating
  if (!cod2Outage)
    return res
      .status(404)
      .send("The COD2 Outage with the given ID was not found.");
  const applicationStatus = await common.getApplicationStatus(
    "COD2",
    req.body.year,
    req.body.month
  );
  if (applicationStatus) {
    return res.status(404).send("Cannot make Not Availed as COD2 is freezed");
  }
  cod2Outage.outageStartDate = "";
  cod2Outage.outageEndDate = "";
  cod2Outage.availedStatus = 2;
  cod2Outage.save();
  res.send(cod2Outage);
});

router.put("/d3sendMail/:id", [auth], async (req, res) => {
  const cod2Outage = await EquipmentOutage.findById(req.params.id).populate("equipment");
  if (!cod2Outage)
    return res
      .status(404)
      .send("The COD2 Outage with the given ID was not found.");
  var approvedStartDate = new Date(cod2Outage.approvedStartDate);
  approvedStartDate.setDate(approvedStartDate.getDate() - 3);
  var date = new Date();
  if (date > approvedStartDate) {
    return res.status(400).send("Cannot Send Mail as D-3 exceded");
  }
  cod2Outage.d3mailStatus = true;
  const senderMailID = await common.getSenderMailId();
  const mailList = await common.getSupervisorAdminMailIds();

  var mailBody = `<table style="border: 1px solid black;">
            <tr style="border: 1px solid black;">
              <td style="border: 1px solid black;"><b>Requesting Agency</b></td>
              <td style="border: 1px solid black;"><b>${req.user.userName}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
            <td style="border: 1px solid black;"><b>Description</b></td>
            <td style="border: 1px solid black;"><b>${cod2Outage.equipment.description}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
              <td style="border: 1px solid black;"><b>Location</b></td>
              <td style="border: 1px solid black;"><b>${cod2Outage.equipment.location}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
            <tr style="border: 1px solid black;">
                <td style="border: 1px solid black;"><b>Outage Type</b></td>
                <td style="border: 1px solid black;"><b>${cod2Outage.outageType}</b></td>
            </tr>
              <td style="border: 1px solid black;"><b>Reason&Precautuin</b></td>
              <td style="border: 1px solid black;"><b>${cod2Outage.reasonPrecautions}</b></td>
            </tr>
            <tr style="border: 1px solid black;">
                <td style="border: 1px solid black;"><b>Approved Start Date</b></td>
                <td style="border: 1px solid black;"><b>${cod2Outage.approvedStartDate}</b></td>
              </tr>
              <tr style="border: 1px solid black;">
                <td style="border: 1px solid black;"><b>Approved End Date</b></td>
                <td style="border: 1px solid black;"><b>${cod2Outage.approvedEndDate}</b></td>
              </tr>
              </table>`;

  const mailData = {
    from: senderMailID, // sender address
    to: mailList, // list of receivers
    subject: `D-3 Mail by ${req.user.userName}`,
    // text: 'That was easy!',
    html: `Dear All<br/><br/>
            ${mailBody}<br/>
            Thanks<br/><br/>
            SRPC`,
          };
  gmailTransport.sendMail(mailData, function (err, info) {
    if (err) {
      return res
        .status(404)
        .send(
          "Issue in sending Mail. Please intimate the same D-3 status through Mail"
        );
    }
  });
  cod2Outage.save();

  res.send(cod2Outage);
});

router.put("/generateCode/:id", [auth], async (req, res) => {
  const equipmentOutage = await EquipmentOutage.findById(req.params.id);
  if (!equipmentOutage)
    return res
      .status(404)
      .send("The Equipment Outage Request with the given ID was not found.");
  var codeCounter = await AppCounter.findOne({
    typeCounter: "CODEBOOK",
  });
  if (!codeCounter) {
    codeCounter = await new AppCounter({
      typeCounter: "CODEBOOK",
      counter: 1,
    }).save();
  }

  if (req.body.typeCode == "opening") {
    equipmentOutage.openingCode = codeCounter.counter;
  } else {
    equipmentOutage.closingCode = codeCounter.counter;
  }
  codeCounter.counter = codeCounter.counter + 1;
  codeCounter.save();
  equipmentOutage.save();

  res.send(equipmentOutage);
});

module.exports = router;
