const validateObjectId = require("../middleware/validateObjectId");
const { Link, validate } = require("../models/link");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const express = require("express");
const admin = require("../middleware/admin");
const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;
const adminSupervisor = require("../middleware/adminSupervisor");

var MailConfig = require("../startup/mail");
var gmailTransport = MailConfig.GmailTransport;
const common = require("./common");


router.get("/", auth, async (req, res) => {
  if (req.user.isAdmin || req.user.isSupervisor) {
    links = await Link.find({ requestApprovalStatusTaken: { $exists: false }, hide: { $exists: false }, });
  } else {
    links = await Link.find({
      requestApprovalStatusTaken: { $exists: false },
      hide: { $exists: false },
      ownership: {'$in':[req.user.userName]},
    });
  }
  res.send(links);
});


router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const link = await Link.findById(req.params.id);

  if (!link)
    return res.status(404).send("The link with the given ID was not found.");

  res.send(link);
});

router.post("/", [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const link = new Link({
    user: req.user.userName,
    description: req.body.description,
    source: req.body.source,
    destination: req.body.destination,
    channelRouting: req.body.channelRouting,
    ownership: req.body.ownership,
    linkTypem: req.body.linkTypem,
    channelTypem: req.body.channelTypem,
    // linkType: req.body.linkType,
    pathType: req.body.pathType
  });
  if (!(req.user.isAdmin || req.user.isSupervisor)) {
    link.requestApprovalStatusTaken = false;
  }

  await link.save();

  var mailSubject =`New Link Application by ${req.user.userName}`;
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
                      </table>`;
      const senderMailID = await common.getSenderMailId();
      const mailList = await common.getSupervisorAdminMailIds();
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
              "New Link Successfully but Mail not sent. Please intimate the same equopemtn application through Mail"
            );
        }
      });
  // console.log(link);
  res.send(link);
});

router.put("/:id", [auth, adminSupervisor], async (req, res) => {
  // console.log(req);
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  // console.log(req.body);
  const link = await Link.findByIdAndUpdate(
    req.params.id,
    {
      description: req.body.description,
      source: req.body.source,
      destination: req.body.destination,
      channelRouting: req.body.channelRouting,
      ownership: req.body.ownership,
      linkTypem: req.body.linkTypem,
      channelTypem: req.body.channelTypem,
      // linkType: req.body.linkType,
      pathType: req.body.pathType
    },
    { new: true }
  );
  // console.log(link);
  if (!link)
    return res.status(404).send("The link with the given ID was not found.");

  res.send(link);
});

router.get("/linkRequests/new", auth, async (req, res) => {
  if (req.user.isAdmin || req.user.isSupervisor) {
    links = await Link.find({ requestApprovalStatusTaken: false, rejectedtoAdd: {$exists:false} });
  } else {
    links = await Link.find({
      requestApprovalStatusTaken: false,
      user: req.user.userName,
      rejectedtoAdd: {$exists:false}
    });
  }

  res.send(links);
});

router.put(
  "/linkRequestApproval/:id/:action",
  [auth, adminSupervisor],
  async (req, res) => {
    if(req.params.action=="reject"){
      const link = await Link.updateOne(
        { _id: ObjectId(req.params.id) },
        {  $set: { rejectedtoAdd: true } }
      );
      res.send(link);
    }
    else{
      const link = await Link.updateOne(
        { _id: ObjectId(req.params.id) },
        { $unset: { requestApprovalStatusTaken: 1 } }
      );
      res.send(link);
    }
    
   
  }
);

router.put(
  "/hide/:id",
  [auth, adminSupervisor],
  async (req, res) => {
   
      const link = await Link.updateOne(
        { _id: ObjectId(req.params.id) },
        {  $set: { hide: true, hideDate: new Date() } }
      );
      res.send(link);
  }
);


router.get("/linksByMonth/:year/:month", [auth], async (req, res) => {
  var linkoutages;
  //gets 10 so 11th month start date
  var startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  links = await Link.find({
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  });
  res.send(links);
});

module.exports = router;
