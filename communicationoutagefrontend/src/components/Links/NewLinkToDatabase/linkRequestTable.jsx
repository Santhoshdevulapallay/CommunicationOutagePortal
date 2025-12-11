import React, { Component } from "react";
import Table from "../../common/table";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import auth from "../../../services/authService";

import {linkRequestApproval} from "../../../services/linkService"
import { toast } from "react-toastify";


class LinkRequestTable extends Component {
  columns = [
    {
      path: "description",
      label: "Description",
    },
    { path: "source", label: "Source" },
    { path: "destination", label: "Desination" },
    { path: "channelRouting", label: "channelRouting" },
    { path: "ownership", label: "ownership" },
    
  ];
  approveButton = {
    key: "ApproveButton",
    content: (link) => (
      <span>      
          <Button
            variant="success"
            onClick={() => this.handleApprove(link, "approve")}
          >
            <i class="fa fa-check" aria-hidden="true"></i>
          </Button>
      </span>
    ),
  };
  rejectButton = {
    key: "RejectButton",
    content: (link) => (
      <span>      
          <Button
            variant="danger"
            onClick={() => this.handleApprove(link, "reject")}
          >
            <i class="fa fa-window-close danger" aria-hidden="true"></i>
          </Button>
      </span>
    ),
  };

  editColumn = {
    key: "edit",
    content: (link) => (
      <Link to={`/links/${link._id}`}>
        <span className="badge badge-secondary">
          <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
        </span>
      </Link>
    ),
  };

  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && (user.isAdmin || user.isSupervisor)) {
      this.columns.push(this.approveButton);
      this.columns.push(this.editColumn);
    }
  }

  handleApprove=async(link, action)=>{
    try {
        await linkRequestApproval(link._id, action);
        if(action=="reject")
        {
          toast.error("Successfully Rejected the element"); 
        }
        else{
          toast.success("Successfully Added to the Database"); 
        }
        toast.success("Successfully Added to the Database"); 
        this.props.onApprove(link);
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
    }}
  }

  render() {

    const { links, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={links}
        ></Table>
          
      </React.Fragment>
    );
  }
}

export default LinkRequestTable;
