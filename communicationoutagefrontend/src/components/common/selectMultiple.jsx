import React from "react";
import Select from "@atlaskit/select";

const SelectMultiple = ({ name, label, options, error, ...rest }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <Select
        {...rest}
        name={name}
        id={name}
        className="multi-select"
        classNamePrefix="react-select"
        options={options}
        isMulti
        isSearchable={true}
        placeholder={label}
      />
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default SelectMultiple;
