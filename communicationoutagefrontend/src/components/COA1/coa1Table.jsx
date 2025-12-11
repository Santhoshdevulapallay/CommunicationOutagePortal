import React, { Component, Suspense } from "react";
import Table from "../common/table";
import { Link } from "react-router-dom";
import auth from "../../services/authService";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import {
  saveLinkOutage,
  generateLinkCode,
} from "../../services/linkOutageService";
import moment from "moment";

// import LinkOutageApprovalModal from "./linkOutageModule/linkOutageApprovalModal";
const LinkOutageApprovalModal = React.lazy(() =>
  import("./linkOutageApprovalModal")
);
const LinkOutageViewlModal = React.lazy(() => import("./linkOutageViewModal"));

class COA1Table extends Component {
  state = {
    user: auth.getCurrentUser(),
    show: false,
    viewshow: false,
    outageRequest: "",
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
    { path: "reasonPrecautions", label: "Reason & Preacutions" },
  ];

  EditButton = {
    key: "Edit",
    content: (linkOutage) => (
      <span>
        {this.state.user.isAdmin && (
          <span>
            {" "}
            <Button
              variant="secondary"
              onClick={() => this.handleShow(linkOutage, "")}
            >
              <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
            </Button>
          </span>
        )}
        {!this.state.user.isAdmin && (
          <span>
            {" "}
            <Button
              variant="secondary"
              onClick={() => this.handleShow(linkOutage, "view")}
            >
              <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
            </Button>
          </span>
        )}
      </span>
    ),
  };

  ApprovalStatus = {
    path: "Approvalstatus",
    label: "Approval Status",
    content: (linkOutage) => (
      <span>
        <span>{linkOutage.Approvalstatus}</span>
      </span>
    ),
  };

