import React, { Component } from "react";
import {
  getCOD1,
  deleteOutage,
  d3sendMail,
} from "../../services/linkOutageService";
import {
  FreezeApplication,
  getFreezeStatus,
  DownloadApplication,
} from "../../services/applicationService";

import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";
import { Link } from "react-router-dom";
import SearchBox from "../common/searchBox";
import Button from "react-bootstrap/Button";

import { toast } from "react-toastify";
import SingleMonthPicker from "../common/monthPicker/monthPicker";
import COD1Table from "./cod1Table";
import auth from "../../services/authService";

class COD1 extends Component {
  state = {
    cod1Outages: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "link.description", order: "asc" },
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth()+1,
    },
    freezeStatus: false,
  };

  async componentDidMount() {
    const { data: cod1Outages } = await getCOD1(
      this.state.mvalue.year,
      this.state.mvalue.month - 1
    );
    this.handleCOD1FreezeStatus();
    this.setState({ cod1Outages });
    
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

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      cod1Outages: allcod1Outages,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allcod1Outages;
    if (searchQuery) {
      filtered = allcod1Outages.filter((c) =>
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


    var sorted = _.orderBy(filtered, [sortColumn.path, 'approvedStartDate'], [sortColumn.order, 'asc']);

    const cod1Outages = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: cod1Outages };
  };

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: cod1Outages } = await getCOD1(value.year, value.month - 1);
    this.handleCOD1FreezeStatus();
    this.setState({ cod1Outages });
  };

  handlecod1OutageChange = (cod1Outage) => {
    var cod1Outages = [...this.state.cod1Outages];
    const index = cod1Outages.findIndex((o) => o._id == cod1Outage._id);
    cod1Outages[index] = cod1Outage;
    this.setState({ cod1Outages });
  };

  handleCOD1FreezeStatus = async () => {
    const { data: ApplicationStatus } = await getFreezeStatus(
      "COD1",
      this.state.mvalue.year,
      this.state.mvalue.month
    );
    this.setState({ freezeStatus: ApplicationStatus[0].status });

    
    
  };

  handleCOD1Freeze = async () => {
    try {
      await FreezeApplication(
        "COD1",
        this.state.mvalue.year,
        this.state.mvalue.month
      );
      window.location.reload();
      toast.success("Succesfully Freezed COD1 Application");
      this.setState({ freezeStatus: true });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in freezing");
      }
    }
  };
  handleDownloadCOD1 = async () => {
    try {
      await DownloadApplication(
        "COD1",
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Downloaded COD1");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in Downloading");
      }
    }
  };

  handled3SendMail = (cod1Outage) => {
    setTimeout(async () => {
      try {
        await d3sendMail(cod1Outage._id);
        toast.success("Successfully Sent Mail");
        var cod1Outages = [...this.state.cod1Outages];
        const index = cod1Outages.findIndex((o) => o._id == cod1Outage._id);
        cod1Outages[index].d3mailStatus = true;
        this.setState({ cod1Outages });
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
        }
      }
    }, 500);
  };

  render() {
    const { length: count } = this.state.cod1Outages; //length property of cod1Outages
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: cod1Outages } = this.getPagedData();

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
            <br></br>
            {(user.isAdmin || user.isSupervisor) && (
              <Button
                variant="success"
                onClick={() => this.handleCOD1Freeze()}
                disabled={this.state.freezeStatus}
              >
                Freeze COD1 Applications
              </Button>
            )}
          </div>
          <div className="col-2">
            {" "}
            <br></br>
            <Button variant="success" onClick={() => this.handleDownloadCOD1()}>
              Download COD1 Deviation Report
            </Button>
          </div>

          <div className="col-3">
            {" "}
            <br></br>
            <Link
              to="/links/"
              className="btn btn-primary"
              style={{ marginBottom: 20 }}
            >
              <i className="fa fa-plus-square" aria-hidden="true"></i> Add
              Forced Link Outage to COD1{" "}
              <i className="fa fa-link" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
        <div className="row" style={{ margin: "10px" }}>
          <div className="className col-12">
            <br></br>

            <p>Showing {totalCount} Outages in Database for selected Month</p>
            <SearchBox
              value={searchQuery}
              onChange={this.handleChange}
            ></SearchBox>
            <COD1Table
              cod1Outages={cod1Outages}
              sortColumn={this.state.sortColumn}
              mvalue={this.state.mvalue}
              onSort={this.handleSort}
              oncod1OutageChange={this.handlecod1OutageChange}
              onDelete={this.handleDelete}
              onD3SendMail={this.handled3SendMail}
              freezeStatus={this.state.freezeStatus}
            ></COD1Table>
            <Pagination
              itemsCount={totalCount}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={this.handlePageChange}
            ></Pagination>
          </div>
        </div>
      </div>
    );
  }
}

export default COD1;
