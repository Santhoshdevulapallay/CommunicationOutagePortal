import React, { Component, Suspense } from "react";
import Table from "../common/table";
import auth from "../../services/authService";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { saveCOD2Outage } from "../../services/equipmentOutageService";
import moment from "moment";

const COD2OutageEntryModal = React.lazy(() => import("./cod2OutageEntryModal"));

class COD2Table extends Component {
  state = {
    user: auth.getCurrentUser(),
    show: false,
    cod2Outage: "",
  };
  columns = [
    {
      path: "requestingAgency.userName",
      label: "Requester",
    },
    {
      path: "equipment.description",
      label: "Description",
    },
    {
      path: "equipment.location",
      label: "Location",
    },
    { path: "outageType", label: "Outage Type" },
    { path: "reasonPrecautions", label: "Reason & Preacutions" },
    {
      path: "approvedStartDate",
      label: "Approved StartDate",
      content: (cod2Outage) => (
        <span>
          {cod2Outage.approvedStartDate &&
            moment(cod2Outage.approvedStartDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },
    {
      path: "approvedEndDate",
      label: "Approved EndDate",
      content: (cod2Outage) => (
        <span>
          {cod2Outage.approvedEndDate &&
            moment(cod2Outage.approvedEndDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },

    {
      path: "outageStartDate",
      label: "Outage StartDate",
      content: (cod2Outage) => (
        <span>
          {cod2Outage.outageStartDate &&
            moment(cod2Outage.outageStartDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },
    {
      path: "outageEndDate",
      label: "Outage EndDate",
      content: (cod2Outage) => (
        <span>
          {cod2Outage.outageEndDate &&
            moment(cod2Outage.outageEndDate)
              .local()
              .format("DD-MMM-YYYY HH:mm")}
        </span>
      ),
    },

    {
      key: "Edit",
      content: (cod2Outage) => (
        <span>
          <Button
            variant="secondary"
            onClick={() => this.handleShow(cod2Outage)}
          >
            <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
          </Button>
        </span>
      ),
    },
    {
      key: "Mail",
      label: "Mail",
      content: (cod2Outage) => (
        <span>
          {cod2Outage.outageType == "Planned" && (
            <Button
              variant="success"
              onClick={() => this.props.onD3SendMail(cod2Outage)}
              disabled={cod2Outage.d3mailStatus}
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
      content: (cod2Outage) => (
        <span>
          <span>
            {cod2Outage.availedStatus === 0 && (
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
            {cod2Outage.availedStatus === 1 && (
              <Button variant="success" disabled>
                <span>
                  <i className="fa fa-check " aria-hidden="true"></i>
                </span>
              </Button>
            )}
          </span>
          <span>
            {cod2Outage.availedStatus === 2 && (
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

  handleShow = (cod2Outage) => {
    this.setState({ show: true, cod2Outage: cod2Outage });
  };
  handleClose = (reload = "", cod2Outage = "") => {
    this.setState({ show: false });
    if (reload) {
      this.props.onCOD2OutageChange(cod2Outage);
    }
  };

  render() {
    const { cod2Outages, sortColumn, onSort } = this.props;
    console.log(cod2Outages);
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={cod2Outages}
        ></Table>

        <Suspense fallback={<div>Loading...</div>}>
          <COD2OutageEntryModal
            show={this.state.show}
            OnClose={this.handleClose}
            cod2Outage={this.state.cod2Outage}
            onApprove={this.handleApprove}
            mvalue={this.props.mvalue}
            freezeStatus={this.props.freezeStatus}
          ></COD2OutageEntryModal>
        </Suspense>
      </React.Fragment>
    );
  }
}

export default COD2Table;
