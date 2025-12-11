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
  saveCOD2Outage,
  makeNotAvailed,
} from "../../services/equipmentOutageService";
import auth from "../../services/authService";


import Select from "react-select";

import { KeyboardDateTimePicker } from "formik-material-ui-pickers";
import moment from "moment";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";

import "../../modalstyle.css";
var momentDurationFormatSetup = require("moment-duration-format");

class COD2OutageEntryModal extends Component {
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
      linksAffected: "",
      alternateChannelPathStatus: "",
      rpcRemarks: "",
      supervisorRemarks: "",
      description: "",
      location: "",
      ownership: [],
    },
    minDate: new Date(),
  };

  validationSchema = Yup.object({
    outageStartDate: Yup.date().required("Required").nullable(),
    outageEndDate: Yup.date()
      .required("Required")
      .nullable()
      .min(Yup.ref("outageStartDate"), "Select later Date Outage Start Date"),
  });
  handleSubmit = (values, onSubmitProps) => {
    setTimeout(async () => {
      var data = {};
      data["_id"] = this.props.cod2Outage._id;
      data["outageStartDate"] = moment(values.outageStartDate).format(
        "YYYY-MM-DD HH:mm"
      );
      data["outageEndDate"] = moment(values.outageEndDate).format(
        "YYYY-MM-DD HH:mm"
      );
      data["year"] = this.props.mvalue.year;
      data["month"] = this.props.mvalue.month;
      try {
        await saveCOD2Outage(data);
        var cod2Outage = { ...this.props.cod2Outage };

        cod2Outage.outageStartDate = values.outageStartDate.toISOString();
        cod2Outage.outageEndDate = values.outageEndDate.toISOString();
        cod2Outage.availedStatus = 1;
        this.props.OnClose("reload", cod2Outage);
        toast.success("Success");
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
          onSubmitProps.setSubmitting(false);
        }
      }
    }, 500);
  };

  handleNotAvailed = () => {
    setTimeout(async () => {
      try {
        await makeNotAvailed(this.props.cod2Outage._id, {
          year: this.props.mvalue.year,
          month: this.props.mvalue.month,
        });
        var cod2Outage = { ...this.props.cod2Outage };
        cod2Outage.outageStartDate = "";
        cod2Outage.outageEndDate = "";
        cod2Outage.availedStatus = 2;
        this.props.OnClose("reload", cod2Outage);
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
      this.props.cod2Outage !== prevProps.cod2Outage
    ) {
      if (this.props.show) {
        await this.populateEquipmentOutage();
      } else {
        this.setState({ show: false });
      }
    }
  }

  async populateEquipmentOutage() {
    try {
      const cod2Outage = this.props.cod2Outage;
      var initialValues = { ...this.state.initialValues };
      if (cod2Outage.outageType == "Planned") {
        initialValues.approvedStartDate = new Date(
          cod2Outage.approvedStartDate
        );
        initialValues.approvedEndDate = new Date(cod2Outage.approvedEndDate);
      } else {
        initialValues.approvedStartDate = null;
        initialValues.approvedEndDate = null;
      }
      if (
        cod2Outage.outageType == "Planned" ||
        cod2Outage.outageType == "Emergency"
      ) {
        initialValues.proposedStartDate = new Date(
          cod2Outage.proposedStartDate
        );
        initialValues.proposedEndDate = new Date(cod2Outage.proposedEndDate);
      } else {
        initialValues.proposedStartDate = null;
        initialValues.proposedEndDate = null;
      }
      initialValues.outageStartDate = cod2Outage.outageStartDate
        ? new Date(cod2Outage.outageStartDate)
        : null;
      initialValues.outageEndDate = cod2Outage.outageEndDate
        ? new Date(cod2Outage.outageEndDate)
        : null;

      var ownerList = [];
      for (var i = 0; i < cod2Outage.equipment["ownership"].length; i++) {
        ownerList.push({
          value: cod2Outage.equipment["ownership"][i],
          label: cod2Outage.equipment["ownership"][i],
        });
      }

      initialValues._id = cod2Outage.equipment._id;
      initialValues.description = cod2Outage.equipment.description;
      initialValues.location = cod2Outage.equipment.location;
      initialValues.ownership = ownerList;
      initialValues.outageType = cod2Outage.outageType;
      initialValues.outageReason = cod2Outage.reasonPrecautions;
      initialValues.linksAffected = this.getLinksAffectedText(cod2Outage);
      initialValues.alternateChannelPathStatus =
        cod2Outage.alternateChannelPathStatus;
      initialValues.rpcRemarks = cod2Outage.rpcRemarks;
      initialValues.supervisorRemarks = cod2Outage.supervisorRemarks;

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
                    {this.props.cod2Outage.outageType == "Planned" && (
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
                    {this.props.cod2Outage.outageType != "Forced" && (
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
                      <div className="col-md-4">
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
                      <div className="col-md-4">
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
                      <div className="col-md-4">
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
                          label="Alternate Channel Path Available"
                          name="alternateChannelPathStatus"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
                          disabled
                        />
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-12"></div>
                      <Field
                        component={TextField}
                        label="Links Affected"
                        name="linksAffected"
                        variant="outlined"
                        fullWidth={true}
                        multiline={true}
                        disabled
                      />
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

                      <div className="col-md-6">
                        <Field
                          component={TextField}
                          label="Location"
                          name="location"
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
                      <div className="col-md-12">
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

export default COD2OutageEntryModal;
