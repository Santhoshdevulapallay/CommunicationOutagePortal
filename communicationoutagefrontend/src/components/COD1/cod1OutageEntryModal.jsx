import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { TextField } from "formik-material-ui";
import { Button, LinearProgress } from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import {
  saveCOD1Outage,
  makeNotAvailed,
} from "../../services/linkOutageService";
import auth from "../../services/authService";


import Select from "react-select";

import { KeyboardDateTimePicker } from "formik-material-ui-pickers";
import moment from "moment";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";

import "../../modalstyle.css";
var momentDurationFormatSetup = require("moment-duration-format");

class COD1OutageEntryModal extends Component {
  state = {
    show: false,
    initialValues: {
      outageStartDate: null,
      outageEndDate: null,
      approvedStartDate: null,
      approvedEndDate: null,
      proposedStartDate: null,
      proposedEndDate: null,
      outageType: "",
      outageReason: "",
      alternateChannelStatus: "",
      rpcRemarks: "",
      supervisorRemarks: "",
      description: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
    },
    minDate: new Date(),
  };

  validationSchema = Yup.object({
    outageStartDate: Yup.date().required("Required").nullable(),
    // COMSRNumber: Yup.string().required('Required'),
    outageEndDate: Yup.date()
      .required("Required")
      .nullable()
      .min(Yup.ref("outageStartDate"), "Select later Date Outage Start Date"),
  });
  handleSubmit = (values, onSubmitProps) => {
    setTimeout(async () => {
      var data = {};
      data["_id"] = this.props.cod1Outage._id;
      data["outageStartDate"] = moment(values.outageStartDate).format(
        "YYYY-MM-DD HH:mm"
      );
      data["outageEndDate"] = moment(values.outageEndDate).format(
        "YYYY-MM-DD HH:mm"
      );
      data["year"] = this.props.mvalue.year;
      data["month"] = this.props.mvalue.month;
      try {
        await saveCOD1Outage(data);
        var cod1Outage = { ...this.props.cod1Outage };

        cod1Outage.outageStartDate = values.outageStartDate.toISOString();
        cod1Outage.outageEndDate = values.outageEndDate.toISOString();
        cod1Outage.availedStatus = 1;
        this.props.OnClose("reload", cod1Outage);
        toast.success("Success");
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          onSubmitProps.setSubmitting(false);
          toast.error(ex.response.data);
        }
      }
    }, 500);
  };

  handleNotAvailed = () => {
    setTimeout(async () => {
      try {
        await makeNotAvailed(this.props.cod1Outage._id, {
          year: this.props.mvalue.year,
          month: this.props.mvalue.month,
        });
        var cod1Outage = { ...this.props.cod1Outage };
        cod1Outage.outageStartDate = "";
        cod1Outage.outageEndDate = "";
        cod1Outage.availedStatus = 2;
        this.props.OnClose("reload", cod1Outage);
        toast.success("Success");
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
        }
      }
    }, 500);
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    //opening other Link
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

  async populateLinkOutage() {
    try {
      const cod1Outage = this.props.cod1Outage;
      var initialValues = { ...this.state.initialValues };
      if (cod1Outage.outageType == "Planned") {
        initialValues.approvedStartDate = new Date(
          cod1Outage.approvedStartDate
        );
        initialValues.approvedEndDate = new Date(cod1Outage.approvedEndDate);
      } else {
        initialValues.approvedStartDate = null;
        initialValues.approvedEndDate = null;
      }
      if (
        cod1Outage.outageType == "Planned" ||
        cod1Outage.outageType == "Emergency"
      ) {
        initialValues.proposedStartDate = new Date(
          cod1Outage.proposedStartDate
        );
        initialValues.proposedEndDate = new Date(cod1Outage.proposedEndDate);
      } else {
        initialValues.proposedStartDate = null;
        initialValues.proposedEndDate = null;
      }
      initialValues.outageStartDate = cod1Outage.outageStartDate
        ? new Date(cod1Outage.outageStartDate)
        : null;
      initialValues.outageEndDate = cod1Outage.outageEndDate
        ? new Date(cod1Outage.outageEndDate)
        : null;

      var ownerList = [];
      for (var i = 0; i < cod1Outage.link["ownership"].length; i++) {
        ownerList.push({
          value: cod1Outage.link["ownership"][i],
          label: cod1Outage.link["ownership"][i],
        });
      }
      initialValues._id = cod1Outage.link._id;
      initialValues.description = cod1Outage.link.description;
      initialValues.source = cod1Outage.link.source;
      initialValues.destination = cod1Outage.link.destination;
      initialValues.channelRouting = cod1Outage.link.channelRouting;
      initialValues.ownership = ownerList;
      initialValues.outageType = cod1Outage.outageType;
      initialValues.outageReason = cod1Outage.reasonPrecautions;
      initialValues.alternateChannelStatus = cod1Outage.alternateChannelStatus;
      initialValues.rpcRemarks = cod1Outage.rpcRemarks;
      initialValues.supervisorRemarks = cod1Outage.supervisorRemarks;

      this.setState({
        initialValues: initialValues,
        show: true,
        minDate: new Date(
          this.props.mvalue.year,
          this.props.mvalue.month - 1,
          1
        ),
      });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  render() {
    const user = auth.getCurrentUser();
    return (
      <Modal
        show={this.state.show}
        onHide={this.props.OnClose}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="examCustom Mople-custom-modal-styling-title">
            {this.state.initialValues.outageType + " Outage"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <br></br>

            <Formik
              initialValues={this.state.initialValues}
              validationSchema={this.validationSchema}
              onSubmit={this.handleSubmit}
            >
              {(formik) => (
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <Form onSubmit={formik.handleSubmit}>
                    {formik.isSubmitting && <LinearProgress />}
                    {console.log()}
                    <div className="row">
                      <div className="col-md-3">
                        <Field
                          component={KeyboardDateTimePicker}
                          autoOk
                          ampm={false}
                          variant="inline"
                          inputVariant="outlined"
                          minDate={this.state.minDate}
                          format="MM/dd/yyyy HH:mm"
                          label="Outage Start Date"
                          name="outageStartDate"
                        />
                      </div>
                      <div className="col-md-3">
                        <Field
                          component={KeyboardDateTimePicker}
                          autoOk
                          ampm={false}
                          variant="inline"
                          inputVariant="outlined"
                          minDate={this.state.minDate}
                          format="MM/dd/yyyy HH:mm"
                          label={"Outage End Date"}
                          name="outageEndDate"
                        />
                      </div>
                      <div className="col-md-3">
                        <span>
                          <b>Outage Hours Reported: </b>

                          <span
                            className="badge badge-danger"
                            style={{ fontSize: "15px" }}
                          >
                            {(!formik.dirty ||
                              formik.values.outageStartDate !=
                                formik.initialValues.outageStartDate ||
                              formik.values.outageEndDate !=
                                formik.initialValues.outageEndDate) && (
                              <span>
                                {" "}
                                {moment
                                  .duration(
                                    moment(formik.values.outageEndDate).diff(
                                      moment(formik.values.outageStartDate)
                                    )
                                  )
                                  .format("HH:mm")}
                              </span>
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="col-md-3">
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={formik.isSubmitting}
                          onClick={formik.submitForm}
                          disabled={(user.isAdmin || user.isSupervisor)?false: this.props.freezeStatus}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                    <br></br>
                    {this.props.cod1Outage.outageType == "Planned" && (
                      <div className="row">
                        <div className="col-md-3">
                          <Field
                            component={KeyboardDateTimePicker}
                            autoOk
                            disabled={true}
                            ampm={false}
                            variant="inline"
                            inputVariant="outlined"
                            minDate={this.state.minDate}
                            format="MM/dd/yyyy HH:mm"
                            label="Approved Start Date"
                            name="approvedStartDate"
                          />
                        </div>
                        <div className="col-md-3">
                          <Field
                            component={KeyboardDateTimePicker}
                            autoOk
                            disabled={true}
                            ampm={false}
                            variant="inline"
                            inputVariant="outlined"
                            minDate={this.state.minDate}
                            format="MM/dd/yyyy HH:mm"
                            label={"Approved End Date"}
                            name="approvedEndDate"
                          />
                          <br></br>
                        </div>
                        <div className="col-md-3">
                          <span>
                            <b>Outage Hours Approved: </b>

                            <span
                              className="badge badge-danger"
                              style={{ fontSize: "15px" }}
                            >
                              {moment
                                .duration(
                                  moment(formik.values.approvedEndDate).diff(
                                    moment(formik.values.approvedStartDate)
                                  )
                                )
                                .format("HH:mm")}
                            </span>
                          </span>
                        </div>
                        <div className="col-md-3"></div>
                      </div>
                    )}
                    <br></br>
                    {this.props.cod1Outage.outageType != "Forced" && (
                      <div className="row">
                        <div className="col-md-3">
                          <Field
                            component={KeyboardDateTimePicker}
                            autoOk
                            disabled={true}
                            ampm={false}
                            variant="inline"
                            inputVariant="outlined"
                            minDate={this.state.minDate}
                            format="MM/dd/yyyy HH:mm"
                            label="Propsed Start Date"
                            name="proposedStartDate"
                          />
                        </div>
                        <div className="col-md-3">
                          <Field
                            component={KeyboardDateTimePicker}
                            autoOk
                            disabled={true}
                            ampm={false}
                            variant="inline"
                            inputVariant="outlined"
                            minDate={this.state.minDate}
                            format="MM/dd/yyyy HH:mm"
                            label={"Proposed End Date"}
                            name="proposedEndDate"
                          />
                        </div>
                        <div className="col-md-3">
                          <span>
                            <b>Outage Hours Proposed: </b>

                            <span
                              className="badge badge-danger"
                              style={{ fontSize: "15px" }}
                            >
                              {moment
                                .duration(
                                  moment(formik.values.proposedEndDate).diff(
                                    moment(formik.values.proposedStartDate)
                                  )
                                )
                                .format("HH:mm")}
                            </span>
                          </span>
                        </div>
                        <div className="col-md-3"></div>
                      </div>
                    )}
                    <br></br>
                    <div className="row">
                      <div className="col-md-5">
                        <Field
                          component={TextField}
                          label="SRPC Remarks"
                          name="rpcRemarks"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-5">
                        <Field
                          component={TextField}
                          label="SRLDC Remarks"
                          name="supervisorRemarks"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-2">
                        <Button
                          variant="contained"
                          color="secondary"
                          disabled={formik.isSubmitting}
                          onClick={this.handleNotAvailed}
                          disabled={this.props.freezeStatus}
                        >
                          Not Availed
                        </Button>
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-6">
                        <Field
                          component={TextField}
                          label="Outage Reaseon"
                          name="outageReason"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <Field
                          component={TextField}
                          label="Alternate Channel Status"
                          name="alternateChannelStatus"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-6">
                        <Field
                          component={TextField}
                          label="Description"
                          name="description"
                          variant="outlined"
                          InputProps={{ notched: true }}
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-3">
                        <Field
                          component={TextField}
                          label="Source"
                          name="source"
                          variant="outlined"
                          InputProps={{ notched: true }}
                          multiline={true}
                          fullWidth={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-3">
                        <Field
                          component={TextField}
                          label="Destination"
                          name="destination"
                          variant="outlined"
                          InputProps={{ notched: true }}
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-6">
                        <Field
                          component={TextField}
                          label="Channel Routing"
                          name="channelRouting"
                          variant="outlined"
                          InputProps={{ notched: true }}
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        OwnerList
                        <Select
                          defaultValue={this.state.initialValues.ownership}
                          isMulti
                          name="colors"
                          options={this.state.initialValues.ownership}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          isDisabled={true}
                        />
                      </div>
                    </div>
                    <br></br>
                  </Form>
                </MuiPickersUtilsProvider>
              )}
            </Formik>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

export default COD1OutageEntryModal;
