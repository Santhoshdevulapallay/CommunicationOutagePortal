import React from "react";

const TextArea = ({ name, label, error, type, ...rest }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <textarea
        {...rest}
        className="form-control"
        name={name}
        id={name}
        rows="2"
      />
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default TextArea;
