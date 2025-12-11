const { User } = require("./models/user");
const { Link } = require("./models/link");
const { Equipment } = require("./models/equipment");
require("./startup/db")();

const mongoose = require("mongoose");
const xlsx = require("xlsx");
const _ = require("lodash");
const bcrypt = require("bcrypt");

async function resetpass() {
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash("Password@123", salt);
  console.log(password);
}

resetpass();
