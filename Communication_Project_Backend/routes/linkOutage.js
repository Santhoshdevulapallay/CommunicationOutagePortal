const validateObjectId = require("../middleware/validateObjectId");
const { Link } = require("../models/link");
const { LinkOutage, validate } = require("../models/llinkOutage");
const { Meeting } = require("../models/meeting");
const { AppCounter } = require("../models/appCounters");

const commonLinkOutage = require("./commonLinkOutage");

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


const ObjectId = mongoose.Types.ObjectId;

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
  const link = await Link.findById(req.body.link);
  if (!link) return res.status(400).send("Invalid Link.");
  if (req.body.Daily_Continous_Type == "Daily") {
    temp_StartDate = new Date(req.body.proposedStartDate);
    proposedEndDate = new Date(req.body.proposedEndDate);
    while (temp_StartDate < proposedEndDate) {
      temp_EndDate = new Date(
        new Date(req.body.proposedEndDate).setDate(temp_StartDate.getDate())
      );

      const linkOutage = new LinkOutage({
        requestingAgency: req.user._id,
        link: req.body.link,
        proposedStartDate: temp_StartDate,
        proposedEndDate:
          temp_EndDate.toISOString() == temp_StartDate.toISOString()
            ? new Date(temp_EndDate.setDate(temp_EndDate.getDate() + 1))
            : temp_EndDate,
        reasonPrecautions: req.body.reasonPrecautions,
        alternateChannelStatus: req.body.alternateChannelStatus,
        outageType: req.body.outageType,
      });
      if (linkOutage.outageType == "Planned") {
        linkOutage.COMSRNumber = req.body.COMSRNumber;
      }
      
      await linkOutage.save();
      temp_StartDate.setDate(temp_StartDate.getDate() + 1);
    }
  } else {
    if (req.body.outageType != "Planned") delete req.body.COMSRNumber;
    delete req.body.Daily_Continous_Type;
    req.body.requestingAgency = req.user._id;
    const linkOutage = new LinkOutage(req.body);
    
    // Forced outage entry timing clash checking
    if(req.body.outageType=="Forced"){
      if(await outageClashChecker.checkLinkOutageTimeClash(linkOutage)=="Found"){
         return res.status(404).send("Outage Time clashing");
      }
    }   


    await linkOutage.save();

    const senderMailID = await common.getSenderMailId();
    const mailList = await common.getSupervisorAdminMailIds();
   
    var mailSubject =`${req.body.outageType} Link Outage Application by ${req.user.userName}`;
    var mailBody = `<table style="border: 1px solid black;">
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Requesting Agency</b></td>
                          <td style="border: 1px solid black;"><b>${req.user.userName}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Description</b></td>
                          <td style="border: 1px solid black;"><b>${link.description}</b></td>
                          </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>source</b></td>
                          <td style="border: 1px solid black;"><b>${link.source}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Destination</b></td>
                          <td style="border: 1px solid black;"><b>${link.destination}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Outage Type</b></td>
                          <td style="border: 1px solid black;"><b>${req.body.outageType}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Reason & Precautions</b></td>
                          <td style="border: 1px solid black;"><b>${req.body.reasonPrecautions}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                        <td style="border: 1px solid black;"><b>Alternate Channel Status</b></td>
                        <td style="border: 1px solid black;"><b>${req.body.alternateChannelStatus}</b></td>
                      </tr>`;
    if (req.body.outageType == "Forced")
    {
      mailSubject =`${req.body.outageType} Link Outage Punching by ${req.user.userName} for the Month of ${(new Date(req.body.outageStartDate)).toLocaleString('default', { month: 'long' })} ${(new Date(req.body.outageStartDate)).getFullYear()}`
      mailBody+=` <tr style="border: 1px solid black;">
                    <td style="border: 1px solid black;"><b>Outage Start Date</b></td>
                    <td style="border: 1px solid black;"><b>${req.body.outageStartDate}</b></td>
                  </tr>
                  <tr style="border: 1px solid black;">
                    <td style="border: 1px solid black;"><b>Outage End Date</b></td>
                    <td style="border: 1px solid black;"><b>${req.body.outageEndDate}</b></td>
                  </tr>
                  </table>`
    }
    else
    {
      mailBody+= `<tr style="border: 1px solid black;">
                    <td style="border: 1px solid black;"><b>Proposed Start Date</b></td>
                    <td style="border: 1px solid black;"><b>${req.body.proposedStartDate}</b></td>
                  </tr>
                  <tr style="border: 1px solid black;">
                    <td style="border: 1px solid black;"><b>Proposed End Date</b></td>
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

router.get("/coa1/:year/:month", [auth], async (req, res) => {
  var linkoutages;
  //gets 10 so 11th month start date
  var coa1_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa1_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  linkoutages = await LinkOutage.find({
    proposedStartDate: {
      $gte: coa1_startDate,
      $lt: coa1_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  })
    .populate("link")
    .populate("requestingAgency");

  if (req.user.isOperator) {
    linkoutages = linkoutages.filter((lo) => lo.Approvalstatus == "Approved");
  } else if (!(req.user.isAdmin || req.user.isSupervisor)) {
    linkoutages = linkoutages.filter((lo) => lo.link.user == req.user.userName);
  }
  console.log(linkoutages);
  res.send(linkoutages);
});

router.put("/delete/:id", [auth], async (req, res) => {
  const linkOutage = await LinkOutage.findById(req.params.id);
  if (linkOutage.Approvalstatus != "Pending") {
    return res
      .status(400)
      .send(
        "The Outage Request Action already taken by RPC. Cannot be Deleted. Please refresh the page to know the status"
      );
  }
  if (!linkOutage)
    return res
      .status(404)
      .send("The Link Outage with the given ID was not found.");

  var meeting = await Meeting.findOne({ COMSRNumber: linkOutage.COMSRNumber });
  var date = new Date();
  if (date > new Date(meeting.reqClosingDate)) {
    return res
      .status(400)
      .send("Request Closing Date is " + meeting.reqClosingDate.toDateString());
  }
  linkOutage.deleteStatus = 1;
  linkOutage.save();
  res.send(linkOutage);
});

router.put("/editOutage/:id", [auth], async (req, res) => {
  const linkOutage = await LinkOutage.findById(req.params.id);
  if (linkOutage.Approvalstatus != "Pending") {
    return res
      .status(400)
      .send(
        "The Outage Request Action already taken by RPC. Cannot be edited. Please refresh the page to know the status"
      );
  }
  if (!linkOutage)
    return res
      .status(404)
      .send("The Link Outage with the given ID was not found.");

  if (req.user.isSupervisor) {
    linkOutage.supervisorRemarks = req.body.supervisorRemarks;
  } else {
    linkOutage.reasonPrecautions = req.body.reasonPrecautions;
    linkOutage.alternateChannelStatus = req.body.alternateChannelStatus;
    linkOutage.proposedStartDate = req.body.proposedStartDate;
    linkOutage.proposedEndDate = req.body.proposedEndDate;
    var meeting = await Meeting.findOne({
      COMSRNumber: linkOutage.COMSRNumber,
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

  linkOutage.requestSubmittedDate = new Date();
  linkOutage.save();

  res.send(linkOutage);
});

router.put("/approveAll/:year/:month", [auth, admin], async (req, res) => {
  var coa1_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var coa1_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );

  linkoutages = await LinkOutage.find({
    proposedStartDate: {
      $gte: coa1_startDate,
      $lt: coa1_endDate,
    },
    deleteStatus: 0,
    outageType: "Planned",
  }).populate("link");

  for (var i = 0; i < linkoutages.length; i++) {
    if (linkoutages[i].approvedStartDate) {
      var approvedStartDate = new Date(linkoutages[i].approvedStartDate);
      approvedStartDate.setDate(approvedStartDate.getDate() - 1);

      var date = new Date();
      if (date > approvedStartDate) {
        return res
          .status(400)
          .send(
            "Cannot Approve some of the outage. Stopped at failing D-1 Criteria"
          );
      }
    }
    linkoutages[i].approvedStartDate = linkoutages[i].proposedStartDate;
    linkoutages[i].approvedEndDate = linkoutages[i].proposedEndDate;
    linkoutages[i].Approvalstatus = "Approved";
    linkoutages[i].requestApprovedDate = new Date();
    linkoutages[i].save();
  }

  // approvedBy: "ADMIN",

  res.status(200).send({ Success: 1 });
});

router.put("/outageApproval/:id", [auth, admin], async (req, res) => {
  const linkOutage = await LinkOutage.findById(req.params.id);
  if (!linkOutage)
    return res
      .status(404)
      .send("The link Outage Request with the given ID was not found.");

  if (linkOutage.approvedStartDate) {
    var approvedStartDate = new Date(linkOutage.approvedStartDate);
    approvedStartDate.setDate(approvedStartDate.getDate() - 1);
    var date = new Date();
    if (date > approvedStartDate) {
      return res.status(400).send("Cannot be changed as D-1 criteria");
    }
  }

  if (req.body.Approvalstatus == "Approved") {
    linkOutage.approvedStartDate = req.body.approvedStartDate;
    linkOutage.approvedEndDate = req.body.approvedEndDate;
  } else {
    linkOutage.approvedStartDate = "";
    linkOutage.approvedEndDate = "";
  }
  linkOutage.rpcRemarks = req.body.rpcRemarks;
  linkOutage.Approvalstatus = req.body.Approvalstatus;
  linkOutage.approvedBy = req.user._id;
  linkOutage.requestApprovedDate = new Date();
  linkOutage.save();
  res.send(linkOutage);
});

router.get("/getRollingOutageMillisec/:id/:year/:month", auth, async (req, res) => {
  const linkOutage = await commonLinkOutage.getRollingOutageMillisecDB(
    req.params.id,
    req.params.year,
    req.params.month
  );
  if (!linkOutage)
    return res
      .status(404)
      .send("The link Outage with the given ID was not found.");
  res.send(linkOutage);
});

router.get("/cod1/:year/:month", [auth], async (req, res) => {
  var availedOutages;

  var cod1_startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  var cod1_endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
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
    ])
    .populate("link")
    .populate("requestingAgency");
  if (!(req.user.isAdmin || req.user.isSupervisor)) {
    availedOutages = availedOutages.filter(
      (lo) => lo.link.user == req.user.userName
    );
  }

  res.send(availedOutages);
});

router.put("/saveCOD1Outage/:id", [auth], async (req, res) => {
  const cod1Outage = await LinkOutage.findById(req.params.id);
  //can write code for freezing status check for updating
  if (!cod1Outage)
    return res
      .status(404)
      .send("The COD1 Outage with the given ID was not found.");
  
  var applicationStatus = true;

  if ((req.user.isAdmin || req.user.isSupervisor)) {
    applicationStatus = false;
  }
  else{
    applicationStatus = await common.getApplicationStatus(
      "COD1",
      req.body.year,
      req.body.month
    );
  }
  
  if (applicationStatus) {
    return res.status(404).send("Cannot be edited as COD1 is freezed");
  }

  cod1Outage.outageStartDate = req.body.outageStartDate;
  cod1Outage.outageEndDate = req.body.outageEndDate;
  cod1Outage.cod1SubmittedDate = new Date();
  cod1Outage.availedStatus = 1;
  if(await outageClashChecker.checkLinkOutageTimeClash(cod1Outage)=="Not Found")
  {
    cod1Outage.save();
    res.send(cod1Outage);
  }
  else
  {
    return res.status(404).send("Outage Time clashing");
  }
  
});

router.put("/makeNotAvailed/:id", [auth], async (req, res) => {
  const cod1Outage = await LinkOutage.findById(req.params.id);
  //can write code for freezing status check for updating
  if (!cod1Outage)
    return res
      .status(404)
      .send("The COD1 Outage with the given ID was not found.");
  const applicationStatus = await common.getApplicationStatus(
    "COD1",
    req.body.year,
    req.body.month
  );
  if (applicationStatus) {
    return res.status(404).send("Cannot make Not Availed as COD1 is freezed");
  }
  cod1Outage.outageStartDate = "";
  cod1Outage.outageEndDate = "";
  cod1Outage.availedStatus = 2;
  cod1Outage.save();
  res.send(cod1Outage);
});

router.put("/d3sendMail/:id", [auth], async (req, res) => {
  const cod1Outage = await LinkOutage.findById(req.params.id).populate("link");
  //can write code for freezing status check for updating
  if (!cod1Outage)
    return res
      .status(404)
      .send("The COD1 Outage with the given ID was not found.");
  var approvedStartDate = new Date(cod1Outage.approvedStartDate);
  approvedStartDate.setDate(approvedStartDate.getDate() - 3);
  var date = new Date();
  if (date > approvedStartDate) {
    return res.status(400).send("Cannot Send Mail as D-3 exceded");
  }
  cod1Outage.d3mailStatus = true;
  const senderMailID = await common.getSenderMailId();
  const mailList = await common.getSupervisorAdminMailIds();

  var mailBody = `<table style="border: 1px solid black;">
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Requesting Agency</b></td>
                          <td style="border: 1px solid black;"><b>${req.user.userName}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Description</b></td>
                          <td style="border: 1px solid black;"><b>${cod1Outage.link.description}</b></td>
                          </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>source</b></td>
                          <td style="border: 1px solid black;"><b>${cod1Outage.link.source}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Destination</b></td>
                          <td style="border: 1px solid black;"><b>${cod1Outage.link.destination}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Outage Type</b></td>
                          <td style="border: 1px solid black;"><b>${cod1Outage.outageType}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                          <td style="border: 1px solid black;"><b>Reason & Precautions</b></td>
                          <td style="border: 1px solid black;"><b>${cod1Outage.reasonPrecautions}</b></td>
                        </tr>
                        <tr style="border: 1px solid black;">
                        <td style="border: 1px solid black;"><b>Alternate Channel Status</b></td>
                        <td style="border: 1px solid black;"><b>${cod1Outage.alternateChannelStatus}</b></td>
                      </tr>
                      <tr style="border: 1px solid black;">
                        <td style="border: 1px solid black;"><b>Outage Start Date</b></td>
                        <td style="border: 1px solid black;"><b>${cod1Outage.approvedStartDate}</b></td>
                      </tr>
                      <tr style="border: 1px solid black;">
                        <td style="border: 1px solid black;"><b>Outage End Date</b></td>
                        <td style="border: 1px solid black;"><b>${req.body.approvedStartDate}</b></td>
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
  cod1Outage.save();

  res.send(cod1Outage);
});

