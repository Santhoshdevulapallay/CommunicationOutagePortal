import React, { Component } from "react";
import {
  getCOA1Links,
  deleteOutage,
  approveAllCOA1Outages,
} from "../../services/linkOutageService";
import { DownloadApplication } from "../../services/applicationService";
import Modal from "react-bootstrap/Modal";

import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";

import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import SingleMonthPicker from "../common/monthPicker/monthPicker";
import COA1Table from "./coa1Table";
import moment from "moment";
import auth from "../../services/authService";
import SearchBox from "../common/searchBox";

class COA1 extends Component {
  state = {
    linkOutages: [],
    pageSize: 50,
    currentPage: 1,  
    searchQuery: "",
    sortColumn: { path: "link.description", order: "asc" },
    approveAllModal: false,
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  };

  async componentDidMount() {
    try {
      const { data: linkOutages } = await getCOA1Links(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );

      this.setState({ linkOutages });
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
  handleChange = ( query) => {
  
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
      await approveAllCOA1Outages(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Approved All COA1 outages for the month");
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
      linkOutages: allLinkOutages,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allLinkOutages;
    
    if (searchQuery) {
      filtered = allLinkOutages.filter((c) =>
        ((c.link.description.toLowerCase().includes(searchQuery.toLowerCase()) 
        || (c.link.source.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.link.destination.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.reasonPrecautions.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.requestingAgency.userName.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.outageType.toLowerCase().includes(searchQuery.toLowerCase()))
        )      
        
        )
      );
    }
    var sorted = _.orderBy(filtered, [sortColumn.path, 'proposedStartDate'], [sortColumn.order, 'asc']);
   

    const linkOutages = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: linkOutages };
  };

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: linkOutages } = await getCOA1Links(
      value.year,
      value.month - 1
    );
    this.setState({ linkOutages });
  };

  handleApprovalStatusChange = (outageRequest) => {
    var linkOutages = [...this.state.linkOutages];
    const index = linkOutages.findIndex((o) => o._id == outageRequest._id);
    linkOutages[index] = outageRequest;
    this.setState({ linkOutages });
  };

  handleDelete = async (linkOutage) => {
    const alllinkOutages = this.state.linkOutages;
    const linkOutages = alllinkOutages.filter((o) => o._id !== linkOutage._id);
    this.setState({ linkOutages });
    try {
      await deleteOutage(linkOutage, "coa1");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        this.setState({ linkOutages: alllinkOutages });
      }
    }
    this.handlePageChange(this.state.currentPage);
  };

  handleDownloadCOA1 = async () => {
    try {
      await DownloadApplication(
        "COA1",
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Downloaded COA1");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in Downloading");
      }
    }
  };

  render() {
    const { length: count } = this.state.linkOutages; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: linkOutages } = this.getPagedData();

    return (
      <div className="fluid-container">
        <div className="row">
          <div className="col-1"></div>

          <div className="col-4">
            <br></br>
            <SingleMonthPicker
              mvalue={this.state.mvalue}
              onDismiss={this.handleAMonthDissmis}
              onChange={this.handleAMonthDissmis}
            />
          </div>

          <div className="col-2">
            {" "}
            <br></br>
            {/* <Link
              to="/links/new"
              className="btn btn-primary"
              style={{ marginBottom: 20 }}
            >
              <i className="fa fa-plus-square" aria-hidden="true"></i> New Link
              Request <i className="fa fa-link" aria-hidden="true"></i>
            </Link> */}
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
            <Button variant="success" onClick={() => this.handleDownloadCOA1()}>
              Download COA1 Applications
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

            <COA1Table
              linkOutages={linkOutages}
              sortColumn={this.state.sortColumn}
              mvalue={this.state.mvalue}
              onSort={this.handleSort}
              onApprovalRequestChange={this.handleApprovalStatusChange}
              onDelete={this.handleDelete}
            ></COA1Table>
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

export default COA1;
