const { User, validate } = require("../models/user");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 8,
  max: 25,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
};

router.get("/owners", [auth], async (req, res) => {
  //   console.log(req.user);
  users = await User.find().select({ userName: 1, _id: 0 });
  owners = [];
  for (var i = 0; i < users.length; i++) {
    owners.push({ ownerName: users[i].userName });
  }
  res.send(owners);
});

router.put("/changePassword", [auth], async (req, res) => {
  console.log(req);

  console.log(req.body);
  
  var passwordCheck = passwordComplexity().validate(req.body.password);
  if (passwordCheck["error"] != undefined) {
    return res.status(404).send("Password complexity not matching");
  }

  // Retrieve the user's record from the database
  var userRec = await User.findById(req.user._id);

  // Compare the current password with the existing password
  const passwordMatch = await bcrypt.compare(req.body.password, userRec.password);
  if (passwordMatch) {
    return res.status(400).send("Password Entered is same as existing Password. Please enter different password");
  }

  const salt = await bcrypt.genSalt(10);

  const password = await bcrypt.hash(req.body.password, salt);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: password,
    },
    { new: true }
  );
  console.log(user);
  if (!user) return res.status(404).send("Password not changed");

  res.send(user);
});

module.exports = router;
