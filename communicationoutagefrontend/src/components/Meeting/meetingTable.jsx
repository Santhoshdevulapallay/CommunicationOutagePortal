import React, { Component,Suspense } from "react";
import Table from "../common/table";
import Button from "react-bootstrap/Button";
import auth from "../../services/authService";
import moment from "moment";

const MeetingModal = React.lazy(() =>
  import("./meetingModal")
);


class MeetingTable extends Component {
  state = {
    show: false,
    meeting: null,
  };
  columns = [
    {
      path: "COMSRDate",
      label: "COMSR Date",
      content: (meeting) => (
        <span>{moment(meeting.COMSRDate).format('YYYY-MM-DD')}</span>
      )
    },
    { path: "COMSRNumber", label: "COMSR Number", content: (meeting) => (
      <span>{"COMSR-"+meeting.COMSRNumber}</span>
    )},
    { path: "reqOpeningDate", label: "Opening Date", content: (meeting) => (
      <span>{moment(meeting.reqOpeningDate).format('YYYY-MM-DD')}</span>
    ) },
    { path: "reqClosingDate", label: "Closing Date",  content: (meeting) => (
      <span>{moment(meeting.reqClosingDate).format('YYYY-MM-DD')}</span>
    ) },
    { path: "shutdownMinDate", label: "Shutdown Min Date",  content: (meeting) => (
      <span>{moment(meeting.shutdownMinDate).format('YYYY-MM-DD')}</span>
    ) },
    { path: "shutdownMaxDate", label: "Shutdown Max Date",  content: (meeting) => (
      <span>{moment(meeting.shutdownMaxDate).format('YYYY-MM-DD')}</span>
    ) },    
  ];

  editColumn = {
    key: "edit",
    content: (meeting) => (
      <Button variant="secondary" onClick={() => this.handleShow(meeting)}>
           Edit
      </Button>
    ),
  };

  constructor() {
    super();
    const user = auth.getCurrentUser();
    if (user && user.isAdmin) {
      this.columns.push(this.editColumn);
    }
  }

  handleShow = (meeting) => {
    this.setState({ show: true, meeting: meeting });
  };

  handleClose = (meeting, updateTable="") => {
    if(updateTable)
    {
      this.props.OnMeetingTableChange(meeting);
    }
    this.setState({ show: false });
  };

  
  render() {
    const { meetings, sortColumn, onSort } = this.props;
    const user = auth.getCurrentUser();
    return (
      <React.Fragment>
         
        {(user.isAdmin) &&
          <Button variant="success" onClick={() => this.handleShow(null)} >
            New Meeting
          </Button>
        }
        <br></br> <br></br>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={meetings}
        ></Table>

        <Suspense fallback={<div>Loading...</div>}>         
          <MeetingModal
            show={this.state.show}
            meeting={this.state.meeting}
            OnClose={this.handleClose}
          ></MeetingModal>
        </Suspense>

      </React.Fragment>
    );
  }
}

export default MeetingTable;
