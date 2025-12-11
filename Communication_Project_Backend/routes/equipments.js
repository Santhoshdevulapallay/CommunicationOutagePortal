const validateObjectId = require("../middleware/validateObjectId");
const { Equipment, validate } = require("../models/equipment");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;
const adminSupervisor = require("../middleware/adminSupervisor");

var MailConfig = require("../startup/mail");
var gmailTransport = MailConfig.GmailTransport;
const common = require("./common");

router.get("/", auth, async (req, res) => {
  var equipments;
  if (req.user.isAdmin || req.user.isSupervisor) {
    equipments = await Equipment.find({
      requestApprovalStatusTaken: { $exists: false },
      hide: { $exists: false },
    });
  } else {
    equipments = await Equipment.find({
      requestApprovalStatusTaken: { $exists: false },
      hide: { $exists: false },
      user: req.user.userName,
    });
  }
  res.send(equipments);
});

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment)
    return res
      .status(404)
      .send("The Equipment with the given ID was not found.");
  res.send(equipment);
});

router.post("/", [auth], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const equipment = new Equipment({
    user: req.user.userName,
    description: req.body.description,
    location: req.body.location,
    ownership: req.body.ownership,
  });

  if (!(req.user.isAdmin || req.user.isSupervisor)) {
    equipment.requestApprovalStatusTaken = false;
  }

  

  await equipment.save();

  var mailSubject =`New Equipment request Application by ${req.user.userName}`;
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
          </table>
          `;
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
            "New Equipemnt Successfully but Mail not sent. Please intimate the same equopemtn application through Mail"
          );
      }
    });

  console.log(equipment);
  res.send(equipment);
});


// router.put("/:id", [auth, adminSupervisor], async (req, res) => {

router.put("/:id", [auth, adminSupervisor], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const equipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    {
      description: req.body.description,
      location: req.body.location,
      ownership: req.body.ownership,
    },
    { new: true }
  );
  console.log(equipment);
  if (!equipment)
    return res
      .status(404)
      .send("The Equipment with the given ID was not found.");

  res.send(equipment);
});

router.get("/equipmentRequests/new", auth, async (req, res) => {
  if (req.user.isAdmin || req.user.isSupervisor) {
    equipments = await Equipment.find({ requestApprovalStatusTaken: false, rejectedtoAdd: {$exists:false} });
  } else {
    equipments = await Equipment.find({
      requestApprovalStatusTaken: false,
      user: req.user.userName,
      rejectedtoAdd: {$exists:false}
    });
  }

  res.send(equipments);
});

router.put(
  "/equipmentRequestApproval/:id/:action",
  [auth, adminSupervisor],
  async (req, res) => {
    if(req.params.action=="reject"){
      const equipment = await Equipment.updateOne(
        { _id: ObjectId(req.params.id) },
        { $set: { rejectedtoAdd: true } }
      );
      res.send(equipment);
    }
    else{
      const equipment = await Equipment.updateOne(
        { _id: ObjectId(req.params.id) },
        { $unset: { requestApprovalStatusTaken: 1 } }
      );
      res.send(equipment);
    }
    
    
  }
);

router.put(
  "/hide/:id",
  [auth, adminSupervisor],
  async (req, res) => {

      const equipment = await Equipment.updateOne(
        { _id: ObjectId(req.params.id) },
        {  $set: { hide: true, hideDate: new Date() } }
      );
      res.send(equipment);
  }
);


router.get("/equipmentsByMonth/:year/:month", [auth], async (req, res) => {
  var equipments;
  //gets 10 so 11th month start date
  var startDate = new Date(req.params.year, parseInt(req.params.month), 1);
  //12th month start date
  var endDate = new Date(
    req.params.year,
    parseInt(req.params.month) + 1,
    1
  );
  equipments = await Equipment.find({
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  });
  res.send(equipments);
});

module.exports = router;
