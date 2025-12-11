const config = require("config");
const winston = require("winston");

module.exports = function () {
  winston.info(config.get("jwtPrivateKey"));
  // if (!config.get("jwtPrivateKey")) {
  //   // console.error("FATAL error: jwtPrivateKey is not set");
  //   // process.exit(1);
  //   throw new Error("FATAL ERROR: jwtPrivateKey is not defined.");
  // }
};
