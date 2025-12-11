const { ApplicationStatus } = require("../models/applicationStatus");
const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const { User } = require("../models/user");

const getApplicationStatus = async function (typeApplication, year, month) {
  const applicationStatus = await ApplicationStatus.findOne({
    typeApplication: typeApplication,
    year: year,
    month: month,
  });

  return applicationStatus;
};

const getAllMailIds = async function () {
  const users = await User.find({});
  var mailList = "";
  for (var i = 0; i < users.length; i++) {
    // console.log(users[i]['nominations'])
    for (var j = 0; j < users[i]["nominations"].length; j++) {
      if (users[i]["nominations"][j]["Mail_Id"]) {
        mailList += users[i]["nominations"][j]["Mail_Id"] + ";";
      }
    }
  }
  return mailList;
};

const getSupervisorAdminMailIds = async function () {
  const users = await User.find({}).or([
    { isAdmin: true },
    { isSupervisor: true },
  ]);
  var mailList = "";
  for (var i = 0; i < users.length; i++) {
    // console.log(users[i]['nominations'])
    for (var j = 0; j < users[i]["nominations"].length; j++) {
      if (users[i]["nominations"][j]["Mail_Id"]) {
        mailList += users[i]["nominations"][j]["Mail_Id"] + ";";
      }
    }
  }
  // mailList+='mdileepkumar@grid-india.in;'
  return mailList;
};

const getSenderMailId = async function () {
  return "srldcscada@posoco.in";
};

const checkLinkOutageTimeClash = async function (linkOutage) {
  console.log(linkOutage)
  return "";
};



module.exports = {
  getApplicationStatus,
  getAllMailIds,
  getSupervisorAdminMailIds,
  getSenderMailId,
  checkLinkOutageTimeClash,
};
