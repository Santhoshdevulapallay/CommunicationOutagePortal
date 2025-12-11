import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { TextField } from "formik-material-ui";
import { Button, LinearProgress } from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { getlatestMeetingNo } from "../../services/meetingService";
import { saveLinkOutage } from "../../services/linkOutageService";

import Select from "react-select";

import { KeyboardDateTimePicker } from "formik-material-ui-pickers";
import moment from "moment";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";

import "../../modalstyle.css";
import { data } from "jquery";
var momentDurationFormatSetup = require("moment-duration-format");

class LinksShutdownRequest extends Component {
  state = {
    show: false,
    initialValues: {
      proposedStartDate: null,
      proposedEndDate: null,
      outageReason: "",
      alternateChannelStatus: "",
      description: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
    },
    COMSR_Meeting_Options: [],
    COMSR_Meeting_No: {},
    Daily_Continous_Options: [
      { label: "Continous", value: "Continous" },
      // { label: "Daily", value: "Daily" },
    ],
    Daily_Continous_Type: { label: "Continous", value: "Continous" },
    minDate: new Date(),
  };

  validationSchema = Yup.object({
    proposedStartDate: Yup.date().required("Required").nullable(),
    // COMSRNumber: Yup.string().required('Required'),
    proposedEndDate: Yup.date()
      .required("Required")
      .nullable()
      .min(Yup.ref("proposedStartDate"), "Select later Date Start Date"),
    outageReason: Yup.string().required(
      "Reasons for Outage & Precautions / actions being taken to ensure communication system availability"
    ),
    alternateChannelStatus: Yup.string().required(
      "Alternate Channel Status required"
    ),
  });
  handleSubmit = (values, onSubmitProps) => {
    setTimeout(async () => {
      var data = {};
      data["link"] = values._id;
      data["outageType"] = this.props.outageType;
      data["reasonPrecautions"] = values.outageReason;
      data["alternateChannelStatus"] = values.alternateChannelStatus;
      data["Daily_Continous_Type"] = this.state.Daily_Continous_Type.value;
      data["COMSRNumber"] = this.state.COMSR_Meeting_No.value;
      if (
        this.props.outageType == "Planned" ||
        this.props.outageType == "Emergency"
      ) {
        data["proposedStartDate"] = moment(values.proposedStartDate).format(
          "YYYY-MM-DD HH:mm"
        );
        data["proposedEndDate"] = moment(values.proposedEndDate).format(
          "YYYY-MM-DD HH:mm"
        );
      } else {
        data["outageStartDate"] = moment(values.proposedStartDate).format(
          "YYYY-MM-DD HH:mm"
        );
        data["outageEndDate"] = moment(values.proposedEndDate).format(
          "YYYY-MM-DD HH:mm"
        );
        data["availedStatus"] = 1;
      }
      try {
        const linkOutage = await saveLinkOutage(data);
        this.props.OnClose();
        toast.success("Success");
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
          onSubmitProps.setSubmitting(false);
        }
      }
    }, 500);
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    //opening other Link
    if (
      this.props.link !== prevProps.link ||
      this.props.outageType !== prevProps.outageType ||
      this.props.show !== prevProps.show
    ) {
      if (this.props.show) {
        await this.populateLink();
      } else {
        this.setState({ show: false });
      }
    }
  }

  async populateLink() {
    try {
      if (this.props.outageType == "Planned")
        await this.populateMeetingOptions();
      await this.handleMinDate();
      this.setState({
        initialValues: this.mapTOViewModel(this.props.link),
        show: true,
      });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  handleMinDate = () => {
    debugger;
    if (this.props.outageType == "Forced") {
      var date = new Date();
      //enabling last month days before 10th date
      if (date.getDate() < 23) {
        date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      } else {
        date = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      // this.setState({ minDate: new Date(2020, 11, 1) });
      this.setState({ minDate: date });
    } else if (this.props.outageType == "Emergency") {
      this.setState({
        minDate: new Date().setHours(new Date().getHours() + 24),
      });
    } else {
      this.setState({ minDate: new Date() });
    }
  };

  async populateMeetingOptions() {
    try {
      const { data: MeetingOptions } = await getlatestMeetingNo();
      var COMSR_Meeting_Options = [];
      for (var i = 1; i <= MeetingOptions["COMSRNumber"]; i++) {
        COMSR_Meeting_Options.push({
          value: i,
          label: "COMSR-" + i,
        });
      }
      var COMSR_Meeting_No =
        COMSR_Meeting_Options[COMSR_Meeting_Options.length - 1];
      this.setState({
        COMSR_Meeting_Options: COMSR_Meeting_Options,
        COMSR_Meeting_No: COMSR_Meeting_No,
      });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  mapTOViewModel(link) {
    var ownerList = [];
    for (var i = 0; i < link["ownership"].length; i++) {
      ownerList.push({
        value: link["ownership"][i],
        label: link["ownership"][i],
      });
    }
    return {
      _id: link._id,
      description: link.description,
      source: link.source,
      destination: link.destination,
      channelRouting: link.channelRouting,
      ownership: ownerList,
      proposedStartDate: null,
      proposedEndDate: null,
      outageReason: "",
      alternateChannelStatus: "",
    };
  }
  handleDailyContinousChange = (selectedOption) => {
    this.setState({ Daily_Continous_Type: selectedOption });
  };
  handleCOMSRMeetingNoChange = (selectedOption) => {
    this.setState({ COMSR_Meeting_No: selectedOption });
  };

  render() {
    var outageText = "Proposed";
    if (this.props.outageType == "Forced") outageText = "Outage";
    return (
      <Modal
        show={this.state.show}
        onHide={this.props.OnClose}
        dialogClassName="modal-90w"
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="examCustom Mople-custom-modal-styling-title">
            {this.props.outageType}
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
                          label={outageText + " Start Date"}
                          name="proposedStartDate"
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
                          label={outageText + " End Date"}
                          name="proposedEndDate"
                        />
                      </div>
                      <div className="col-md-3">
                        <span>
                          {this.props.outageType == "Forced" && (
                            <b>Outage Hours Reported: </b>
                          )}
                          {this.props.outageType != "Forced" && (
                            <b>Outage Hours Proposed: </b>
                          )}

                          <span
                            className="badge badge-danger"
                            style={{ fontSize: "15px" }}
                          >
                            {(formik.values.proposedStartDate !=
                              formik.initialValues.proposedStartDate ||
                              formik.values.proposedEndDate !=
                                formik.initialValues.proposedEndDate) && (
                              <span>
                                {" "}
                                {moment
                                  .duration(
                                    moment(formik.values.proposedEndDate).diff(
                                      moment(formik.values.proposedStartDate)
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
                        >
                          Submit
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
                        />
                      </div>
                      <div className="col-md-3">
                        {(this.props.outageType == "Planned" ||
                          this.props.outageType == "Emergency") && (
                          <Select
                            className="basic-single"
                            classNamePrefix="select"
                            defaultValue={this.state.Daily_Continous_Type}
                            isSearchable={true}
                            name="Daily_Continous_Type"
                            options={this.state.Daily_Continous_Options}
                            onChange={this.handleDailyContinousChange}
                          />
                        )}
                      </div>
                      <div className="col-md-3">
                        {this.props.outageType == "Planned" && (
                          <Select
                            className="basic-single"
                            classNamePrefix="select"
                            defaultValue={this.state.COMSR_Meeting_No}
                            isSearchable={true}
                            name="COMSR_Meeting_No"
                            options={this.state.COMSR_Meeting_Options}
                            onChange={this.handleCOMSRMeetingNoChange}
                          />
                        )}
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-12">
                        <Field
                          component={TextField}
                          label="Alternate Channel Status"
                          name="alternateChannelStatus"
                          variant="outlined"
                          fullWidth={true}
                          multiline={true}
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

export default LinksShutdownRequest;
