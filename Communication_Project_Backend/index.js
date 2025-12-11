const express = require("express");
const winston = require("winston");

const app = express();
require("./startup/logging")();
require("./startup/cors")(app);
require("./startup/routes")(app);
require("./startup/db")();
require('./startup/postgresDb')()
require("./startup/config")();

const port = process.env.PORT || 4002;
// const port = process.env.PORT;

app.listen(port, () => {
  winston.info(`Listening on port: ${port}...`);
});
