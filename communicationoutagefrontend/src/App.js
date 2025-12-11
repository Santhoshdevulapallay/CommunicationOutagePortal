import React, { Component } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import NavBar from "./components/navBar";
import auth from "./services/authService";

import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import LoginForm from "./components/loginForm";
import NotFound from "./components/notFound";
import Logout from "./components/logOut";
import ProtectedRoute from "./components/common/protectedRoute";
import Meetings from "./components/Meeting/meetings";
import Links from "./components//Links/links";
import LinksByMonth from "./components//Links/linksByMonth";
import LinkForm from "./components/Links/linkForm";
import Equipments from "./components/Equipment/equipments";
import EquipmentForm from "./components/Equipment/equipmentForm";
import COA1 from "./components/COA1/coa1";
import COD1 from "./components/COD1/cod1";
import COD3 from "./components/COD3/cod3";
import COA2 from "./components/COA2/coa2";
import COD2 from "./components/COD2/cod2";
import COD4 from "./components/COD4/cod4";
import MonthSummary from "./components/MonthSummary/monthsummary"
import LinkRequests from "./components/Links/NewLinkToDatabase/linkRequests";
import EquipmentRequests from "./components/Equipment/NewEquipmentToDatabase/equipmentRequests";
import Profile from "./components/Profile/profile";
import DiscreprencyLinks from "./components/DiscrepencyLinks/discrepencyLinks"
import GenerateLetter from "./components/DiscrepencyLinks/generateLetter"

import FileUploadForm from "./components/DiscrepencyLinks/FileUpload/FileUploadForm";
import PointDetails from "./components/DiscrepencyLinks/PointDetails/PointDetails";
import DigitalPointSummary from "./components/DiscrepencyLinks/DigitalPointDetails/DigitalPointDetails";
import { UserContextProvider } from "./context/user";
import TelemetryDashboard from './components/DiscrepencyLinks/Telemetry_dashboard/Telemetry_dashboard'
import TelemetryMonthSummary from "./components/DiscrepencyLinks/StationSearchDetails/TelemetryMonthSummary";

import RTUNonReportingForm from "./components/DiscrepencyLinks/RTUNotReporting/RTUForm";
import RTUMaster from "./components/DiscrepencyLinks/RTUNotReporting/RTUMaster";
import EquipmentsByMonth from "./components/Equipment/equipmentsByMonth";
import ScadaPoints from "./components/DiscrepencyLinks/SCADAPoints/ScadaPoints";
import IntraStateForm from "./components/DiscrepencyLinks/IntraState/IntraStateForm";
import IntraStateRequests from "./components/DiscrepencyLinks/IntraState/IntraStateRequests";

class App extends Component {
  state = {};
  userState = {};
  componentDidMount() {
    try {
      const user = auth.getCurrentUser(); 
      this.setState({ user });
      this.userState = user;
    } catch (ex) {}
  }
  render() {
   
    return (
      <React.Fragment>
        <NavBar user={this.state.user}></NavBar>
        <ToastContainer />
        <main role="main" className="container-fluid">
            <Switch>
              <Route path="/login" component={LoginForm}></Route>
              <Route path="/logout" component={Logout}></Route>
              <Redirect from="/" exact to="/login"></Redirect>
              <ProtectedRoute
                path="/links/:id"
                component={LinkForm}
              ></ProtectedRoute>
              
              <ProtectedRoute path="/coa1" component={COA1}></ProtectedRoute>
              <ProtectedRoute path="/coa2" component={COA2}></ProtectedRoute>
              <ProtectedRoute path="/cod1" component={COD1}></ProtectedRoute>
              <ProtectedRoute path="/cod2" component={COD2}></ProtectedRoute>
              <ProtectedRoute path="/cod3" component={COD3}></ProtectedRoute>
              <ProtectedRoute path="/cod4" component={COD4}></ProtectedRoute>
              <ProtectedRoute path="/monthsummary" component={MonthSummary}></ProtectedRoute>
              <ProtectedRoute path="/links" component={Links}></ProtectedRoute>
            <ProtectedRoute path="/linksByMonth" component={LinksByMonth}></ProtectedRoute>
            <ProtectedRoute path="/equipmentsByMonth" component={EquipmentsByMonth}></ProtectedRoute>
              <ProtectedRoute
                path="/linkRequests"
                component={LinkRequests}
              ></ProtectedRoute>
              <ProtectedRoute
                path="/equipmentRequests"
                component={EquipmentRequests}
              ></ProtectedRoute>
              <ProtectedRoute
                path="/meetings"
                component={Meetings}
              ></ProtectedRoute>
              <ProtectedRoute
                path="/profile"
                component={Profile}
              ></ProtectedRoute>

              <ProtectedRoute
                path="/equipments/:id"
                component={EquipmentForm}
              ></ProtectedRoute>
              <ProtectedRoute
                path="/equipments"
                component={Equipments}
              ></ProtectedRoute>

              {this.state.user && (
                <UserContextProvider value={this.state.user}>
                  <ProtectedRoute 
                    path="/discrepencyLinks"
                    component={DiscreprencyLinks}
                  ></ProtectedRoute>
                  
                  <ProtectedRoute
                      path="/pointDetails"
                      component={PointDetails}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                      path="/digitalPointSummary"
                      component={DigitalPointSummary}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/fileupload"
                    component={FileUploadForm}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/scada_master"
                    component={ScadaPoints}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/telemetry_dashboard"
                    component={TelemetryDashboard}
                  ></ProtectedRoute>
                  <ProtectedRoute
                    path="/telemetry_monthsummary"
                    component={TelemetryMonthSummary}
                  ></ProtectedRoute>
                  <ProtectedRoute
                    path="/generateLetter"
                    component={GenerateLetter}
                  ></ProtectedRoute>
                  <ProtectedRoute
                    path="/rtu/notreporting"
                    component={RTUNonReportingForm}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/rtu/masterdata"
                    component={RTUMaster}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/intrastate/newrequest"
                    component={IntraStateForm}
                  ></ProtectedRoute>
                
                  <ProtectedRoute
                    path="/intrastate/allrequests"
                    component={IntraStateRequests}
                  ></ProtectedRoute>
                
              </UserContextProvider>
              )}

              <Route path="/not-found" component={NotFound}></Route>
            </Switch>
        </main>
      </React.Fragment>
    );
  }
}

export default App;
