import React, { Component } from "react";
import { getDBLinkRequests } from "../../../services/linkService";
import Pagination from "../../common/pagination";
import LinkTable from "../linkTable";
import { paginate } from "../../../utils/paginate";
import _ from "lodash";
import { Link } from "react-router-dom";
import SearchBox from "../../common/searchBox";

import { toast } from "react-toastify";
import auth from "../../../services/authService";
import LinkRequestTable from './linkRequestTable';

class LinkRequests extends Component {
  state = {
    links: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "description", order: "asc" },
  };

  async componentDidMount() {
    const { data: links } = await getDBLinkRequests();
    this.setState({ links });
  }

  handleApprove=(link)=>{
    const originalLinks = this.state.links;
    let links = originalLinks.filter(plink => plink._id !== link._id);
    this.setState({ links });
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
      links: allLinks,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allLinks;
    if (searchQuery) {
      filtered = allLinks.filter((c) =>
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const links = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: links };
  };

  render() {
    const { length: count } = this.state.links; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: links } = this.getPagedData();

    if (count === 0)
      return (
        <p>
          <br></br>There are no Link Requests
        </p>
      );
    return (
      <div className="row">
        <div className="col-1"></div>
        <div className="className col-10">
          <br></br>
         
            <Link
              to="/links/new"
              className="btn btn-primary"
              style={{ marginBottom: 20 }}
            >
              <i className="fa fa-plus-square" aria-hidden="true"></i> Add New
              Link <i className="fa fa-link" aria-hidden="true"></i>
            </Link>
        

          <p>Showing {totalCount} Links in Database</p>
          <SearchBox
            value={searchQuery}
            onChange={this.handleChange}
          ></SearchBox>
          <LinkRequestTable
            links={links}
            sortColumn={this.state.sortColumn}
            onSort={this.handleSort}
            onApprove={this.handleApprove}
          ></LinkRequestTable>
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

export default LinkRequests;
