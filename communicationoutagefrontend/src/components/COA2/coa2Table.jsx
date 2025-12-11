import React, { Component, Suspense } from "react";
import Table from "../common/table";
import auth from "../../services/authService";
import Button from "react-bootstrap/Button";
import { toast } from "react-toastify";
import { saveEquipmentOutage } from "../../services/equipmentOutageService";
import { generateEquipmentCode } from "../../services/equipmentOutageService";
import moment from "moment";

const EquipmentOutageApprovalModal = React.lazy(() =>
  import("./equipmentOutageApprovalModal")
);
const EquipmentOutageViewlModal = React.lazy(() =>
  import("./equipmentOutageViewModal")
);

class COA2Table extends Component {
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
      path: "equipment.description",
      label: "Description",
    },
    {
      path: "equipment.location",
      label: "Location",
    },
    { path: "reasonPrecautions", label: "Reason & Preacutions" },
  ];

  EditButton = {
    key: "Edit",
    content: (equipmentOutage) => (
      <span>
        {this.state.user.isAdmin && (
          <span>
            {" "}
            <Button
              variant="secondary"
              onClick={() => this.handleShow(equipmentOutage, "")}
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
              onClick={() => this.handleShow(equipmentOutage, "view")}
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
    content: (equipmentOutage) => (
      <span>
        <span>{equipmentOutage.Approvalstatus}</span>
      </span>
    ),
  };

  proposedStartDate = {
    path: "proposedStartDate",
    label: "Proposed StartDate",
    content: (equipmentOutage) => (
      <span>
        {moment(equipmentOutage.proposedStartDate)
          .local()
          .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };
  proposedEndDate = {
    path: "proposedEndDate",
    label: "Proposed EndDate",
    content: (equipmentOutage) => (
      <span>
        {moment(equipmentOutage.proposedEndDate)
          .local()
          .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };

  approvedStartDate = {
    path: "approvedStartDate",
    label: "Approved StartDate",
    content: (equipmentOutage) => (
      <span>
        {equipmentOutage.approvedStartDate &&
          moment(equipmentOutage.approvedStartDate)
            .local()
            .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };
  approvedEndDate = {
    path: "approvedEndDate",
    label: "Approved EndDate",
    content: (equipmentOutage) => (
      <span>
        {equipmentOutage.approvedEndDate &&
          moment(equipmentOutage.approvedEndDate)
            .local()
            .format("DD-MMM-YYYY HH:mm")}
      </span>
    ),
  };

  approveButton = {
    key: "ApproveButton",
    content: (equipmentOutage) => (
      <span>
        {equipmentOutage.Approvalstatus === "Pending" && (
          <Button
            variant="success"
            onClick={() => this.handleApprove(equipmentOutage, "Approved")}
          >
            <i class="fa fa-check" aria-hidden="true"></i>
          </Button>
        )}
      </span>
    ),
  };
  rejectButton = {
    key: "RejectButton",
    content: (equipmentOutage) => (
      <span>
        {equipmentOutage.Approvalstatus === "Pending" && (
          <Button
            variant="danger"
            onClick={() => this.handleApprove(equipmentOutage, "Rejected")}
          >
            <i class="fa fa-times" aria-hidden="true"></i>
          </Button>
        )}
      </span>
    ),
  };

  openingCodeButton = {
    key: "openingCodeButton",
    content: (equipmentOutage) => (
      <span>
        {!equipmentOutage.openingCode && (
          <Button
            variant="danger"
            onClick={() =>
              this.handleGenerateEquipmentCode(equipmentOutage, "opening")
            }
          >
            Opening Code
          </Button>
        )}
        {equipmentOutage.openingCode && equipmentOutage.openingCode}
      </span>
    ),
  };
  closingCodeButton = {
    key: "closingCodeButton",
    content: (equipmentOutage) => (
      <span>
        {!equipmentOutage.closingCode && (
          <Button
            variant="success"
            onClick={() =>
              this.handleGenerateEquipmentCode(equipmentOutage, "closing")
            }
          >
            Closing Code
          </Button>
        )}
        {equipmentOutage.openingCode && equipmentOutage.closingCode}
      </span>
    ),
  };

  d3mailStatus = {
    key: "d3mailStatus",
    label: "D-3 Intimation",
    content: (equipmentOutage) => (
      <span>
        {!equipmentOutage.d3mailStatus && (
          <Button variant="danger" disabled>
            <span>
              <i className="fa fa-window-close danger" aria-hidden="true"></i>
            </span>
          </Button>
        )}
        {equipmentOutage.d3mailStatus && (
          <Button variant="success" disabled>
            <span>
              <i className="fa fa-check " aria-hidden="true"></i>
            </span>
          </Button>
        )}
      </span>
    ),
  };

  handleApprove = async (equipmentOutage, status) => {
 
    try {
      await saveEquipmentOutage({
        _id: equipmentOutage._id,
        rpcRemarks: equipmentOutage.rpcRemarks,
        approvedStartDate: equipmentOutage.proposedStartDate,
        approvedEndDate: equipmentOutage.proposedEndDate,
        Approvalstatus: status,
      });
      if (status === "Approved") {
        toast.success("Successfully Approved Outage");
        equipmentOutage.approvedStartDate = equipmentOutage.proposedStartDate;
        equipmentOutage.approvedEndDate = equipmentOutage.proposedEndDate;
      } else {
        toast.error("Rejected Applied Outage");
        equipmentOutage.approvedStartDate = "";
        equipmentOutage.approvedEndDate = "";
      }

      equipmentOutage.Approvalstatus = status;

      this.handleClose("reload", equipmentOutage);
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error(ex.response.data);
        this.handleClose();
      }
    }
  };

  handleGenerateEquipmentCode = async (equipmentOutage, typeCode) => {
    try {
      const { data: equipmentout } = await generateEquipmentCode(
        {
          _id: equipmentOutage._id,
        },
        typeCode
      );

      if (typeCode === "opening") {
        toast.error("Successfully Generated Opening Code");
        equipmentOutage.openingCode = equipmentout.openingCode;
      } else {
        toast.success("Successfully Generated Closing Code");
        equipmentOutage.closingCode = equipmentout.closingCode;
      }

      this.handleClose("reload", equipmentOutage);
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
        this.handleClose();
      }
    }
  };

  DeleteButton = {
    key: "DeleteButton",
    content: (equipmentOutage) => (
      <span>
        {equipmentOutage.Approvalstatus === "Pending" && (
          <Button
            variant="danger"
            onClick={() => this.props.onDelete(equipmentOutage)}
          >
            <i className="fa fa-trash-o" aria-hidden="true"></i>
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
    const { equipmentOutages, sortColumn, onSort } = this.props;
    return (
      <React.Fragment>
        <Table
          columns={this.columns}
          sortColumn={sortColumn}
          onSort={onSort}
          data={equipmentOutages}
        ></Table>

        <Suspense fallback={<div>Loading...</div>}>
          <EquipmentOutageApprovalModal
            show={this.state.show}
            OnClose={this.handleClose}
            outageRequest={this.state.outageRequest}
            mvalue={this.props.mvalue}
          ></EquipmentOutageApprovalModal>
          <EquipmentOutageViewlModal
            viewshow={this.state.viewshow}
            OnClose={this.handleViewClose}
            outageRequest={this.state.outageRequest}
            mvalue={this.props.mvalue}
          ></EquipmentOutageViewlModal>
        </Suspense>
      </React.Fragment>
    );
  }
}

export default COA2Table;
