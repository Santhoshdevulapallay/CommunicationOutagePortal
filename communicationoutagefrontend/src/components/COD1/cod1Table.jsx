import React, { Component, Suspense } from "react";
import Table from "../common/table";
import auth from "../../services/authService";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { saveCOD1Outage } from "../../services/linkOutageService";
import moment from "moment";

const COD1OutageEntryModal = React.lazy(() => import("./cod1OutageEntryModal"));

class COD1Table extends Component {
  state = {
    user: auth.getCurrentUser(),
    show: false,
    cod1Outage: "",
  };
  columns = [
    {
      path: "requestingAgency.userName",
      label: "Requester",
    },
    {
      path: "link.source",
      label: "Source",
    },
    {
      path: "link.destination",
      label: "Destination",
    },
    {
      path: "link.description",
      label: "Description",
    },
    { path: "outageType", label: "Outage Type" },
    { path: "reasonPrecautions", label: "Reason & Preacutions" },
    {
      path: "approvedStartDate",
      label: "Approved StartDate",
      content: (cod1Outage) => (
        <span>
          {cod1Outage.approvedStartDate &&
            moment(cod1Outage.approvedStartDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },
    {
      path: "approvedEndDate",
      label: "Approved EndDate",
      content: (cod1Outage) => (
        <span>
          {cod1Outage.approvedEndDate &&
            moment(cod1Outage.approvedEndDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },

    {
      path: "outageStartDate",
      label: "Outage StartDate",
      content: (cod1Outage) => (
        <span>
          {cod1Outage.outageStartDate &&
            moment(cod1Outage.outageStartDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },
    {
      path: "outageEndDate",
      label: "Outage EndDate",
      content: (cod1Outage) => (
        <span>
          {cod1Outage.outageEndDate &&
            moment(cod1Outage.outageEndDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },

    {
      key: "Edit",
      content: (cod1Outage) => (
        <span>
          <Button
            variant="secondary"
            onClick={() => this.handleShow(cod1Outage)}
          >
            <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
          </Button>
        </span>
      ),
    },
    {
      key: "Mail",
      label: "Mail",
      content: (cod1Outage) => (
        <span>
          {cod1Outage.outageType == "Planned" && (
            <Button
              variant="success"
              onClick={() => this.props.onD3SendMail(cod1Outage)}
              disabled={cod1Outage.d3mailStatus}
            >
              <i className="fa fa-envelope" aria-hidden="true"></i>
            </Button>
          )}
        </span>
      ),
    },
    {
      key: "AvailedStatus",
      label: "AvailedStatus",
      content: (cod1Outage) => (
        <span>
          <span>
            {cod1Outage.availedStatus === 0 && (
              <Button variant="warning" disabled>
                <span>
                  <i
                    className="fa fa-question-circle warning"
                    aria-hidden="true"
                  ></i>
                </span>
              </Button>
            )}
          </span>
          <span>
            {cod1Outage.availedStatus === 1 && (
              <Button variant="success" disabled>
                <span>
                  <i className="fa fa-check " aria-hidden="true"></i>
                </span>
              </Button>
            )}
          </span>
          <span>
            {cod1Outage.availedStatus === 2 && (
              <Button variant="danger" disabled>
                <span>
                  <i
                    className="fa fa-window-close danger"
                    aria-hidden="true"
                  ></i>
                </span>
              </Button>
            )}
          </span>
        </span>
      ),
    },
  ];

  handleShow = (cod1Outage) => {
    this.setState({ show: true, cod1Outage: cod1Outage });
  };
  handleClose = (reload = "", cod1Outage = "") => {
    debugger;
    this.setState({ show: false });
    if (reload) {
      this.props.oncod1OutageChange(cod1Outage);
    }
  };

  render() {
    const { cod1Outages, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={cod1Outages}
        ></Table>

        <Suspense fallback={<div>Loading...</div>}>
          <COD1OutageEntryModal
            show={this.state.show}
            OnClose={this.handleClose}
            cod1Outage={this.state.cod1Outage}
            onApprove={this.handleApprove}
            mvalue={this.props.mvalue}
            freezeStatus={this.props.freezeStatus}
          ></COD1OutageEntryModal>
        </Suspense>
      </React.Fragment>
    );
  }
}

export default COD1Table;
