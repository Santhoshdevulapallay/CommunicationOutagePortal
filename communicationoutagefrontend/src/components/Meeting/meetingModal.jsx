import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { TextField } from "formik-material-ui";
import { Button, LinearProgress } from "@material-ui/core";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { saveMeeting } from "../../services/meetingService";

import { KeyboardDatePicker } from "formik-material-ui-pickers";
import Box from "@material-ui/core/Box";
import moment from "moment";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";

import "../../modalstyle.css";

class MeetingModal extends Component {
  state = {
    show: false,
    initialValues: {
      COMSRDate: null,
      // COMSRNumber:'COMSR-',
      reqOpeningDate: null,
      reqClosingDate: null,
      shutdownMinDate: null,
      shutdownMaxDate: null,
    },
  };

  validationSchema = Yup.object({
    COMSRDate: Yup.date().required("Required").nullable(),
    // COMSRNumber: Yup.string().required('Required'),
    reqOpeningDate: Yup.date().required("Required").nullable(),
    reqClosingDate: Yup.date()
      .required("Required")
      .nullable()
      .min(
        Yup.ref("reqOpeningDate"),
        "Select later Date than Shutdown Min Date"
      ),
    shutdownMinDate: Yup.date().required("Required").nullable(),
    shutdownMaxDate: Yup.date()
      .required("Required")
      .nullable()
      .min(
        Yup.ref("shutdownMinDate"),
        "Select later Date than Shutdown Min Date"
      ),
  });
  handleSubmit = (values, onSubmitProps) => {
    setTimeout(async () => {
      values.COMSRDate = moment(values.COMSRDate).format("YYYY-MM-DD 00:00");
      values.reqOpeningDate = moment(values.reqOpeningDate).format(
        "YYYY-MM-DD 00:00"
      );
      values.reqClosingDate = moment(values.reqClosingDate).format(
        "YYYY-MM-DD 23:59"
      );
      values.shutdownMinDate = moment(values.shutdownMinDate).format(
        "YYYY-MM-DD 00:00"
      );
      values.shutdownMaxDate = moment(values.shutdownMaxDate).format(
        "YYYY-MM-DD 23:59"
      );
      try {
        const meeting = await saveMeeting(values);
        this.props.OnClose(meeting.data, "updateTable");
        toast.success("Success");
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          onSubmitProps.setSubmitting(false);
          toast.error(ex.response.data);
          onSubmitProps.setSubmitting(false);
        }
      }
    }, 500);
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    //opening other meeting
    if (
      this.props.show !== prevProps.show ||
      this.props.meeting !== prevProps.meeting
    ) {
      if (this.props.show) {
        await this.populateMeeting();
      } else {
        this.setState({ show: false });
      }
    }
  }

  async populateMeeting() {
    try {
      var initialValues = {
        COMSRDate: this.props.meeting ? this.props.meeting.COMSRDate : null,
        // COMSRNumber:this.props.meeting?this.props.meeting.COMSRNumber:"COMSR-",
        reqOpeningDate: this.props.meeting
          ? this.props.meeting.reqOpeningDate
          : null,
        reqClosingDate: this.props.meeting
          ? this.props.meeting.reqClosingDate
          : null,
        shutdownMinDate: this.props.meeting
          ? this.props.meeting.shutdownMinDate
          : null,
        shutdownMaxDate: this.props.meeting
          ? this.props.meeting.shutdownMaxDate
          : null,
      };
      debugger;
      if (this.props.meeting) {
        initialValues._id = this.props.meeting._id;
      }
      this.setState({
        show: true,
        initialValues: initialValues,
      });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={this.props.OnClose}
        aria-labelledby="example-custom-modal-styling-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="examCustom Mople-custom-modal-styling-title">
            Meeting
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
                      <div className="col-md-3"></div>
                      <div className="col-md-6">
                        <Field
                          component={KeyboardDatePicker}
                          autoOk
                          variant="inline"
                          inputVariant="outlined"
                          disablePast
                          format="MM/dd/yyyy"
                          label="COMSR"
                          name="COMSRDate"
                        />
                      </div>
                      <div className="col-md-3">
                        {/* <Field
                            component={TextField}
                            label="COMSR No"
                            name="COMSRNumber"
                            variant="outlined"
                            /> */}
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-6">
                        <Field
                          component={KeyboardDatePicker}
                          autoOk
                          variant="inline"
                          inputVariant="outlined"
                          disablePast
                          format="MM/dd/yyyy"
                          label="Request Opening"
                          name="reqOpeningDate"
                        />
                      </div>
                      <div className="col-md-6">
                        <Field
                          component={KeyboardDatePicker}
                          autoOk
                          variant="inline"
                          inputVariant="outlined"
                          disablePast
                          format="MM/dd/yyyy"
                          label="Request Closing"
                          name="reqClosingDate"
                        />
                      </div>
                    </div>
                    <br></br>
                    <div className="row">
                      <div className="col-md-6">
                        <Field
                          component={KeyboardDatePicker}
                          autoOk
                          variant="inline"
                          inputVariant="outlined"
                          disablePast
                          format="MM/dd/yyyy"
                          label="Shutdown Min"
                          name="shutdownMinDate"
                        />
                      </div>
                      <div className="col-md-6">
                        <Field
                          component={KeyboardDatePicker}
                          autoOk
                          variant="inline"
                          inputVariant="outlined"
                          disablePast
                          format="MM/dd/yyyy"
                          label="Shutdown Max"
                          name="shutdownMaxDate"
                        />
                      </div>
                    </div>

                    <br></br>
                    <div className="row">
                      <div className="col-md-3"></div>
                      <div className="col-md-6">
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={formik.isSubmitting}
                          onClick={formik.submitForm}
                        >
                          Save Meeting
                        </Button>
                      </div>
                      <div className="col-md-3"></div>
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

export default MeetingModal;
