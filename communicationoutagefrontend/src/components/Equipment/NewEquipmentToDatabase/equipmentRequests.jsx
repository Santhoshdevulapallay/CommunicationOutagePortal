import React, { Component } from "react";
import { getDBEquipmentRequests } from "../../../services/equipmentService";
import Pagination from "../../common/pagination";
import { paginate } from "../../../utils/paginate";
import _ from "lodash";
import { Link } from "react-router-dom";
import SearchBox from "../../common/searchBox";

import { toast } from "react-toastify";
import auth from "../../../services/authService";
import EquipmentRequestTable from './equipmentRequestTable';

class EquipmentRequests extends Component {
  state = {
    equipments: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "description", order: "asc" },
  };

  async componentDidMount() {
    const { data: equipments } = await getDBEquipmentRequests();
    this.setState({ equipments });
  }

  handleApprove=(equipment)=>{
    const originalEquipments = this.state.equipments;
    let equipments = originalEquipments.filter(pequipment => pequipment._id !== equipment._id);
    this.setState({ equipments });
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
      equipments: allequipments,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allequipments;
    if (searchQuery) {
      filtered = allequipments.filter((c) =>
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const equipments = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: equipments };
  };

  render() {
    const { length: count } = this.state.equipments; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const { totalCount, data: equipments } = this.getPagedData();

    if (count === 0)
      return (
        <p>
          <br></br>There are no Equipment Requests
        </p>
      );
    return (
      <div className="row">
        <div className="col-1"></div>
        <div className="className col-10">
          <br></br>
         
          
          <p>Showing {totalCount} equipments in Database</p>
          <SearchBox
            value={searchQuery}
            onChange={this.handleChange}
          ></SearchBox>
          <EquipmentRequestTable
            equipments={equipments}
            sortColumn={this.state.sortColumn}
            onSort={this.handleSort}
            onApprove={this.handleApprove}
          ></EquipmentRequestTable>
          <Pagination
            itemsCount={totalCount}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={this.handlePageChange}
          ></Pagination>
        </div>
      </div>
    );
  }
}

export default EquipmentRequests;
