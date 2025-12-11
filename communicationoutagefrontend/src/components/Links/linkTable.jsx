import React, { Component, Suspense } from "react";
import Table from "../common/table";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import auth from "../../services/authService";
import { toast } from "react-toastify";
import {hideLink} from "../../services/linkService"


const LinkOutageRequestModal = React.lazy(() =>
  import( "../linkOutageModule/linkOutageRequestModal")
);
const LinkShutdownRequest = React.lazy(() =>
  import( "./linksShutdownRequest")
);


class LinkTable extends Component {
  state = {
    show: false,
    link: "",
    outageType: "",
  };
  columns = [
    {
      path: "user",
      label: "User",
    },
    {
      path: "description",
      label: "Description",
    },
    { path: "source", label: "Source" },
    { path: "destination", label: "Desination" },
    { path: "linkType", label: "Link Type" },
    { path: "pathType", label: "Path Type" },
    
    {
      key: "Planned",
      content: (link) => (
        <Button
          variant="primary"
          onClick={() => this.handleShow(link, "Planned")}
        >
          Planned
        </Button>
      ),
    },
    {
      key: "Emergency",
      content: (link) => (
        <Button
          variant="warning"
          onClick={() => this.handleShow(link, "Emergency")}
        >
          Emergency
        </Button>
      ),
    },
    {
      key: "Report Forced",
      content: (link) => (
        <Button variant="danger" onClick={() => this.handleShow(link, "Forced")}>
          Report Forced
        </Button>
      ),
    },
  ];

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


  
  deleteColumn = {
    key: "delete",
    content: (link) => (
      <Button variant="danger" onClick={() => this.handleDelete(link)}>
           <i className="fa fa-trash-o" aria-hidden="true"></i>
      </Button>
    ),
  };


  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && ((user.isAdmin || user.isSupervisor) )) {
      this.columns.push(this.editColumn);
      this.columns.push(this.deleteColumn);
    }
  }

  handleShow = (link, outageType) => {
    this.setState({ show: true, link: link, outageType: outageType });
  };

  handleDelete = async(link) => {
    if (window.confirm('Are you sure you want to delete this '+link.description)) {
      
      try {
        link = await hideLink(link._id);
        toast.success("Successfully Delete"); 
        this.props.onDeleteRow(link);
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
    }}


    }
  };

  handleClose = () => {
    this.setState({ show: false });
  };

  render() {
    // if (this.props.fromComponent == "onGoing") {
    //   this.columns.push(this.disableColumn);
    // }

    const { links, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={links}
        ></Table>
          <Suspense fallback={<div>Loading...</div>}>
        <LinkShutdownRequest
          show={this.state.show}
          OnClose={this.handleClose}
          link={this.state.link}
          outageType={this.state.outageType}
        ></LinkShutdownRequest>
        </Suspense>
      </React.Fragment>
    );
  }
}

export default LinkTable;
