const validateObjectId = require("../middleware/validateObjectId");
const { Meeting, validate } = require("../models/meeting");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
var MailConfig = require("../startup/mail");
var gmailTransport = MailConfig.GmailTransport;
const common = require("./common");

router.get("/", auth, async (req, res) => {
  var meetings;
  meetings = await Meeting.find();
  res.send(meetings);
});

router.get("/latestMeetingNo", auth, async (req, res) => {
  Meeting.find({})
    .sort({ _id: -1 })
    .limit(1)
    .then((meetings) => {
      res.send({ COMSRNumber: meetings[0].COMSRNumber });
    });
});

router.post("/", [auth, admin], async (req, res) => {
  const mailList = await common.getAllMailIds();
  const senderMailID = await common.getSenderMailId();
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  var month = new Date(req.body.COMSRDate).getMonth();
  var year = new Date(req.body.COMSRDate).getFullYear();

  const prevMeeting = await Meeting.find({
    COMSRDate: {
      $gte: new Date(year, parseInt(month), 1),
      $lt: new Date(year, parseInt(month) + 1, 1),
    },
  });

  if (prevMeeting.length) {
    return res.status(400).send("Already Meeting is created for the month");
  }

  const meeting = new Meeting(req.body);
  await meeting.save();

  const mailData = {
    from: senderMailID, // sender address
    to: mailList, // list of receivers
    subject: `COMSR-${meeting.COMSRNumber} Created`,
    // text: 'That was easy!',
    html: `Dear All<br/><br/>
                <b>COMSR Meeting Date: ${meeting.COMSRDate} </b><br><br>
                Request Opening Date: ${meeting.reqOpeningDate}<br/>
                Request Closing Date: ${meeting.reqClosingDate}<br/>
                Shutdown Min Date: ${meeting.shutdownMinDate}<br/>
                Shutdown Max Date: ${meeting.shutdownMaxDate}<br/><br/>
                Thanks<br/>
                SRPC`,
  };
  gmailTransport.sendMail(mailData);

  res.send(meeting);
});

router.put("/:id", [auth], async (req, res) => {
  const senderMailID = await common.getSenderMailId();
  const testmailList = "mdileepkumar666@gmail.com;mdileepkumar66@gmail.com";
  const mailList = await common.getAllMailIds();
  console.log(mailList);

  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  console.log(req.body);

  const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!meeting)
    return res.status(404).send("The meeting with the given ID was not found.");

  const mailData = {
    from: senderMailID, // sender address
    to: mailList, // list of receivers
    subject: `COMSR-${meeting.COMSRNumber} Modified`,
    // text: 'That was easy!',
    html: `Dear All<br/><br/>
                <b>COMSR Meeting Date: ${meeting.COMSRDate} </b><br><br>
                Request Opening Date: ${meeting.reqOpeningDate}<br/>
                Request Closing Date: ${meeting.reqClosingDate}<br/>
                Shutdown Min Date: ${meeting.shutdownMinDate}<br/>
                Shutdown Max Date: ${meeting.shutdownMaxDate}<br/><br/>
                Thanks<br/>
                SRPC`,
  };
  gmailTransport.sendMail(mailData, function (err, info) {
    if (err) {
      console.log(err);
      return res
        .status(404)
        .send("Meeting saved successfully but mail was not sent");
    }

    res.send(meeting);
  });

  // res.send(meeting);
});

module.exports = router;
