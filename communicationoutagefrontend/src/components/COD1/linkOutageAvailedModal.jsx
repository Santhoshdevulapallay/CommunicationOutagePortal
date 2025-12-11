import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Joi from "joi-browser";
import { toast } from "react-toastify";
import Form from "../common/form";
import { saveCOD1Outage } from "../../services/linkOutageService";
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

class LinkOutageAvailedModal extends Form {
  state = {
    show: false,
    data: {
      description: "",
      rpcRemarks: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
      outageReason: "",
    },
    cod1Approvalstatus: "",
    cod1SubmittedDate: "",
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
    cod1ApprovedStartDate: "",
    cod1ApprovedEndDate: "",
    minDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    //opening other outage or opening same modal
    if (
      this.props.show !== prevProps.show ||
      this.props.cod1Outage !== prevProps.cod1Outage
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
    rpcRemarks: Joi.string().allow("").label("RPC Remarks"),
    description: Joi.string().required().label("Description"),
    source: Joi.string().required().label("Source"),
    destination: Joi.string().required().label("Destination"),
    channelRouting: Joi.string().required().label("Chanel Routing"),
    outageReason: Joi.string()
      .required()
      .label(
        "Reason for availing outage & Precautions / actions being taken to ensure communication system availability"
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
      const cod1Outage = this.props.cod1Outage;

      this.setState({
        approvedStartDate: new Date(cod1Outage.approvedStartDate),
        approvedEndDate: new Date(cod1Outage.approvedEndDate),
        outageStartDate: new Date(
          cod1Outage.outageStartDate
            ? cod1Outage.outageStartDate
            : cod1Outage.approvedStartDate
        ),
        outageEndDate: new Date(
          cod1Outage.outageEndDate
            ? cod1Outage.outageEndDate
            : cod1Outage.approvedEndDate
        ),
        cod1ApprovedStartDate: new Date(
          cod1Outage.cod1ApprovedStartDate
            ? cod1Outage.cod1ApprovedStartDate
            : cod1Outage.outageStartDate
        ),
        cod1ApprovedEndDate: new Date(
          cod1Outage.cod1ApprovedEndDate
            ? cod1Outage.cod1ApprovedEndDate
            : cod1Outage.outageEndDate
        ),
        data: this.mapTOViewModel(cod1Outage),
        show: true,
        cod1Approvalstatus: cod1Outage.cod1Approvalstatus,
        cod1SubmittedDate: cod1Outage.cod1SubmittedDate,
        minDate: new Date(
          this.props.mvalue.year,
          this.props.mvalue.month - 1,
          1
        ),
      });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }

  mapTOViewModel(cod1Outage) {
    var ownerList = [];
    for (var i = 0; i < cod1Outage.link["ownership"].length; i++) {
      ownerList.push({
        value: cod1Outage.link["ownership"][i],
        label: cod1Outage.link["ownership"][i],
      });
    }
    return {
      _id: cod1Outage.link._id,
      description: cod1Outage.link.description,
      source: cod1Outage.link.source,
      destination: cod1Outage.link.destination,
      channelRouting: cod1Outage.link.channelRouting,
      ownership: ownerList,
      outageReason: cod1Outage.reasonPrecautions,
      rpcRemarks: cod1Outage.rpcRemarks,
    };
  }

  handleCallback = (start, end, label) => {
    this.setState({ outageStartDate: start, outageEndDate: end });
  };

  doSubmit = async () => {
    try {
      await saveCOD1Outage(
        {
          _id: this.props.cod1Outage._id,
          outageStartDate: this.state.outageStartDate,
          outageEndDate: this.state.outageEndDate,
        },
        "True"
      );
      toast.success("Successfully Edited Outage Outage Request");
      var cod1Outage = { ...this.props.cod1Outage };

      cod1Outage.outageStartDate = new Date(
        this.state.outageStartDate
      ).toISOString();
      cod1Outage.outageEndDate = new Date(
        this.state.outageEndDate
      ).toISOString();

      this.props.OnClose("reload", cod1Outage);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error(ex.response.data);
        this.props.OnClose();
      }
    }
  };

  approveCOD1Outage = async () => {
    debugger;
    try {
      if (this.props.cod1Outage.cod1SubmittedDate) {
        await saveCOD1Outage({
          _id: this.props.cod1Outage._id,
          cod1ApprovedStartDate: this.state.cod1ApprovedStartDate,
          cod1ApprovedEndDate: this.state.cod1ApprovedEndDate,
        });
        toast.success("Successfully Approved COD1 Outage");
        var cod1Outage = { ...this.props.cod1Outage };

        cod1Outage.cod1ApprovedStartDate = new Date(
          this.state.cod1ApprovedStartDate
        ).toISOString();
        cod1Outage.cod1ApprovedEndDate = new Date(
          this.state.cod1ApprovedEndDate
        ).toISOString();
        cod1Outage.cod1Approvalstatus = "Approved";

        this.props.OnClose("reload", cod1Outage);
      } else {
        toast.error(
          "The request cannot be approved as Actual Outage Start date and End Date not submitted by user"
        );
      }
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
        show={this.state.show}
        onHide={this.props.OnClose}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
        className="linkoutageeditmodalclass"
      >
        <Modal.Header closeButton>
          <Modal.Title id="examCustom Mople-custom-modal-styling-title">
            COD1 Outage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <br></br>

            <form onSubmit={this.handleSubmit}>
              <br></br>
              <div className="row">
                <div className="col-md-6">
                  {user && !user.isAdmin && (
                    <DateRangePicker
                      initialSettings={{
                        timePicker: true,
                        timePicker24Hour: true,
                        startDate: this.state.cod1ApprovedStartDate,
                        endDate: this.state.cod1ApprovedEndDate,
                        minDate: this.state.minDate,

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
                  )}
                  {user && user.isAdmin && (
                    <DateRangePicker
                      initialSettings={{
                        timePicker: true,
                        timePicker24Hour: true,
                        startDate: this.state.cod1ApprovedStartDate,
                        endDate: this.state.cod1ApprovedEndDate,
                        minDate: this.state.minDate,

                        locale: {
                          format: "DD-MM-YYYY HH:mm",
                        },
                        parentEl: ".linkoutageeditmodalclass",
                      }}
                      onCallback={this.handleCallback}
                    >
                      <input type="text" className="form-control" />
                    </DateRangePicker>
                  )}
                </div>
                <div className="col-md-4">
                  <span>
                    <b>COD1 Outage Hours Approved: </b>
                    <span
                      className="badge badge-danger"
                      style={{ fontSize: "15px" }}
                    >
                      {moment
                        .duration(
                          moment(this.state.cod1ApprovedEndDate).diff(
                            moment(this.state.cod1ApprovedStartDate)
                          )
                        )
                        .format("HH:mm")}
                      ({this.state.cod1Approvalstatus})
                    </span>
                  </span>
                </div>
              </div>
              <br></br>
              <div className="row">
                <div className="col-md-6">
                  {user && !user.isAdmin && (
                    <DateRangePicker
                      initialSettings={{
                        timePicker: true,
                        timePicker24Hour: true,
                        startDate: this.state.outageStartDate,
                        endDate: this.state.outageEndDate,
                        minDate: this.state.minDate,

                        locale: {
                          format: "DD-MM-YYYY HH:mm",
                        },
                        parentEl: ".linkoutageeditmodalclass",
                      }}
                      onCallback={this.handleCallback}
                    >
                      <input type="text" className="form-control" />
                    </DateRangePicker>
                  )}
                  {user && user.isAdmin && (
                    <DateRangePicker
                      initialSettings={{
                        timePicker: true,
                        timePicker24Hour: true,
                        startDate: this.state.outageStartDate,
                        endDate: this.state.outageEndDate,
                        minDate: this.state.minDate,

                        locale: {
                          format: "DD-MM-YYYY HH:mm",
                        },
                        parentEl: ".linkoutageeditmodalclass",
                      }}
                      onCallback={this.handleCallback}
                    >
                      <input type="text" className="form-control" disabled />
                    </DateRangePicker>
                  )}
                </div>
                <div className="col-md-4">
                  <span>
                    <b>Outage Hours Availed: </b>
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
                        .format("HH:mm")}
                    </span>
                  </span>
                </div>
                <div className="col-md-2 align-self-end ">
                  {!user.isAdmin &&
                     (
                      <Button
                        variant="success"
                        disabled={this.validate()}
                        onClick={() => this.doSubmit()}
                      >
                        <i className="fa fa-check" aria-hidden="true"></i>
                        Save
                      </Button>
                    )}
                  {user.isAdmin && this.state.cod1Approvalstatus === "Pending" && (
                    <Button
                      variant="success"
                      disabled={this.validate()}
                      onClick={() => this.approveCOD1Outage()}
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
                      minDate: this.state.minDate,

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
                    <b>COA1 Outage Hours Approved: </b>
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
                        .format("HH:mm")}
                    </span>
                  </span>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <br></br>
                  {this.renderTextArea(
                    "outageReason",
                    "Reason for availing outage & Precautions / actions being taken to ensure communication system availability",
                    "True"
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <br></br>
                  {this.renderTextArea("rpcRemarks", "RPC Remarks", "True")}
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

export default LinkOutageAvailedModal;
