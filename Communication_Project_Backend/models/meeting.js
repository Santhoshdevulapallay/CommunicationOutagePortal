const Joi = require("joi");
const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);


const meetingSchema = new mongoose.Schema({
  //user is who submits the database
  COMSRDate: {
    type: Date,
    required: true,
  },
  COMSRNumber: {
    type: Number,
  },
  reqOpeningDate: {
    type: Date,
    required: true,
  },
  reqClosingDate: {
    type: Date,
    required: true,
  },
  shutdownMinDate: {
    type: Date,
    required: true,
  },
  shutdownMaxDate: {
    type: Date,
    required: true,
  },
 
});

meetingSchema.plugin(AutoIncrement, {inc_field: 'COMSRNumber'});


const Meeting = mongoose.model("Meeting", meetingSchema);



function validation(meeting) {
  const schema = Joi.object({
    COMSRDate: Joi.date().required(),
    // COMSRNumber: Joi.string().required(),
    reqOpeningDate: Joi.date().required(),
    reqClosingDate: Joi.date().required(),
    shutdownMinDate: Joi.date().required(),
    shutdownMaxDate: Joi.date().required(),
  });
  return schema.validate(meeting);
}


exports.meetingSchema = meetingSchema;
exports.Meeting = Meeting;
exports.validate = validation;
