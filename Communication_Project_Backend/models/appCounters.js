const Joi = require("joi");
const mongoose = require("mongoose");

const appCountersSchema = new mongoose.Schema({
  //user is who submits the database
  typeCounter: {
    type: String,
    required: true,
  },

  counter: {
    type: Number,
    required: true,
  },
});

const AppCounter = mongoose.model("AppCounter", appCountersSchema);

// function validation(applicationStatus) {
//   const schema = Joi.object({
//     // user: Joi.string().min(5).max(50).required(),
//     description: Joi.string().min(5).max(250).required(),
//     source: Joi.string().min(5).max(250).required(),
//     destination: Joi.string().min(5).max(250).required(),
//     channelRouting: Joi.string().min(5).max(250).required(),
//     ownership: Joi.array().min(1).required(),
//   });
//   return schema.validate(link);
// }

exports.appCountersSchema = appCountersSchema;
exports.AppCounter = AppCounter;
// exports.validate = validation;
