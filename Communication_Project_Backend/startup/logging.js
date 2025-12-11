require("express-async-errors");
const winston = require("winston");
require("winston-mongodb");

module.exports = function () {
  winston.add(new winston.transports.File({ filename: "logfile.log" }));

  // winston.add(
  //   new winston.transports.MongoDB({
  //     db: "mongodb://localhost/movierendering",
  //     level: "info",
  //   })
  // );

  process.on("uncaughtException", (ex) => {
    console.log("we got uncaught exception");
    winston.error(ex.message, ex);
  });

  // winston.exceptions.handle(
  //   new winston.transports.Console({
  //     format: winston.format.combine(
  //       winston.format.colorize(),
  //       winston.format.simple()
  //     ),
  //   }),
  //   new winston.transports.File({ filename: "uncaughtExceptions.log" })
  // );

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });
};