router.put("/generateCode/:id", [auth], async (req, res) => {
  const linkOutage = await LinkOutage.findById(req.params.id);
  if (!linkOutage)
    return res
      .status(404)
      .send("The link Outage Request with the given ID was not found.");
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
    linkOutage.openingCode = codeCounter.counter;
  } else {
    linkOutage.closingCode = codeCounter.counter;
  }
  codeCounter.counter = codeCounter.counter + 1;
  codeCounter.save();
  linkOutage.save();

  res.send(linkOutage);
});

// router.get("/:id", [auth, validateObjectId], async (req, res) => {
//   const linkOutage = await LinkOutage.findById(req.params.id).populate("link");

//   if (!linkOutage)
//     return res
//       .status(404)
//       .send("The link Outage with the given ID was not found.");

//   res.send(linkOutage);
// });

// router.put("/approveCOD1Outage/:id", [auth, admin], async (req, res) => {
//   const cod1Outage = await LinkOutage.findById(req.params.id);
//   if (!cod1Outage)
//     return res
//       .status(404)
//       .send("The COD1 Outage with the given ID was not found.");
//   cod1Outage.cod1ApprovedStartDate = req.body.cod1ApprovedStartDate;
//   cod1Outage.cod1ApprovedEndDate = req.body.cod1ApprovedEndDate;
//   cod1Outage.cod1Approvalstatus = "Approved";
//   cod1Outage.cod1ApproveDate = new Date();
//   cod1Outage.save();

//   res.send(cod1Outage);
// });

module.exports = router;
