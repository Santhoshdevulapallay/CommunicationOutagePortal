import React, { Component } from "react";
import { DownloadApplication } from "../../services/applicationService";

import _ from "lodash";

import Button from "react-bootstrap/Button";

import { toast } from "react-toastify";
import SingleMonthPicker from "../common/monthPicker/monthPicker";

class COD4 extends Component {
  state = {
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    },
    shouldHide: true
  };

  
  
  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
  };

  
  
   handleDownloadCOD4=async()=>{
     try {
         this.setState({shouldHide: false});
       const x=await DownloadApplication(
         "COD4",
         this.state.mvalue.year,
         this.state.mvalue.month
       );
       toast.success("Succesfully Downloaded COD4");
       this.setState({shouldHide: true});
    } catch (ex) {
     if (ex.response && ex.response.status !== 404) {
       toast.error("Error in Downloading");
     }
   }
   }


  render() {
  
    return (
      <div className="fluid-container">
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
                <div className={this.state.shouldHide ? 'hidden' : ''}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif" />

            </div>
          
          </div>
          <div className="col-2">  <br></br>
            <Button
              variant="success"
              onClick={() => this.handleDownloadCOD4()}
            >
              Download COD4 Applications
            </Button></div>
          
          <div className="col-3">
           
          </div>
        </div>
       
      
      </div>
    );
  }
}

export default COD4;
