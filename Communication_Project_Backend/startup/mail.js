// const winston = require("winston");
var nodemailer = require("nodemailer");
const { mailConfig } = require("../config/customconfig");


module.exports.GmailTransport = nodemailer.createTransport({
  port: 587, // true for 465, false for other ports
  secure: false,
  host: mailConfig.host,
  auth: {
    user: mailConfig.user,
    pass: mailConfig.pass,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1",
  },
  // secure: true,
});
