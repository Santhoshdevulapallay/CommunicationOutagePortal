import React from "react";
import '../../../../node_modules/bootstrap/dist/css/bootstrap.min.css';

const MonthRangeForm = ({ startMonth, endMonth, onChange }) => {
  return (
    <div className="d-flex flex-wrap gap-4 align-items-end mb-3">
      <div className="form-group">
        <label htmlFor="startMonth">Start Month:</label>
        <input
          type="month"
          className="form-control form-control-sm"
          id="startMonth"
          value={startMonth}
          onChange={(e) => onChange({ startMonth: e.target.value, endMonth })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="endMonth">End Month:</label>
        <input
          type="month"
          className="form-control form-control-sm"
          id="endMonth"
          value={endMonth}
          onChange={(e) => onChange({ startMonth, endMonth: e.target.value })}
        />
      </div>
    </div>
  );
};

export default MonthRangeForm;