  proposedStartDate = {
    path: "proposedStartDate",
    label: "Proposed StartDate",
    content: (linkOutage) => (
      <span>
        {moment(linkOutage.proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };
  proposedEndDate = {
    path: "proposedEndDate",
    label: "Proposed EndDate",
    content: (linkOutage) => (
      <span>
        {moment(linkOutage.proposedEndDate).local().format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };

  approvedStartDate = {
    path: "approvedStartDate",
    label: "Approved StartDate",
    content: (linkOutage) => (
      <span>
        {linkOutage.approvedStartDate &&
          moment(linkOutage.approvedStartDate)
            .local()
            .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };
  approvedEndDate = {
    path: "approvedEndDate",
    label: "Approved EndDate",
    content: (linkOutage) => (
      <span>
        {linkOutage.approvedEndDate &&
          moment(linkOutage.approvedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };

  approveButton = {
    key: "ApproveButton",
    content: (linkOutage) => (
      <span>
        {linkOutage.Approvalstatus === "Pending" && (
          <Button
            variant="success"
            onClick={() => this.handleApprove(linkOutage, "Approved")}
          >
            <i class="fa fa-check" aria-hidden="true"></i>
          </Button>
        )}
      </span>
    ),
  };
  rejectButton = {
    key: "RejectButton",
    content: (linkOutage) => (
      <span>
        {linkOutage.Approvalstatus === "Pending" && (
          <Button
            variant="danger"
            onClick={() => this.handleApprove(linkOutage, "Rejected")}
          >
            <i class="fa fa-times" aria-hidden="true"></i>
          </Button>
        )}
      </span>
    ),
  };

  openingCodeButton = {
    key: "openingCodeButton",
    content: (linkOutage) => (
      <span>
        {!linkOutage.openingCode && (
          <Button
            variant="danger"
            onClick={() => this.handleGenerateLinkCode(linkOutage, "opening")}
          >
            Opening Code
          </Button>
        )}
        {linkOutage.openingCode && linkOutage.openingCode}
      </span>
    ),
  };
  closingCodeButton = {
    key: "closingCodeButton",
    content: (linkOutage) => (
      <span>
        {!linkOutage.closingCode && (
          <Button
            variant="success"
            onClick={() => this.handleGenerateLinkCode(linkOutage, "closing")}
          >
            Closing Code
          </Button>
        )}
        {linkOutage.openingCode && linkOutage.closingCode}
      </span>
    ),
  };

  d3mailStatus = {
    key: "d3mailStatus",
    label: "D-3 Intimation",
    content: (linkOutage) => (
      <span>
        {!linkOutage.d3mailStatus && (
          <Button variant="danger" disabled>
            <span>
              <i className="fa fa-window-close danger" aria-hidden="true"></i>
            </span>
          </Button>
        )}
        {linkOutage.d3mailStatus && (
          <Button variant="success" disabled>
            <span>
              <i className="fa fa-check " aria-hidden="true"></i>
            </span>
          </Button>
        )}
      </span>
    ),
  };

  handleApprove = async (linkOutage, status) => {
    debugger;
    try {
      await saveLinkOutage({
        _id: linkOutage._id,
        rpcRemarks: linkOutage.rpcRemarks,
        approvedStartDate: linkOutage.proposedStartDate,
        approvedEndDate: linkOutage.proposedEndDate,
        Approvalstatus: status,
      });
      if (status === "Approved") {
        toast.success("Successfully Approved Outage");
        linkOutage.approvedStartDate = linkOutage.proposedStartDate;
        linkOutage.approvedEndDate = linkOutage.proposedEndDate;
      } else {
        toast.error("Rejected Applied Outage");
        linkOutage.approvedStartDate = "";
        linkOutage.approvedEndDate = "";
      }

      linkOutage.Approvalstatus = status;

      this.handleClose("reload", linkOutage);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error(ex.response.data);
        this.handleClose();
      }
    }
  };

  handleGenerateLinkCode = async (linkOutage, typeCode) => {
    try {
      const { data: linkout } = await generateLinkCode(
        {
          _id: linkOutage._id,
        },
        typeCode
      );

      debugger;
      if (typeCode === "opening") {
        toast.error("Successfully Generated Opening Code");
        linkOutage.openingCode = linkout.openingCode;
      } else {
        toast.success("Successfully Generated Closing Code");
        linkOutage.closingCode = linkout.closingCode;
      }

      this.handleClose("reload", linkOutage);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error(ex.response.data);
        this.handleClose();
      }
    }
  };

  DeleteButton = {
    key: "DeleteButton",
    content: (linkOutage) => (
      <span>
        {linkOutage.Approvalstatus === "Pending" && (
          <Button
            variant="danger"
            onClick={() => this.props.onDelete(linkOutage)}
          >
            <i class="fa fa-trash-o" aria-hidden="true"></i>
          </Button>
        )}
      </span>
    ),
  };

  constructor() {
    super();
    const user = auth.getCurrentUser();

    if (user && !user.isOperator) {
      this.columns.push(this.proposedStartDate);
      this.columns.push(this.proposedEndDate);
    } else {
      this.columns.push(this.openingCodeButton);
      this.columns.push(this.closingCodeButton);
      this.columns.push(this.d3mailStatus);
    }
    this.columns.push(this.approvedStartDate);
    this.columns.push(this.approvedEndDate);
    this.columns.push(this.EditButton);
    this.columns.push(this.ApprovalStatus);
    if (user && user.isAdmin) {
      this.columns.push(this.approveButton);
      this.columns.push(this.rejectButton);
    } else {
      this.columns.push(this.DeleteButton);
    }
  }

  handleShow = (outageRequest, userView = "") => {
    if (userView) {
      this.setState({ viewshow: true, outageRequest: outageRequest });
    } else {
      this.setState({ show: true, outageRequest: outageRequest });
    }
  };
  handleClose = (reload = "", outageRequest = "") => {
    this.setState({ show: false });
    this.updateOutageRequestState(reload, outageRequest);
  };
  handleViewClose = (reload = "", outageRequest = "") => {
    this.setState({ viewshow: false });
    this.updateOutageRequestState(reload, outageRequest);
  };

  updateOutageRequestState(reload, outageRequest) {
    if (reload) {
      console.log(outageRequest);
      this.props.onApprovalRequestChange(outageRequest);
    }
  }

  render() {
    // if (this.props.fromComponent == "onGoing") {
    //   this.columns.push(this.disableColumn);
    // }
    const { linkOutages, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={linkOutages}
        ></Table>

        <Suspense fallback={<div>Loading...</div>}>
          <LinkOutageApprovalModal
            show={this.state.show}
            OnClose={this.handleClose}
            outageRequest={this.state.outageRequest}
            mvalue={this.props.mvalue}
          ></LinkOutageApprovalModal>
          <LinkOutageViewlModal
            viewshow={this.state.viewshow}
            OnClose={this.handleViewClose}
            outageRequest={this.state.outageRequest}
            mvalue={this.props.mvalue}
          ></LinkOutageViewlModal>
        </Suspense>
      </React.Fragment>
    );
  }
}

export default COA1Table;
