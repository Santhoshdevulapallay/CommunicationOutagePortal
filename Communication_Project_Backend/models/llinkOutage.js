const Joi = require("joi");
const mongoose = require("mongoose");
const { linkSchema } = require("./link");
const { userSchema } = require("./user");
var mongooseHistory = require("mongoose-history");
const linkOutageSchema = new mongoose.Schema({
  //user is who submits the database
  requestingAgency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  link: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Link",
  },
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
    maxlength: 10000,
  },
  alternateChannelStatus: {
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
  cod1SubmittedDate: {
    type: Date,
  },
  d3mailStatus: {
    type: Boolean,
    default: false,
  },
  // cod1ApprovedStartDate: {
  //   type: Date,
  // },
  // cod1ApprovedEndDate: {
  //   type: Date,
  // },
  // cod1Approvalstatus: {
  //   type: String,
  // },
  // cod1ApproveDate: {
  //   type: Date,
  // },
  //if user deletes it will be 0
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
});

// linkOutageSchema.plugin(diffHistory.plugin);
linkOutageSchema.plugin(mongooseHistory);
const LinkOutage = mongoose.model("LinkOutage", linkOutageSchema);

function validation(linkOutage) {
  const schema = Joi.object({
    reasonPrecautions: Joi.string().min(1).max(10000).required(),
    alternateChannelStatus: Joi.string().min(1).max(10000).required(),
  });
  return schema.validate(linkOutage);
}

exports.linkOutageSchema = linkOutageSchema;
exports.LinkOutage = LinkOutage;
exports.validate = validation;
