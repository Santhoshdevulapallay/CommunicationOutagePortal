import React from "react";
import Form from "./common/form";
import Joi from "joi-browser";
import auth from "../services/authService";
import { Redirect } from "react-router-dom";
import Background from "../assets/network.gif";
import { Card, Button } from "react-bootstrap";
import ReCAPTCHA from "react-google-recaptcha";


class LoginForm extends Form {
  state = {
    data: { username: "", password: "" },
    errors: {},
    verified: false
    // verified: true
  };

  schema = {
    username: Joi.string().min(4).max(20).required().label("Username"),
    password: Joi.string().min(5).max(20).required().label("Password"),
  };

  doSubmit = async () => {
    if(this.state.verified){
      try {
        const { data } = this.state;
        const { state } = this.props.location;
        await auth.login(data.username, data.password);
        window.location = state ? state.from.pathname : "/";
      } catch (ex) {
        if (ex.response && ex.response.status === 400) {
          const errors = { ...this.state.errors };
          errors.username = ex.response.data;
          this.setState({ errors });
        }
      }
    }
    else{
      alert("Please verify captcha")
    }
  };
  onChange=(value)=> {
    this.setState({verified:true})
  }
  render() {
    const user = auth.getCurrentUser();
    
    if (user) {
      if (user.isOperator) {
        return <Redirect to="/coa1" />;
      } else if (user.isscadaOperator) {
        return <Redirect to="/rtu/notreporting" />;
      } 
      return <Redirect to="/meetings" />;
    }
    return (
      <div className="container-fluid">
        <br></br>
        <br></br>
        <div className="row">
          <div className="col-md-4"></div>
          <div className="col-md-4">
            <br></br>
            <Card>
              <Card.Header className="bg-light text-center text-muted">
                <b>SRLDC Communication Outage Portal</b>
              </Card.Header>
              <Card.Body style={{ backgroundImage: `url(${Background})` }}>
                <h2 style={{ textAlign: "center" }}>
                  <img
                    src={require("../assets/POSOCO_Logo.jpg")}
                    alt="loading..."
                    style={{ width: 72, height: 72 }}
                  />{" "}
                </h2>
                <form onSubmit={this.handleSubmit}>
                  {this.renderInput("username", "Username")}
                  {this.renderInput("password", "Password", "", "password")}
                  <br></br>
                   <ReCAPTCHA
                    sitekey="6LcEGBsbAAAAAKeMTxKUfwXGOJ5EWwjk-tHMYv0F"
                    onChange={this.onChange}
                  />  
                  <br></br>
                  {this.renderButton("Login")}
                </form>
                <br></br>
              </Card.Body>
              <Card.Footer className="text-muted"></Card.Footer>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginForm;
