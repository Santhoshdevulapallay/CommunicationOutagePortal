import React, { Component, Suspense } from "react";
import { getequipmentsByMonth } from "../../services/equipmentService";
import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _, { get } from "lodash";

import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import SingleMonthPicker from "../common/monthPicker/monthPicker";
import moment from "moment";
import auth from "../../services/authService";
import SearchBox from "../common/searchBox";
const EquipmentTable = React.lazy(() => import("./equpmentTable"));


class EquipmentsByMonth extends Component {
  state = {
    equipments: [],
    pageSize: 50,
    currentPage: 1,  
    searchQuery: "",
    sortColumn: { path: "description", order: "asc" },
    mvalue: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  };

  async componentDidMount() {
    try {
      const { data: equipments } = await getequipmentsByMonth(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );

      this.setState({ equipments });
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

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: equipments } = await getequipmentsByMonth(
      value.year,
      value.month - 1
    );
    this.setState({ equipments });
  };

  

  render() {
    const { length: count } = this.state.equipments; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: equipments } = this.getPagedData();

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
          </div>
         
         
        </div>
        <div className="row" style={{ margin: "10px" }}>
          <div className="className col-12">
            <br></br>

            <p>Showing {totalCount} Equipments Requests in Database</p>
            <div className="row">
                   <div className="col-md-12">
              <SearchBox
                value={searchQuery}
                onChange={this.handleChange}
              ></SearchBox>
              </div>
            </div>

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
      
      </div>
    );
  }
}

export default EquipmentsByMonth;
