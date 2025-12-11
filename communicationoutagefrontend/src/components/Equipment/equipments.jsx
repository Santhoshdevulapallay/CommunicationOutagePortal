import React, { Component, Suspense } from "react";
import {
  getEquipments,
  getDBEquipmentRequests,
} from "../../services/equipmentService";
import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";
import { Link } from "react-router-dom";
import SearchBox from "../common/searchBox";

import { toast } from "react-toastify";

const EquipmentTable = React.lazy(() => import("./equpmentTable"));

class Equipments extends Component {
  state = {
    equipments: [],
    PendingDBEquipmentRequests: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "description", order: "asc" },
  };

  async componentDidMount() {
    try {
      const { data: equipments } = await getEquipments();
      this.setState({ equipments });
      const {
        data: PendingDBEquipmentRequests,
      } = await getDBEquipmentRequests();
      this.setState({ PendingDBEquipmentRequests });
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

  onDeleteRow = (equipment) => {
    var equipments = [...this.state.equipments];
    const index = equipments.findIndex((e) => e._id == equipment._id);
    equipments.splice(index, 1)
    this.setState({ equipments });
  };

  getPagedData = () => {
    const {
      pageSize,
      currentPage,
      equipments: allEquipments,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allEquipments;
    if (searchQuery) {
      filtered = allEquipments.filter((c) =>
      (c.description.toLowerCase().includes(searchQuery.toLowerCase()) 
      || (c.location.toLowerCase().includes(searchQuery.toLowerCase()))     
      || (c.user.toLowerCase().includes(searchQuery.toLowerCase()))
       )
    );
     
    }

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const equipments = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: equipments };
  };

  render() {
    const { length: count } = this.state.equipments; //length property of equipments
    const { pageSize, currentPage, searchQuery } = this.state;

    const { totalCount, data: equipments } = this.getPagedData();

    if (count === 0)
      return (
        <p>
          <br></br>There are no Equipments registered
          <br></br>
          <Link
            to="/equipments/new"
            className="btn btn-dark"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Request to
            Add New Equipment to Database{" "}
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>
          <span> </span>
          <Link
            to="/equipmentRequests"
            className="btn btn-secondary"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Pending
            Equipments to be added to Database
            <span className="text-danger font-weight-bold">
              ({this.state.PendingDBEquipmentRequests.length}){" "}
            </span>
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>
        </p>
      );
    return (
      <div className="row">
        <div className="col-1"></div>
        <div className="className col-10">
          <br></br>
          <Link
            to="/equipments/new"
            className="btn btn-dark"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Request to
            Add New Equipment to Database{" "}
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>
          <span> </span>
          <Link
            to="/equipmentRequests"
            className="btn btn-secondary"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Pending
            Equipments to be added to Database
            <span className="text-danger font-weight-bold">
              ({this.state.PendingDBEquipmentRequests.length}){" "}
            </span>
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>

          <p>Showing {totalCount} Equipments in Database</p>
          <SearchBox
            value={searchQuery}
            onChange={this.handleChange}
          ></SearchBox>
          <Suspense fallback={<div>Loading...</div>}>
            <EquipmentTable
              equipments={equipments}
              sortColumn={this.state.sortColumn}
              onEdit={this.handleEdit}
              onDeleteRow={this.onDeleteRow}
              onRequest={this.handleRequest}
              onSort={this.handleSort}
            ></EquipmentTable>
          </Suspense>
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

export default Equipments;
