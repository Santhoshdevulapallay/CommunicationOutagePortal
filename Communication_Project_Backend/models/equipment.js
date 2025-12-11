const Joi = require("joi");
const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema({
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
  location: {
    type: String,
    required: true,
    minlength: 0,
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

const Equipment = mongoose.model("Equipment", equipmentSchema);

function validation(link) {
  const schema = Joi.object({
    description: Joi.string().min(1).max(500).required(),
    location: Joi.string().min(1).max(500).required(),
    ownership: Joi.array().min(1).required(),
  });
  return schema.validate(link);
}

exports.equipmentSchema = equipmentSchema;
exports.Equipment = Equipment;
exports.validate = validation;
