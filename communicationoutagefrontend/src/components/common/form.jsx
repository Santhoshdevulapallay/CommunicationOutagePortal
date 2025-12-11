import React, { Component } from "react";
import Joi from "joi-browser";
import Input from "./input";
import SelectMultiple from "./selectMultiple";
import Select from "@atlaskit/select";

import TextArea from "./textArea";

class Form extends Component {
  state = {
    data: {},
    errors: {},
  };
  validate = () => {
    const options = { abortEarly: false };
    const { error } = Joi.validate(this.state.data, this.schema, options);
    if (!error) return null;

    const errors = {};
    for (let item of error.details) errors[item.path[0]] = item.message;
    console.log(errors);
    return errors;
  };
  handleSubmit = (e) => {
    e.preventDefault();
    //call to the server and do necessary change and redirect the page
    const errors = this.validate();
    this.setState({ errors: errors || {} });
    if (errors) return;
    this.doSubmit();
  };

  validateProperty = ({ name, value }) => {
    const obj = { [name]: value };
    const schema = { [name]: this.schema[name] };
    const { error } = Joi.validate(obj, schema);
    return error ? error.details[0].message : null;
  };

  handleChange = ({ currentTarget: input }) => {
    const errors = { ...this.state.errors };
    const errorMessage = this.validateProperty(input);
    if (errorMessage) errors[input.name] = errorMessage;
    else delete errors[input.name];

    const data = { ...this.state.data };
    data[input.name] = input.value;
    this.setState({ data, errors });
  };

  renderButton = (label) => {
    return (
      <button disabled={this.validate()} className="btn btn-primary">
        {label}
      </button>
    );
  };

  renderInput = (name, label, disabledval = "", type = "text") => {
    const { data, errors } = this.state;

    return (
      <Input
        type={type}
        name={name}
        value={data[name]}
        label={label}
        error={errors[name]}
        onChange={this.handleChange}
        disabled={disabledval}
        autocomplete="off"
      ></Input>
    );
  };
  renderTextArea = (name, label, disabledval = "") => {
    const { data, errors } = this.state;
    return (
      <TextArea
        name={name}
        value={data[name]}
        label={label}
        error={errors[name]}
        onChange={this.handleChange}
        disabled={disabledval}
      ></TextArea>
    );
  };

  handleMultiSelectChange = (name, value) => {
    const { data } = this.state;
    data[name] = value;
    const errors = this.validate();
    this.setState({ errors: errors || {} });
    this.setState({ data });
  };

  handleSelectChange = (value, name) => {
    const { data } = this.state;
    data[name] = value;
    
    this.setState({ data });
    const errors = this.validate();
    this.setState({ errors: errors || {} });
  };

  renderMultipleSelect = (name, label, options, disabled = "") => {
    const { data, errors } = this.state;
    return (
      <SelectMultiple
        name={name}
        value={data[name]}
        options={options}
        label={label}
        error={errors[name]}
        isDisabled={disabled}
        onChange={(value) => this.handleMultiSelectChange(name, value)}
      ></SelectMultiple>
    );
  };

  renderSelect = (name, label, options, disabled = "") => {
    console.log(options);
    const { data, errors } = this.state;
    return (
      <React.Fragment>
        <label htmlFor="">{label}</label>
      <Select
        className="single-select"
        classNamePrefix="react-select"
        name={name}
        value={data[name]}
        options={options}
        label={label}
        error={errors[name]}
        isDisabled={disabled}
        onChange={(value) => this.handleSelectChange(value, name)}
      ></Select>
      </React.Fragment>
    );
  };
}

export default Form;
