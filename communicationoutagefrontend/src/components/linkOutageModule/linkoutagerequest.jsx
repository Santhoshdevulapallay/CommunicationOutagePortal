import React from "react";
import Form from "../common/form";
import { getUsers } from "../../services/userService";
import { getLink } from "../../services/linkService";
import { saveLinkOutage } from "../../services/linkOutageService";

import Joi from "joi-browser";
import { toast } from "react-toastify";

import DateRangePicker from "react-bootstrap-daterangepicker";

// you will need the css that comes with bootstrap@3. if you are using
// a tool like webpack, you can do the following:
import "bootstrap/dist/css/bootstrap.css";
// you will also need the css that comes with bootstrap-daterangepicker
import "bootstrap-daterangepicker/daterangepicker.css";
import moment from "moment";
var momentDurationFormatSetup = require("moment-duration-format");

class LinkOutageRequest extends Form {
  state = {
    data: {
      description: "",

      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
      outageReason: "",
    },

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
    minDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
  };

  schema = {
    _id: Joi.string(),
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

  async populateLink() {
    try {
      const linkId = this.props.match.params.id;
      if (linkId === "new") return;
      const { data: link } = await getLink(linkId);

      this.setState({ data: this.mapTOViewModel(link) });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }

  async componentDidMount() {
    await this.populateLink();
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
    };
  }

  handleCallback = (start, end, label) => {
    this.setState({ outageStartDate: start, outageEndDate: end });
  };

  doSubmit = async () => {
    try {
      await saveLinkOutage({
        linkId: this.props.match.params.id,
        proposedStartDate: this.state.outageStartDate,
        proposedEndDate: this.state.outageEndDate,
        reasonPrecautions: this.state.data.outageReason,
      });
      this.props.history.push("/links");
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
    
        toast.error(ex.response.data);
      }
    }
  };

  render() {
    return (
      <div className="container">
        <br></br>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li
              className="breadcrumb-item active text-primary"
              aria-current="page"
            >
              {this.props.match.params.id == "new"
                ? "Create New Link"
                : "Outage Request"}
            </li>
          </ol>
        </nav>

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
            <div className="col-md-12">
              <br></br>
              {this.renderTextArea(
                "outageReason",
                "Reason for availing outage & Precautions / actions being taken to ensure communication system availability",
                ""
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
    );
  }
}

export default LinkOutageRequest;
