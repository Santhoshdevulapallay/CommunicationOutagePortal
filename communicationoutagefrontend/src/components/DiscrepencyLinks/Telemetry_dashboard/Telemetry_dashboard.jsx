import  { useState } from "react";
import MyPlotlyChart from './Plotly_chart';
import MonthRangeForm from "./MonthRangeForm";
import RemarksTable from "./RemarksTable";
import TimelineTable from "./TimelineTable";
import NotReportingTable from "./notReportingTable";
import NotRectifiedTable from "./notRectifiedTable";
import useUserContext from "../../../context/user";

const TelemetryDashboard = () => {

  const getDefaultMonthRange = () => {
    const today = new Date();
    const endMonth = today.toISOString().slice(0, 7);
    const startMonthDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const startMonth = startMonthDate.toISOString().slice(0, 7);
    return { startMonth, endMonth };
  };

  const [monthRange, setMonthRange] = useState(getDefaultMonthRange());
  const [activeView, setActiveView] = useState("point");
  const [systemType, setSystemType] = useState("SCADA"); // new dropdown value

  const handleMonthChange = (newRange) => {
    setMonthRange(newRange);
  };

  // --- Button handlers ---
  const handleMonthSubmit = () => setActiveView("point");
  const handleRemarksDetails = () => setActiveView("remarks");
  const handleTimelineDetails = () => setActiveView("timeline");
  const handlenotReportingDetails = () => setActiveView("notReporting");
  const handlenotRectifiedDetails = () => setActiveView("notRectified");

  // --- Dropdown Change Handler ---
  const handleSystemTypeChange = (e) => {
    setSystemType(e.target.value);
  };

  const userContext = useUserContext();
  // --- Data to pass to backend ---
  const commonProps = {
    startMonth: monthRange.startMonth,
    endMonth: monthRange.endMonth,
    systemType: systemType,
    entityName : userContext?.SCADA_NAME || userContext?.userName || ""
  };

  return (
    <div className="container-fluid mt-3">
      <fieldset className="border p-4">
        <legend className="w-auto">Search Details</legend>

            <div className="row mb-3">
                <div className="col-md-3">
                    <label className="form-label fw-bold">System Type</label>
                    <select
                        className="form-select form-select-sm"
                        value={systemType}
                        onChange={handleSystemTypeChange}
                    >
                        <option value="Select">Select</option>
                        <option value="SCADA">SCADA</option>
                        <option value="REMC">REMC</option>
                    </select>
                </div>
                <div className="col-md-4">
                    <MonthRangeForm
                    startMonth={monthRange.startMonth}
                    endMonth={monthRange.endMonth}
                    onChange={handleMonthChange}
                    />
                </div>
            </div>

        <div className="mb-3">
          <button
            type="button"
            className="btn btn-sm btn-primary me-2"
            onClick={handleMonthSubmit}
            disabled={systemType === "Select"}
          >
            Point Details
          </button>

          <button
            type="button"
            className="btn btn-sm btn-warning me-2"
            onClick={handleRemarksDetails}
            disabled={systemType === "Select"}
          >
            Remarks Details
          </button>

          <button
            type="button"
            className="btn btn-sm btn-success me-2"
            onClick={handleTimelineDetails}
            disabled={systemType === "Select"}
          >
            Timeline Details
          </button>

          <button
            type="button"
            className="btn btn-sm btn-danger me-2"
            onClick={handlenotReportingDetails}
            disabled={systemType === "Select"}
          >
            Not Resolved (after Timeline)
          </button>

          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={handlenotRectifiedDetails}
            disabled={systemType === "Select"}
          >
            Not Rectified
          </button>
        </div>

        <div className="mt-4">
          {activeView === "point" && (
            <MyPlotlyChart {...commonProps} />
          )}
          {activeView === "remarks" && (
            <RemarksTable {...commonProps} />
          )}
          {activeView === "timeline" && (
            <TimelineTable {...commonProps} />
          )}
          {activeView === "notReporting" && (
            <NotReportingTable {...commonProps} />
          )}
          {activeView === "notRectified" && (
            <NotRectifiedTable {...commonProps} />
          )}
        </div>
      </fieldset>
    </div>
  );
};

export default TelemetryDashboard;
