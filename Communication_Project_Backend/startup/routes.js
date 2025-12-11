const auth = require("../routes/auth");
const meetings = require("../routes/meetings");
const links = require("../routes/links");
const equipments = require("../routes/equipments");
const linkOutage = require("../routes/linkOutage");
const equipmentOutage = require("../routes/equipmentOutage");
const applicationStatus = require("../routes/applicationStatus");
const users = require("../routes/user");
const express = require("express");
const error = require("../middleware/error");
const substations = require("../routes/substations")
const telemetry = require("../routes/telemetry")

module.exports = function (app) {
  app.use(express.json({ extended: true }));
  app.use("/api/auth/", auth);
  app.use("/api/meetings/", meetings);
  app.use("/api/links/", links);
  app.use("/api/equipments/", equipments);
  app.use("/api/linkoutage/", linkOutage);
  app.use("/api/equipmentoutage/", equipmentOutage);
  app.use("/api/application/", applicationStatus);
  app.use("/api/users/", users);
  app.use("/api/v1/substations/", substations);
  app.use("/api/v1/telemetry/", telemetry);

  app.use(error);
};
