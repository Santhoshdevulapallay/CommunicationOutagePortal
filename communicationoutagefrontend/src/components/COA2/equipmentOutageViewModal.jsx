import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Joi from "joi-browser";
import { toast } from "react-toastify";
import Form from "../common/form";
import {
  saveEquipmentOutage,
  getRollingOutageMillisec,
} from "../../services/equipmentOutageService";

import auth from "../../services/authService";

import DateRangePicker from "react-bootstrap-daterangepicker";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css";
import "../../modalstyle.css";

import moment from "moment";
var momentDurationFormatSetup = require("moment-duration-format");

class EquipmentOutageViewlModal extends Form {
  state = {
    viewshow: false,
    RollingWindowWithout: "",
    RollingWindowWithProposal: "",
    RollingWindowMillsec: 0,
    data: {
      description: "",
      rpcRemarks: "",
      supervisorRemarks: "",
      location: "",
      ownership: [],
      outageReason: "",
      linksAffected: "",
      alternateChannelPathStatus: "",
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
      this.props.viewshow !== prevProps.viewshow ||
      this.props.outageRequest !== prevProps.outageRequest
    ) {
      if (this.props.viewshow) {
        await this.populateEquipmentOutage();
      } else {
        this.setState({ viewshow: false });
      }
    }
  }

  schema = {
    _id: Joi.string(),
    rpcRemarks: Joi.string().allow("").label("RPC Remarks"),
    supervisorRemarks: Joi.string().allow("").label("SRLDC Remarks"),
    location: Joi.string().allow("").label("Location"),
    linksAffected: Joi.string().allow("").label("Links Affected"),
    description: Joi.string().allow("").label("Links Affected"),

    outageReason: Joi.string()
      .required()
      .label(
        "Reason for availing outage & Precautions / actions being taken to ensure communication system availability"
      ),
    alternateChannelPathStatus: Joi.string().required(
      "Alternate Channel Path Available(Furnish Details)"
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

  async populateEquipmentOutage() {
    try {
      const outageRequestId = this.props.outageRequest._id;
      const { data: RollingOutageMillisec } = await getRollingOutageMillisec(
        this.props.outageRequest.equipment._id,
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
        viewshow: true,
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
    if (this.state.Approvalstatus == "Pending") {
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

  mapTOViewModel(equipmentOutage) {
    var ownerList = [];
    for (var i = 0; i < equipmentOutage.equipment["ownership"].length; i++) {
      ownerList.push({
        value: equipmentOutage.equipment["ownership"][i],
        label: equipmentOutage.equipment["ownership"][i],
      });
    }
    var LinksAffected = this.getLinksAffectedText(equipmentOutage);
    return {
      _id: equipmentOutage.equipment._id,
      description: equipmentOutage.equipment.description,
      location: equipmentOutage.equipment.location,
      ownership: ownerList,
      linksAffected: LinksAffected,
      outageReason: equipmentOutage.reasonPrecautions,
      alternateChannelPathStatus: equipmentOutage.alternateChannelPathStatus,
      rpcRemarks: equipmentOutage.rpcRemarks,
      supervisorRemarks: equipmentOutage.supervisorRemarks,
    };
  }

  getLinksAffectedText = (outageRequest) => {
    var LinkOutageText = "";
    if (outageRequest.linksAffected) {
      for (var i = 0; i < outageRequest.linksAffected.length; i++) {
        LinkOutageText +=
          "Description: " +
          outageRequest.linksAffected[i].description +
          " Source:" +
          outageRequest.linksAffected[i].source +
          " Destination:" +
          outageRequest.linksAffected[i].destination +
          "     ";
      }
    }
    return LinkOutageText;
  };

  handleCallback = (start, end, label) => {
    this.setState({ outageStartDate: start, outageEndDate: end });
    this.updateRollingWindowWithProposal();
  };

  doSubmit = async () => {
    try {
      await saveEquipmentOutage(
        {
          _id: this.props.outageRequest._id,
          reasonPrecautions: this.state.data.outageReason,
          alternateChannelPathStatus: this.state.data
            .alternateChannelPathStatus,
          proposedStartDate: this.state.outageStartDate,
          proposedEndDate: this.state.outageEndDate,
          supervisorRemarks: this.state.data.supervisorRemarks,
        },
        "True"
      );
      toast.success("Successfully Edited Outage Outage Request");
      var outageRequest = { ...this.props.outageRequest };

      outageRequest.reasonPrecautions = this.state.data.outageReason;
      outageRequest.alternateChannelPathStatus = this.state.data.alternateChannelPathStatus;
      outageRequest.proposedStartDate = new Date(
        this.state.outageStartDate
      ).toISOString();
      outageRequest.proposedEndDate = new Date(
        this.state.outageEndDate
      ).toISOString();
      outageRequest.supervisorRemarks = this.state.data.supervisorRemarks;

      this.props.OnClose("reload", outageRequest);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error(ex.response.data);
        this.props.OnClose();
      }
    }
  };

  render() {
    const user = auth.getCurrentUser();

    return (
      <Modal
        show={this.state.viewshow}
        onHide={this.props.OnClose}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
        className="linkoutageeditmodalclass"
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
                      parentEl: ".linkoutageeditmodalclass",
                    }}
                    onCallback={this.handleCallback}
                  >
                    <input type="text" className="form-control" />
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
                  {this.state.Approvalstatus === "Pending" && (
                    <Button
                      variant="success"
                      disabled={this.validate()}
                      onClick={() => this.doSubmit()}
                    >
                      <i className="fa fa-check" aria-hidden="true"></i>
                      Save
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
                      parentEl: ".linkoutageeditmodalclass",
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
              </div>

              <div className="row">
                <div className="col-md-6">
                  <br></br>
                  {this.renderTextArea(
                    "outageReason",
                    "Reason for availing outage & Precautions / actions being taken to ensure communication system availability"
                  )}
                </div>
                <div className="col-md-6">
                  <br></br>
                  <br></br>
                  {this.renderTextArea(
                    "alternateChannelPathStatus",
                    "Alternate Channel Path Available"
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <br></br>
                  {user.isSupervisor &&
                    this.renderTextArea(
                      "supervisorRemarks",
                      "SRLDC Remarks",
                      ""
                    )}
                  {!user.isSupervisor &&
                    this.renderTextArea(
                      "supervisorRemarks",
                      "SRLDC Remarks",
                      "True"
                    )}
                </div>
                <div className="col-md-6">
                  <br></br>
                  {this.renderTextArea("rpcRemarks", "RPC Remarks", "True")}
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  {this.renderTextArea(
                    "linksAffected",
                    "Links Affected",
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
                  {this.renderInput("location", "Location", "True")}
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

export default EquipmentOutageViewlModal;
