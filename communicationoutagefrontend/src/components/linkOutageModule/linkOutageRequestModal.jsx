import React from "react";
import Modal from "react-bootstrap/Modal";
import Joi from "joi-browser";
import { toast } from "react-toastify";
import Form from "../common/form";
import { getLink } from "../../services/linkService";
import { saveLinkOutage } from "../../services/linkOutageService";
import { getlatestMeetingNo } from "../../services/meetingService";
import DateRangePicker from "react-bootstrap-daterangepicker";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css";
import "../../modalstyle.css";

import moment from "moment";
// var momentDurationFormatSetup = require("moment-duration-format");

class LinkOutageRequestModal extends Form {
  state = {
    data: {
      description: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
      Daily_Continous: { label: "Continous", value: "Continous" },
      outageReason: "",
      
    },

    errors: {},
    COMSR_Meeting_No:{},
    COMSR_Meeting_Options:[],
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
    minDate: new Date(),
    show: false
  };

  async componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    debugger
    if ( (this.props.linkId !== prevProps.linkId) ||(this.props.outageType!==prevProps.outageType)  ||( this.props.show !== prevProps.show) ) {
      if (this.props.show) {
        await this.populateLink();
      } else {
        this.setState({ show: false });
      }
     
    }
  }

  schema = {
    outageReason: Joi.string()
      .required()
      .label(
        "Reason for availing outage & Precautions / actions being taken to ensure communication system availability"
      ),
  };

  async populateLink() {
    try {
      const linkId = this.props.linkId;
      debugger;
      if (linkId === "new") return;
      const { data: link } = await getLink(linkId);
      this.populateMeetingOptions();
      var minDate=this.props.outageType=="Emergency"?  new Date(): new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      var outageStartDate= this.props.outageType=="Emergency"?  new Date(): new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      var outageEndDate= this.props.outageType=="Emergency"?  new Date(new Date().setDate(new Date().getDate()+6)): new Date(new Date().getFullYear(), new Date().getMonth() + 1, 2);
      
      // this.handleCallback(outageStartDate, outageEndDate);
      this.setState({ data: this.mapTOViewModel(link), outageStartDate: outageStartDate, outageEndDate: outageEndDate, minDate:minDate, show: true,  });


    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  async populateMeetingOptions(){
    try {
      const { data: MeetingOptions } = await getlatestMeetingNo();
      var COMSR_Meeting_Options = [];
      for (var i = 1; i <= MeetingOptions["COMSRNumber"]; i++) {
        COMSR_Meeting_Options.push({
          value: i,
          label:"COMSR-"+i,
        });
      }
      this.setState({COMSR_Meeting_Options:COMSR_Meeting_Options});

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
      Daily_Continous: this.state.data.Daily_Continous,
    };
  }

  handleCallback = (start, end, label) => {
    debugger
    this.setState({ outageStartDate: start, outageEndDate: end });
  };

  doSubmit = async () => {
    try {
      debugger;
      await saveLinkOutage({
        linkId: this.props.linkId,
        proposedStartDate: this.state.outageStartDate,
        proposedEndDate: this.state.outageEndDate,
        reasonPrecautions: this.state.data.outageReason,
        outageType: this.props.outageType,
        Daily_Continous: this.state.data.Daily_Continous.value,
      });
      toast.success("Successfully Applied Outage");
      this.props.OnClose();
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
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
          <Modal.Title id="example-custom-modal-styling-title">
            Apply for {this.props.outageType} Outage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <br></br>

            <form onSubmit={this.handleSubmit}>
              <div className="row">
                <div className="col-md-6">
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
                      parentEl: ".linkoutageapprovalmodalclass",
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
                <div className="col-md-2 align-self-end">
                  {" "}
                  {this.renderButton("Submit Outage Request")}
                </div>
              </div>

              <div className="row">
                <div className="col-md-10">
                  <br></br>
                  {this.renderTextArea(
                    "outageReason",
                    "Reason for availing outage & Precautions / actions being taken to ensure communication system availability",
                    ""
                  )}
                </div>
                <div className="col-md-2">
                  <br></br>
                  {this.renderSelect("COMSR_Meeting_Options", "COMSR_Meeting_Options", this.state.COMSR_Meeting_Options)}
                  <br></br>
                  {this.renderSelect("Daily_Continous", "Daily/continous", [
                    { label: "Continous", value: "Continous" },
                    { label: "Daily", value: "Daily" },
                  ])}
                  
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

export default LinkOutageRequestModal;
