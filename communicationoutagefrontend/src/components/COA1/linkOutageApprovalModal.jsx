import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Joi from "joi-browser";
import { toast } from "react-toastify";
import Form from "../common/form";
import {
  saveLinkOutage,
  getRollingOutageMillisec,
} from "../../services/linkOutageService";

import DateRangePicker from "react-bootstrap-daterangepicker";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css";
import "../../modalstyle.css";

import moment from "moment";
var momentDurationFormatSetup = require("moment-duration-format");

class LinkOutageApprovalModal extends Form {
  state = {
    show: false,
    RollingWindowWithout: "",
    RollingWindowWithProposal: "",
    RollingWindowMillsec: 0,
    data: {
      description: "",
      rpcRemarks: "",
      supervisorRemarks: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
      outageReason: "",
      alternateChannelStatus: "",
    },
    Approvalstatus: "",
    errors: {},
    outageStartDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    ),
    outageEndDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      2
    ),
    approvedStartDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    ),
    approvedEndDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      2
    ),
    minDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):

    if (
      this.props.show !== prevProps.show ||
      this.props.outageRequest !== prevProps.outageRequest
    ) {
      if (this.props.show) {
        await this.populateLinkOutage();
      } else {
        this.setState({ show: false });
      }
    }
  }

  schema = {
    _id: Joi.string(),
    rpcRemarks: Joi.string().required().label("RPC Remarks"),
    supervisorRemarks: Joi.string().allow("").label("SRLDC Remarks"),
    description: Joi.string().required().label("Description"),
    source: Joi.string().required().label("Source"),
    destination: Joi.string().required().label("Destination"),
    channelRouting: Joi.string().required().label("Chanel Routing"),
    outageReason: Joi.string()
      .required()
      .label(
        "Reason for availing outage & Precautions / actions being taken to ensure communication system availability"
      ),
    alternateChannelStatus: Joi.string().required(
      "Alternate Channel Status required"
    ),
    ownership: Joi.array()
      .min(1)
      .required()
      .label("Ownership")
      .error(() => {
        return {
          message: "Please select atleast one Owner",
        };
      }),
  };

  async populateLinkOutage() {
    try {
      const { data: RollingOutageMillisec } = await getRollingOutageMillisec(
        this.props.outageRequest.link._id,
        this.props.mvalue.year,
        this.props.mvalue.month - 1
      );
      var RollingWindowWithout = moment
        .duration(RollingOutageMillisec[0].totalMilliSec)
        .format("hh:mm");
      const outageRequest = this.props.outageRequest;
      this.setState({
        outageStartDate: new Date(outageRequest.proposedStartDate),
        outageEndDate: new Date(outageRequest.proposedEndDate),
        approvedStartDate: new Date(
          outageRequest.approvedStartDate
            ? outageRequest.approvedStartDate
            : outageRequest.proposedStartDate
        ),
        approvedEndDate: new Date(
          outageRequest.approvedEndDate
            ? outageRequest.approvedEndDate
            : outageRequest.proposedEndDate
        ),
        data: this.mapTOViewModel(outageRequest),
        show: true,
        Approvalstatus: outageRequest.Approvalstatus,
        RollingWindowWithout: RollingWindowWithout,
        RollingWindowMillsec: RollingOutageMillisec[0].totalMilliSec,
      });
      this.updateRollingWindowWithProposal();
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }
  updateRollingWindowWithProposal() {
    var proposedWindow = 0;
    if (this.state.Approvalstatus === "Pending") {
      proposedWindow = moment(this.state.outageEndDate).diff(
        this.state.outageStartDate
      );
    } else {
      proposedWindow = moment(this.state.approvedEndDate).diff(
        this.state.approvedStartDate
      );
    }
    var RollingWindowWithProposal = moment
      .duration(proposedWindow + this.state.RollingWindowMillsec)
      .format("hh:mm");
    this.setState({ RollingWindowWithProposal: RollingWindowWithProposal });
  }

  mapTOViewModel(linkOutage) {
    var ownerList = [];
    for (var i = 0; i < linkOutage.link["ownership"].length; i++) {
      ownerList.push({
        value: linkOutage.link["ownership"][i],
        label: linkOutage.link["ownership"][i],
      });
    }
    return {
      _id: linkOutage.link._id,
      description: linkOutage.link.description,
      source: linkOutage.link.source,
      destination: linkOutage.link.destination,
      channelRouting: linkOutage.link.channelRouting,
      ownership: ownerList,
      outageReason: linkOutage.reasonPrecautions,
      alternateChannelStatus: linkOutage.alternateChannelStatus,
      rpcRemarks: linkOutage.rpcRemarks,
      supervisorRemarks: linkOutage.supervisorRemarks,
    };
  }

  handleCallback = (start, end, label) => {
    this.setState({ approvedStartDate: start, approvedEndDate: end });
    this.updateRollingWindowWithProposal();
  };

  doSubmit = async (Approvalstatus) => {
    try {
      var outageRequest = { ...this.props.outageRequest };
      var linkOutage = {
        _id: this.props.outageRequest._id,
        rpcRemarks: this.state.data.rpcRemarks,
        Approvalstatus: Approvalstatus,
      };
      if (Approvalstatus == "Approved") {
        linkOutage["approvedStartDate"] = this.state.approvedStartDate;
        linkOutage["approvedEndDate"] = this.state.approvedEndDate;
      }

      await saveLinkOutage(linkOutage);

      if (Approvalstatus == "Approved") {
        outageRequest.approvedStartDate = this.state.approvedStartDate;
        outageRequest.approvedEndDate = this.state.approvedEndDate;
        toast.success("Successfully Approved Outage");
      } else {
        outageRequest.approvedStartDate = "";
        outageRequest.approvedEndDate = "";
        toast.error("Successfully Rejected Outage");
      }
      outageRequest.rpcRemarks = this.state.data.rpcRemarks;
      outageRequest.Approvalstatus = Approvalstatus;

      this.props.OnClose("reload", outageRequest);
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  };

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={this.props.OnClose}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
        className="linkoutageapprovalmodalclass"
      >
        <Modal.Header closeButton>
          <Modal.Title id="examCustom Mople-custom-modal-styling-title">
            Outage Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <br></br>

            <form onSubmit={this.handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <span className="text-muted">
                    Total No of Outage Availed during last 12Months:
                  </span>
                  <span
                    className="badge badge-warning"
                    style={{ fontSize: "15px" }}
                  >
                    {this.state.RollingWindowWithout}
                  </span>
                </div>
                <div className="col-md-6">
                  <span className="text-muted">
                    Total No of Outage Hours including this proposal:
                  </span>
                  <span
                    className="badge badge-warning"
                    style={{ fontSize: "15px" }}
                  >
                    {this.state.RollingWindowWithProposal}
                  </span>
                </div>
              </div>
              <br></br>
              <div className="row">
                <div className="col-md-6">
                  <DateRangePicker
                    initialSettings={{
                      timePicker: true,
                      timePicker24Hour: true,
                      startDate: this.state.outageStartDate,
                      endDate: this.state.outageEndDate,
                      minDate: new Date(
                        this.props.mvalue.year,
                        this.props.mvalue.month - 1,
                        1
                      ),

                      locale: {
                        format: "DD-MM-YYYY HH:mm",
                      },
                    }}
                    onCallback={this.handleCallback}
                  >
                    <input
                      type="text"
                      className="form-control"
                      disabled="True"
                    />
                  </DateRangePicker>
                </div>
                <div className="col-md-4">
                  <span>
                    <b>Outage Hours Proposed: </b>
                    <span
                      className="badge badge-danger"
                      style={{ fontSize: "15px" }}
                    >
                      {moment
                        .duration(
                          moment(this.state.outageEndDate).diff(
                            moment(this.state.outageStartDate)
                          )
                        )
                        .format("hh:mm")}
                    </span>
                  </span>
                </div>
                <div className="col-md-2 align-self-end ">
                  {Math.abs(this.state.approvedStartDate - new Date()) / 36e5 >
                    24 && (
                    <Button
                      variant="success"
                      disabled={this.validate()}
                      onClick={() => this.doSubmit("Approved")}
                    >
                      <i className="fa fa-check" aria-hidden="true"></i>
                      Approve
                    </Button>
                  )}
                </div>
              </div>
              <br></br>
              <div className="row">
                <div className="col-md-6">
                  <DateRangePicker
                    initialSettings={{
                      timePicker: true,
                      timePicker24Hour: true,
                      startDate: this.state.approvedStartDate,
                      endDate: this.state.approvedEndDate,
                      minDate: new Date(
                        this.props.mvalue.year,
                        this.props.mvalue.month - 1,
                        1
                      ),

                      locale: {
                        format: "DD-MM-YYYY HH:mm",
                      },
                      parentEl: ".linkoutageapprovalmodalclass",
                    }}
                    onCallback={this.handleCallback}
                  >
                    <input type="text" className="form-control" />
                  </DateRangePicker>
                </div>
                <div className="col-md-4">
                  <span>
                    <b>Outage Hours Approved: </b>
                    <span
                      className="badge badge-danger"
                      style={{ fontSize: "15px" }}
                    >
                      {moment
                        .duration(
                          moment(this.state.approvedEndDate).diff(
                            moment(this.state.approvedStartDate)
                          )
                        )
                        .format("hh:mm")}
                      ({this.state.Approvalstatus})
                    </span>
                  </span>
                </div>
                {/* Approve or Reject can be changed before 24hrs only */}
                <div className="col-md-2 align-self-end ">
                  {Math.abs(this.state.approvedStartDate - new Date()) / 36e5 >
                    24 && (
                    <Button
                      variant="danger"
                      disabled={this.validate()}
                      onClick={() => this.doSubmit("Rejected")}
                    >
                      <i className="fa fa-times" aria-hidden="true"></i> Reject
                    </Button>
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <br></br>
                  {this.renderTextArea(
                    "supervisorRemarks",
                    "SRLDC Remarks",
                    "True"
                  )}
                </div>
                <div className="col-md-6">
                  <br></br>
                  {this.renderTextArea("rpcRemarks", "RPC Remarks", "")}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <br></br>
                  {this.renderTextArea(
                    "outageReason",
                    "Reason for availing outage & Precautions / actions being taken to ensure communication system availability",
                    "True"
                  )}
                </div>
                <div className="col-md-6">
                  <br></br>
                  <br></br>
                  {this.renderTextArea(
                    "alternateChannelStatus",
                    "Alternate Channel Status",
                    "True"
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  {this.renderInput("description", "Description", "True")}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  {this.renderInput("source", "Source", "True")}
                </div>
                <div className="col-md-6">
                  {this.renderInput("destination", "Destination", "True")}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  {this.renderInput("channelRouting", "channelRouting", "True")}
                </div>
                <div className="col-md-6">
                  {this.renderMultipleSelect(
                    "ownership",
                    "Ownership",
                    this.state.ownerList,
                    "True"
                  )}
                </div>
              </div>
            </form>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

export default LinkOutageApprovalModal;
