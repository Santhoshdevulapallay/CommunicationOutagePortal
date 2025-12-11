const Joi = require("joi");
const mongoose = require("mongoose");
var mongooseHistory = require("mongoose-history");

const equipmentOutageSchema = new mongoose.Schema({
  //user is who submits the database
  requestingAgency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipment",
  },
  linksAffected: [{ type: mongoose.Schema.Types.ObjectId, ref: "Link" }],
  outageType: {
    type: String,
  },
  proposedStartDate: {
    type: Date,
  },
  proposedEndDate: {
    type: Date,
  },
  reasonPrecautions: {
    type: String,
    minlength: 1,
    maxlength: 2500,
  },
  alternateChannelPathStatus: {
    type: String,
    minlength: 1,
    maxlength: 10000,
  },
  //0-Not yet decided //1-Approved //2-rejected
  Approvalstatus: {
    type: String,
    default: "Pending",
  },
  requestSubmittedDate: {
    type: Date,
    default: Date.now,
  },
  supervisorRemarks: {
    type: String,
    maxlength: 2500,
  },
  rpcRemarks: {
    type: String,
    maxlength: 2500,
  },
  approvedStartDate: {
    type: Date,
  },
  approvedEndDate: {
    type: Date,
  },
  COMSRNumber: {
    type: Number,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  requestApprovedDate: {
    type: Date,
  },
  outageStartDate: {
    type: Date,
  },
  outageEndDate: {
    type: Date,
  },
  deleteStatus: {
    type: Number,
    default: 0,
  },
  openingCode: {
    type: String,
  },
  closingCode: {
    type: String,
  },
  //default 0 is unknown, 1 is availed, 2 is unavailed
  availedStatus: {
    type: Number,
    default: 0,
  },
  d3mailStatus: {
    type: Boolean,
    default: false,
  },
});

equipmentOutageSchema.plugin(mongooseHistory);

const EquipmentOutage = mongoose.model(
  "EquipmentOutage",
  equipmentOutageSchema
);

function validation(equipmentOutage) {
  const schema = Joi.object({
    reasonPrecautions: Joi.string().min(1).max(2500).required(),
    alternateChannelPathStatus: Joi.string().min(1).max(2500).required(),
  });
  return schema.validate(equipmentOutage);
}

exports.equipmentOutageSchema = equipmentOutageSchema;
exports.EquipmentOutage = EquipmentOutage;
exports.validate = validation;
