const Joi = require("joi");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const winston = require("winston");


router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ aliasuserName: req.body.userName });
  if (!user) return res.status(400).send("Invalid userName or password.");
  if(user.noOfFailedAttempts>15){
    return res.status(400).send("Account is Blocked. Please contact admin");
  }

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword){
    user.noOfFailedAttempts=user.noOfFailedAttempts+1;
    user.save()
    return res.status(400).send("userName email or password.");
  }
  user.noOfFailedAttempts=0;
  user.save();
  const token = user.generateAuthToken();
  winston.info((new Date().toDateString() + ": User Logged: " + user.userName));
 
  res.send(token);
});

function validate(req) {
  const schema = Joi.object({
    userName: Joi.string().min(4).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

module.exports = router;
