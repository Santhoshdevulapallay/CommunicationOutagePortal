import React, { Component } from "react";
import _ from "lodash";
import { Link } from "react-router-dom";

import auth from "../../services/authService";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { changePassword } from "../../services/userService";
import { Formik, Form, Field } from "formik";
import { TextField } from "formik-material-ui";
import { Button, LinearProgress } from "@material-ui/core";

class Profile extends Component {
  state = {
    initialValues: {
      password: "",
      confirmPassword: "",
    },
  };

  validationSchema = Yup.object({
    password: Yup.string().min(5).required("Password is required"),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref("password"), null],
      "Passwords must match"
    ),
  });

  handleSubmit = (values, onSubmitProps) => {
    setTimeout(async () => {
      var data = {};
      data["password"] = values.password;
      try {
        const user = await changePassword(data);
        toast.success("Success");
        onSubmitProps.setSubmitting(false);
      } catch (ex) {
        if (ex.response && ex.response.status >= 400) {
          toast.error(ex.response.data);
          onSubmitProps.setSubmitting(false);
        }
      }
    }, 500);
  };

  render() {
    const user = auth.getCurrentUser();

    return (
      <div className="row">
        <div className="col-1"></div>
        <div className="className col-10">
          <br></br>

          <Formik
            initialValues={this.state.initialValues}
            validationSchema={this.validationSchema}
            onSubmit={this.handleSubmit}
          >
            {(formik) => (
              <Form onSubmit={formik.handleSubmit}>
                {formik.isSubmitting && <LinearProgress />}
                {console.log()}

                <br></br>
                <div className="row">
                  <div className="col-md-6">
                    <Field
                      component={TextField}
                      label="Password"
                      name="password"
                      variant="outlined"
                      fullWidth={true}
                      type="password"
                    />
                  </div>
                </div>
                <br></br>
                <div className="row">
                  <div className="col-md-6">
                    <Field
                      component={TextField}
                      label="Confirm Password"
                      name="confirmPassword"
                      variant="outlined"
                      fullWidth={true}
                      type="password"
                    />
                  </div>
                </div>
                <br></br>
                <div className="row">
                  <div className="col-md-3">
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={formik.isSubmitting}
                      onClick={formik.submitForm}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  }
}

export default Profile;
