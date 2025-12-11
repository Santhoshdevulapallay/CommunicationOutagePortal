import React, { Component } from "react";
import Table from "../../common/table";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import auth from "../../../services/authService";

import {equipmentRequestApproval} from "../../../services/equipmentService"
import { toast } from "react-toastify";


class EquipmentRequestTable extends Component {
  columns = [
    {
        path: "description",
        label: "Description",
      },
    { path: "location", label: "Location" },
    { path: "ownership", label: "ownership" },
    
  ];
  approveButton = {
    key: "ApproveButton",
    content: (equipment) => (
      <span>      
          <Button
            variant="success"
            onClick={() => this.handleApprove(equipment, "approve")}
          >
            <i class="fa fa-check" aria-hidden="true"></i>
          </Button>
      </span>
    ),
  };

  rejectButton = {
    key: "RejectButton",
    content: (equipment) => (
      <span>      
          <Button
            variant="danger"
            onClick={() => this.handleApprove(equipment, "reject")}
          >
            <i class="fa fa-window-close danger" aria-hidden="true"></i>
          </Button>
      </span>
    ),
  };


  editColumn = {
    key: "edit",
    content: (equipment) => (
      <Link to={`/equipments/${equipment._id}`}>
        <span className="badge badge-secondary">
          <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
        </span>
      </Link>
    ),
  };

  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && ( user.isAdmin || user.isSupervisor)) {
      this.columns.push(this.approveButton);
      this.columns.push(this.rejectButton);
      this.columns.push(this.editColumn);
    }
  }

  handleApprove=async(equipment, action)=>{
    try {
        await equipmentRequestApproval(equipment._id, action);
        if(action=="reject")
        {
          toast.error("Successfully Rejected the element"); 
        }
        else{
          toast.success("Successfully Added to the Database"); 
        }
        
        this.props.onApprove(equipment);
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
    }}
  }

  render() {

    const { equipments, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={equipments}
        ></Table>
          
      </React.Fragment>
    );
  }
}

export default EquipmentRequestTable;
