import React, { Component } from "react";
import {
  getCOA2Equipments,
  deleteOutage,
  approveAllCOA2Outages,
} from "../../services/equipmentOutageService";
import { DownloadApplication } from "../../services/applicationService";
import Modal from "react-bootstrap/Modal";

import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";

import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import SingleMonthPicker from "../common/monthPicker/monthPicker";
import COA2Table from "./coa2Table";
import moment from "moment";
import auth from "../../services/authService";
import SearchBox from "../common/searchBox";


class COA2 extends Component {
  state = {
    equipmentOutages: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "equipment.description", order: "asc" },
    approveAllModal: false,
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  };

  async componentDidMount() {
    try {
      const { data: equipmentOutages } = await getCOA2Equipments(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      this.setState({ equipmentOutages });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleSort = (sortColumn) => {
    this.setState({ sortColumn });
  };
  handleChange = (query) => {
    this.setState({ searchQuery: query, currentPage: 1 });
  };

  handleApproveAllClose = () => {
    this.setState({ approveAllModal: false });
  };
  handleApproveAllShow = () => {
    this.setState({ approveAllModal: true });
  };

  handleApproveAllOutages = async () => {
    try {
      await approveAllCOA2Outages(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Approved All COA2 outages for the month");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
    this.handleAMonthDissmis(this.state.mvalue);
    this.setState({ approveAllModal: false });
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      equipmentOutages: allEquipmentOutages,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allEquipmentOutages;
    if (searchQuery) {
      filtered = allEquipmentOutages.filter((c) =>
        (c.equipment.description.toLowerCase().includes(searchQuery.toLowerCase()) 
        || (c.equipment.location.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.outageType.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.reasonPrecautions.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.requestingAgency.userName.toLowerCase().includes(searchQuery.toLowerCase()))
         )
      );
    }

    var sorted = _.orderBy(filtered, [sortColumn.path, 'proposedStartDate'], [sortColumn.order, 'asc']);

    const equipmentOutages = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: equipmentOutages };
  };

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: equipmentOutages } = await getCOA2Equipments(
      value.year,
      value.month - 1
    );
    this.setState({ equipmentOutages });
  };

  handleApprovalStatusChange = (outageRequest) => {
    var equipmentOutages = [...this.state.equipmentOutages];
    const index = equipmentOutages.findIndex((o) => o._id == outageRequest._id);
    equipmentOutages[index] = outageRequest;
    this.setState({ equipmentOutages });
  };

  handleDelete = async (equipmentOutage) => {
    const allequipmentOutages = this.state.equipmentOutages;
    const equipmentOutages = allequipmentOutages.filter(
      (o) => o._id !== equipmentOutage._id
    );
    this.setState({ equipmentOutages });
    try {
      await deleteOutage(equipmentOutage);
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        this.setState({ equipmentOutages: allequipmentOutages });
      }
    }
    this.handlePageChange(this.state.currentPage);
  };

  handleDownloadCOA2 = async () => {
    try {
      await DownloadApplication(
        "COA2",
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Downloaded COA2");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in Downloading");
      }
    }
  };

  render() {
    const { length: count } = this.state.equipmentOutages; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: equipmentOutages } = this.getPagedData();

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
            {" "}
            <br></br>
          </div>
          <div className="col-2">
            <br></br>
            {user.isAdmin && (
              <Button
                variant="success"
                onClick={this.handleApproveAllShow}
                className="float-right"
              >
                Approve All
              </Button>
            )}
          </div>
          <div className="col-2">
            {" "}
            <br></br>
            <Button variant="success" onClick={() => this.handleDownloadCOA2()}>
              Download COA2 Applications
            </Button>
          </div>
        </div>
        <div className="row" style={{ margin: "10px" }}>
          <div className="className col-12">
            <br></br>

            <p>Showing {totalCount} Outage Requests in Database</p>
            <div className="row">
              <div className="col-md-12">
              <SearchBox
              value={searchQuery}
              onChange={this.handleChange}
            ></SearchBox>
              </div>
            </div>

            <COA2Table
              equipmentOutages={equipmentOutages}
              sortColumn={this.state.sortColumn}
              mvalue={this.state.mvalue}
              onSort={this.handleSort}
              onApprovalRequestChange={this.handleApprovalStatusChange}
              onDelete={this.handleDelete}
            ></COA2Table>
            <Pagination
              itemsCount={totalCount}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={this.handlePageChange}
            ></Pagination>
          </div>
        </div>
        <Modal
          show={this.state.approveAllModal}
          onHide={this.handleApproveAllClose}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Are you sure want to approve all Requests?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            This will approve all the outages with proposed timings
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleApproveAllClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.handleApproveAllOutages}>
              Approve
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default COA2;
