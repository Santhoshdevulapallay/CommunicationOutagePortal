import React, { Component, Suspense } from "react";
import { getLinks, getDBLinkRequests } from "../../services/linkService";
import Pagination from "../common/pagination";
import { paginate } from "../../utils/paginate";
import _ from "lodash";
import { Link } from "react-router-dom";
import SearchBox from "../common/searchBox";

import { toast } from "react-toastify";
import auth from "../../services/authService";

const LinkTable = React.lazy(() => import("./linkTable"));

class Links extends Component {
  state = {
    links: [],
    PendingDBLinkRequests: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "description", order: "asc" },
  };

  async componentDidMount() {
    try {
      const { data: links } = await getLinks();
      this.setState({ links });
      const { data: PendingDBLinkRequests } = await getDBLinkRequests();
      this.setState({ PendingDBLinkRequests });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
      }
    }
  }

  handleDelete = async (commitment) => {
    // await disableCommitment(commitment._id);
    toast.success("Succesfully Disabled Schedule Fixation Check");
    setTimeout(function () {
      window.location = `/onGoingCommitments/`;
    }, 2000);
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  handleSort = (sortColumn) => {
    this.setState({ sortColumn });
  };
  handleChange = (query) => {
    this.setState({ searchQuery: query, currentPage: 1 });
  };

  onDeleteRow = (link) => {
    var links = [...this.state.links];
    const index = links.findIndex((l) => l._id == link._id);
    links.splice(index, 1)
    this.setState({ links });
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

  render() {
    const { length: count } = this.state.links; //length property of commitments
    const { pageSize, currentPage, searchQuery } = this.state;
    const user = auth.getCurrentUser();
    const { totalCount, data: links } = this.getPagedData();

    if (count === 0)
      return (
        <p>
          <br></br>There are no Links registered
          <br></br>
          <Link
            to="/links/new"
            className="btn btn-dark"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Request to
            Add New Link to Database{" "}
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>
          <span> </span>
          <Link
            to="/linkRequests"
            className="btn btn-secondary"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Pending
            Links to be added to Database
            <span className="text-danger font-weight-bold">
              ({this.state.PendingDBLinkRequests.length}){" "}
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
            to="/links/new"
            className="btn btn-dark"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Request to
            Add New Link to Database{" "}
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>
          <span> </span>
          <Link
            to="/linkRequests"
            className="btn btn-secondary"
            style={{ marginBottom: 20 }}
          >
            <i className="fa fa-plus-square" aria-hidden="true"></i> Pending
            Links to be added to Database
            <span className="text-danger font-weight-bold">
              ({this.state.PendingDBLinkRequests.length}){" "}
            </span>
            <i className="fa fa-database" aria-hidden="true"></i>
          </Link>

          <p>Showing {totalCount} Links in Database</p>
          <SearchBox
            value={searchQuery}
            onChange={this.handleChange}
          ></SearchBox>
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
    );
  }
}

export default Links;
