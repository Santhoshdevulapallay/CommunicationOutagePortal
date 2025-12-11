import React, { Component } from "react";
import { getMeetings } from "../../services/meetingService";
import Pagination from "../common/pagination";
import MeetingTable from "./meetingTable";
import { paginate } from "../../utils/paginate";
import SearchBox from "../common/searchBox";
import _ from "lodash";
import auth from "../../services/authService";
import { toast } from "react-toastify";


class Meetings extends Component {
  state = {
    meetings: [],
    pageSize: 50,
    currentPage: 1,
    searchQuery: "",
    sortColumn: { path: "COMSRDate", order: "desc" },
  };

  async componentDidMount() {
    try {
      const { data: meetings } = await getMeetings();
      this.setState({ meetings });
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
        auth.logout();
        window.location = "/";
      }
    }
  }

  handeleMeetingTableChage=(meeting)=>{
    var meetings = [...this.state.meetings];
    const index = meetings.findIndex((m) => m._id == meeting._id);
    if(index>=0){
      meetings[index] = meeting;
    }
    else{
      meetings.push(meeting);
    }    
    this.setState({ meetings });
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
      meetings: allMeetings,
      searchQuery,
      sortColumn,
    } = this.state;

    let filtered = allMeetings;
    if (searchQuery) {
      filtered = allMeetings.filter((c) =>
        c.COMSRDate.toLowerCase().startsWith(searchQuery.toLowerCase())
      );
    }

    const sorted = _.orderBy(filtered, [sortColumn.path], [sortColumn.order]);

    const meetings = paginate(sorted, currentPage, pageSize);
    return { totalCount: filtered.length, data: meetings };
  };

  render() {
    const { length: count } = this.state.meetings; //length property of meetings
    const { pageSize, currentPage, searchQuery } = this.state;
    const { totalCount, data: meetings } = this.getPagedData();

    return (
      <div className="row">
        <div className="col-1"></div>
        <div className="className col-10">
            <br></br>
          <p>Showing {totalCount} Meetings in Database</p>
          {/* <SearchBox
            value={searchQuery}
            onChange={this.handleChange}
          ></SearchBox> */}
          <MeetingTable
            meetings={meetings}
            sortColumn={this.state.sortColumn}
            onSort={this.handleSort}
            OnMeetingTableChange={this.handeleMeetingTableChage}
          ></MeetingTable>
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

export default Meetings;
