// CardContainer.jsx
import React from "react";

const CardContainer = ({ title, children }) => {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header py-2 fw-bold">{title}</div>
      <div className="card-body py-2">{children}</div>
    </div>
  );
};

export default CardContainer;
