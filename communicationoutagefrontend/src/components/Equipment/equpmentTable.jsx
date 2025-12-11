import React, { Component, Suspense } from "react";
import Table from "../common/table";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";

import auth from "../../services/authService";
import { getLinks } from './../../services/linkService';
import { toast } from 'react-toastify';
import {hideEquipment} from "../../services/equipmentService"


const EquipmentShutdownRequest = React.lazy(() =>
  import( "./equipmentShutdownRequest")
);



class EquipmentTable extends Component {
  state = {
    show: false,
    equipment: "",
    outageType: "",
    links: [],
  };
  columns = [
    {
      path: "user",
      label: "Owner",
    },
    {
      path: "description",
      label: "Description",
    },
    { path: "location", label: "Location" },
    {
      key: "Planned",
      content: (equipment) => (
        <Button
          variant="primary"
          onClick={() => this.handleShow(equipment, "Planned")}
        >
          Planned
        </Button>
      ),
    },
    {
      key: "Emergency",
      content: (equipment) => (
        <Button
          variant="warning"
          onClick={() => this.handleShow(equipment, "Emergency")}
        >
          Emergency
        </Button>
      ),
    },
    {
      key: "Report Forced",
      content: (equipment) => (
        <Button variant="danger" onClick={() => this.handleShow(equipment, "Forced")}>
          Report Forced
        </Button>
      ),
    },
  ];


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

  deleteColumn = {
    key: "delete",
    content: (equipment) => (
      <Button variant="danger" onClick={() => this.handleDelete(equipment)}>
           <i className="fa fa-trash-o" aria-hidden="true"></i>
      </Button>
    ),
  };


  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && (user.isAdmin || user.isSupervisor)) {
      this.columns.push(this.editColumn);
      this.columns.push(this.deleteColumn);
    }
  }

  async componentDidMount() {
    try {
      const { data: links } = await getLinks();
      this.setState({ links });
      
    } catch (ex) {
      if (ex.response && ex.response.status >= 404) {
        toast.error("Links not Fetched");
      }
    }
  }


  handleShow = (equipment, outageType) => {
    this.setState({ show: true, equipment: equipment, outageType: outageType });
  };
  handleClose = () => {
    this.setState({ show: false });
  };

  handleDelete = async(equipment) => {
    if (window.confirm('Are you sure you want to delete this '+equipment.description)) {

      try {
        equipment = await hideEquipment(equipment._id);
        toast.success("Successfully Deleted"); 
        this.props.onDeleteRow(equipment);
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
    }}


    }
  };

  render() {
    // if (this.props.fromComponent == "onGoing") {
    //   this.columns.push(this.disableColumn);
    // }
    const { equipments, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
        columns={this.columns}
        sortColumn={sortColumn}
        onSort={onSort}
        data={equipments}
        ></Table>
        <Suspense fallback={<div>Loading...</div>}>
        <EquipmentShutdownRequest
          show={this.state.show}
          OnClose={this.handleClose}
          equipment={this.state.equipment}
          outageType={this.state.outageType}
          links={this.state.links}
        ></EquipmentShutdownRequest>
        </Suspense>
      </React.Fragment>
      
    );
  }
}

export default EquipmentTable;
