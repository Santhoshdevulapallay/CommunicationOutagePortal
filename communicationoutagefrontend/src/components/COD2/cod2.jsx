import React, { Component } from "react";
import { getCOD2, d3sendMail } from "../../services/equipmentOutageService";
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
import COD2Table from "./cod2Table";
import auth from "../../services/authService";

class COD2 extends Component {
  state = {
    cod2Outages: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "equipment.description", order: "asc" },
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth()+1,
    },
    freezeStatus: false,
  };

  async componentDidMount() {
    const { data: cod2Outages } = await getCOD2(
      this.state.mvalue.year,
      this.state.mvalue.month - 1
    );
    this.handleCOD2FreezeStatus();
    this.setState({ cod2Outages });
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
      cod2Outages: allcod2Outages,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allcod2Outages;
    if (searchQuery) {
      filtered = allcod2Outages.filter((c) =>
        (c.equipment.description.toLowerCase().includes(searchQuery.toLowerCase()) 
        || (c.equipment.location.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.outageType.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.reasonPrecautions.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.requestingAgency.userName.toLowerCase().includes(searchQuery.toLowerCase()))
         )
      );
    }

    var sorted = _.orderBy(filtered, [sortColumn.path, 'approvedStartDate'], [sortColumn.order, 'asc']);

    const cod2Outages = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: cod2Outages };
  };

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: cod2Outages } = await getCOD2(value.year, value.month - 1);
    this.handleCOD2FreezeStatus();
    this.setState({ cod2Outages });
  };

  handleCOD2OutageChange = (COD2Outage) => {
    var cod2Outages = [...this.state.cod2Outages];
    const index = cod2Outages.findIndex((o) => o._id == COD2Outage._id);
    cod2Outages[index] = COD2Outage;
    this.setState({ cod2Outages });
  };

  handleCOD2FreezeStatus = async () => {
    const { data: ApplicationStatus } = await getFreezeStatus(
      "COD2",
      this.state.mvalue.year,
      this.state.mvalue.month
    );
    this.setState({ freezeStatus: ApplicationStatus[0].status });
  };

  handleCOD2Freeze = async () => {
    try {
      await FreezeApplication(
        "COD2",
        this.state.mvalue.year,
        this.state.mvalue.month
      );
      window.location.reload();
      toast.success("Succesfully Freezed COD2 Application");
      this.setState({ freezeStatus: true });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in freezing");
      }
    }
  };
  handleDownloadCOD2 = async () => {
    try {
      await DownloadApplication(
        "COD2",
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );
      toast.success("Succesfully Downloaded COD2");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error("Error in Downloading");
      }
    }
  };

  handled3SendMail = (cod2Outage) => {
    setTimeout(async () => {
      try {
        await d3sendMail(cod2Outage._id);
        toast.success("Successfully Sent Mail");
        var cod2Outages = [...this.state.cod2Outages];
        const index = cod2Outages.findIndex((o) => o._id == cod2Outage._id);
        cod2Outages[index].d3mailStatus = true;
        this.setState({ cod2Outages });
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
        }
      }
    }, 500);
  };

  render() {
    const { length: count } = this.state.cod2Outages; //length property of cod2Outages
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: cod2Outages } = this.getPagedData();

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
                onClick={() => this.handleCOD2Freeze()}
                disabled={this.state.freezeStatus}
              >
                Freeze COD2 Applications
              </Button>
            )}
          </div>
          <div className="col-2">
            {" "}
            <br></br>
            <Button variant="success" onClick={() => this.handleDownloadCOD2()}>
              Download COD2 Applications
            </Button>
          </div>

          <div className="col-3">
            {" "}
            <br></br>
            <Link
              to="/equipments/"
              className="btn btn-primary"
              style={{ marginBottom: 20 }}
            >
              <i className="fa fa-plus-square" aria-hidden="true"></i> Add New
              Equipment Forced Outage to COD2{" "}
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
            <COD2Table
              cod2Outages={cod2Outages}
              sortColumn={this.state.sortColumn}
              mvalue={this.state.mvalue}
              onSort={this.handleSort}
              onCOD2OutageChange={this.handleCOD2OutageChange}
              freezeStatus={this.state.freezeStatus}
              onD3SendMail={this.handled3SendMail}
            ></COD2Table>
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

export default COD2;
