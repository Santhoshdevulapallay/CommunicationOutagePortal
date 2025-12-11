import React, { Component } from "react";
import { DownloadApplication } from "../../services/applicationService";

import _ from "lodash";

import Button from "react-bootstrap/Button";

import { toast } from "react-toastify";
import SingleMonthPicker from "../common/monthPicker/monthPicker";

class COD3 extends Component {
  state = {
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
    selectedReport: "COD3",
    shouldHide: true,
  };

  constructor() {
    super();
    this.onChangeValue = this.onChangeValue.bind(this);
  }

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
  };

  handleDownload = async () => {
    try {
      this.setState({ shouldHide: false });
      const x = await DownloadApplication(
        this.state.selectedReport,
        this.state.mvalue.year,
        this.state.mvalue.month
      );
      toast.success("Succesfully Downloaded COD3");
      this.setState({ shouldHide: true });
    } catch (ex) {
      if (ex.response && ex.response.status !== 404) {
        toast.error("Error in Downloading");
      }
    }
  };

  onChangeValue(event) {
    this.setState({ selectedReport: event.target.value });
  }

  render() {
    return (
      <div className="fluid-container">
        <br></br>
        <div className="col-md-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li
                className="breadcrumb-item active text-primary"
                aria-current="page"
              >
                Download 12 Months Rolling Report
              </li>
            </ol>
          </nav>
        </div>

        <div className="row">
          <div className="col-1"></div>

          <div className="col-4">
            <br></br>
            <SingleMonthPicker
              mvalue={this.state.mvalue}
              onDismiss={this.handleAMonthDissmis}
            />
          </div>

          <div className="col-2">
            <div className={this.state.shouldHide ? "hidden" : ""}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif" />
            </div>
          </div>

          <div className="col-3"></div>
        </div>
        <br></br>
        <div className="row">
          <div className="col-2"></div>
          <div className="col-3">
            <div onChange={this.onChangeValue}>
              <input
                type="radio"
                value="COD3"
                name="gender"
                checked={this.state.selectedReport === "COD3"}
              />{" "}
              COD3(Links){" "}
              <input
                type="radio"
                value="COD4"
                name="gender"
                checked={this.state.selectedReport === "COD4"}
              />{" "}
              COD4(Equipments)
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-2"></div>
          <div className="col-2">
            {" "}
            <br></br>
            <Button variant="success" onClick={() => this.handleDownload()}>
              Download Rolling 12 Months Report
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default COD3;
