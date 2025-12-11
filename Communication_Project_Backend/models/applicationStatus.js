const Joi = require("joi");
const mongoose = require("mongoose");

const applicationStatusSchema = new mongoose.Schema({
  //user is who submits the database
  typeApplication: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  FreezedDate: {
    type: Date,
    required: true,
  },
});

const ApplicationStatus = mongoose.model(
  "ApplicationStatus",
  applicationStatusSchema
);

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

exports.applicationStatusSchema = applicationStatusSchema;
exports.ApplicationStatus = ApplicationStatus;
// exports.validate = validation;
