const config = require("config");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  isOperator: Boolean,
  isAdmin: Boolean,
  isSupervisor: Boolean,
  SCADA_NAME: String,
  isState: String,
  isscadaOperator: Boolean,
  isSudoUser: Boolean,
  nominations: [
    {
      Name: { type: String },
      Designation: { type: String },
      Contact_Number: { type: Number },
      Mail_Id: { type: String },
    },
  ],
  noOfFailedAttempts: {
    type: Number,
    default: 0,
  },
  aliasuserName: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
  },
});

userSchema.methods.generateAuthToken = function () {
  
  const token = jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      isAdmin: this.isAdmin,
      isOperator: this.isOperator,
      isSupervisor: this.isSupervisor,
      SCADA_NAME: this.SCADA_NAME,
      isState: this.isState,
      isscadaOperator: this.isscadaOperator,
      isSudoUser: this.isSudoUser,
    },
    config.get("jwtPrivateKey"),
    {
      expiresIn: "1d", // it will be expired after 10 hours
    }
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validation(user) {
  const schema = Joi.object({
    userName: Joi.string().min(4).max(50).required(),
    password: passwordComplexity(complexityOptions),
  });
  return schema.validate(user);
}

exports.userSchema = userSchema;
exports.User = User;
exports.validate = validation;
