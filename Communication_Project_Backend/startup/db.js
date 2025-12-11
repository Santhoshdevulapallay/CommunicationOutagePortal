// const winston = require("winston");
const mongoose = require("mongoose");
const { options } = require("../config/customconfig");

module.exports = function () {
  mongoose.set("useNewUrlParser", true);
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  mongoose.set("useUnifiedTopology", true);

  mongoose
    .connect("mongodb://127.0.0.1/communication_outage", options)

    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Could not connect to MongoDB...", err));

  //as catch will be handled by uncaught rejection
};
