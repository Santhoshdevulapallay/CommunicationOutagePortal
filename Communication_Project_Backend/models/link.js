const Joi = require("joi");
const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  //user is who submits the database
  user: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 500,
  },
  source: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 500,
  },
  destination: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 500,
  },
  channelRouting: {
    type: String,
    minlength: 1,
    maxlength: 500,
  },
  ownership: {
    type: [String],
    enum: [
      "PGCIL",
      "PGCIL SR 1",
      "PGCIL SR 2",
      "APTRANSCO",
      "KPTCL",
      "KSEBL",
      "TANTRANSCO",
      "TSTRANSCO",
      "PED, Puducherry",
      "SRLDC",
      "NLCTS2",
      "NNTPS",
      "NLY1E",
      "NLY2E",
      "SEPC",
      "NNTPS",
      "APSPCL",
      "HNPCL",
      "ADANI",
      "LANCO",
      "JSWEL",
      "NTPL",
      "ILFS",
      "Coastal Energen",
      "Betam",
      "Kaiga",
      "MAPS",
      
    ],
    required: true,
  },
  linkTypem: {
    type: [String],
    enum: [
      "Data",
      "Voice",
      "TeleProtection",
      "VC",
    ],
    required: true,
  },
  channelTypem: {
    type: [String],
    enum: [
      "RTU",
      "ICCP",
      "DCPC",
      "PMU",
      "PDC",
      "Voice",
      "TeleProtection",
      "SPS",
      "VC"
    ],
    required: true,
  },
  linkType:{
    type:String,
    // required: true
  },
  pathType:{
    type:String,
    required:true
  },
  requestApprovalStatusTaken:{
    type: Boolean
  },
  rejectedtoAdd:{
    type: Boolean
  },
  hide:{
    type: Boolean
  },
  hideDate: {
    type: Date,
  },
 
}, { timestamps: true });

const Link = mongoose.model("Link", linkSchema);

function validation(link) {
  const schema = Joi.object({
    description: Joi.string().min(1).max(500).required(),
    source: Joi.string().min(1).max(500).required(),
    destination: Joi.string().min(1).max(500).required(),
    channelRouting: Joi.string().min(1).max(500).required(),
    ownership: Joi.array().min(1).required(),
    linkTypem: Joi.array().min(1).required(),
    channelTypem: Joi.array().min(1).required(),
    // linkType: Joi.string().min(1).max(500).required(),
    pathType: Joi.string().min(1).max(500).required(),
  });
  return schema.validate(link);
}

exports.linkSchema = linkSchema;
exports.Link = Link;
exports.validate = validation;
