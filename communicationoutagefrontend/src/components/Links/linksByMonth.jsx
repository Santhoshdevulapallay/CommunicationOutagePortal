import React, { Component, Suspense } from "react";
import { getlinksByMonth } from "../../services/linkService";
import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";

import { toast } from "react-toastify";
import Button from "react-bootstrap/Button";
import SingleMonthPicker from "../common/monthPicker/monthPicker";
import moment from "moment";
import auth from "../../services/authService";
import SearchBox from "../common/searchBox";
const LinkTable = React.lazy(() => import("./linkTable"));


class LinksByMonth extends Component {
  state = {
    links: [],
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
      const { data: links } = await getlinksByMonth(
        this.state.mvalue.year,
        this.state.mvalue.month - 1
      );

      this.setState({ links });
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
      links: allLinks,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allLinks;
    if (searchQuery) {
      filtered = allLinks.filter((c) =>
        ((c.description.toLowerCase().includes(searchQuery.toLowerCase()) 
        || (c.source.toLowerCase().includes(searchQuery.toLowerCase()))
        || (c.destination.toLowerCase().includes(searchQuery.toLowerCase()))        
        || (c.user.toLowerCase().includes(searchQuery.toLowerCase()))
        )      
        
        )
      );
    }

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);
    
    const links = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: links };
  };

  handleAMonthDissmis = async (value) => {
    this.setState({ mvalue: value });
    const { data: links } = await getlinksByMonth(
      value.year,
      value.month - 1
    );
    this.setState({ links });
  };

  

  render() {
    const { length: count } = this.state.links; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: links } = this.getPagedData();

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

            <p>Showing {totalCount} Link Requests in Database</p>
            <div className="row">
                   <div className="col-md-12">
              <SearchBox
                value={searchQuery}
                onChange={this.handleChange}
              ></SearchBox>
              </div>
            </div>

             <Suspense fallback={<div>Loading...</div>}>
                <LinkTable
                  links={links}
                  sortColumn={this.state.sortColumn}
                  onEdit={this.handleEdit}
                  onDeleteRow={this.onDeleteRow}
                  onRequest={this.handleRequest}
                  onSort={this.handleSort}
                  fromComponent={"onGoing"}
                ></LinkTable>
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

export default LinksByMonth;
