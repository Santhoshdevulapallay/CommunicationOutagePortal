import React from "react";

const SearchField = ({id, onChange }) => {
  return (
    <input
      id={id}
      type="text"
      name="query"
      className="form-control my-3"
      placeholder={"Search "+id+"..."}
     
      onChange={(e) => onChange(e.currentTarget.id,e.currentTarget.value)}
    ></input>
  );
};

export default SearchField;
