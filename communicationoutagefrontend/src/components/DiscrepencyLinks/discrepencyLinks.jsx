import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from 'react-router-dom';
import useUserContext from "../../context/user";
import  TelemetryDashboard  from "../DiscrepencyLinks/Telemetry_dashboard/Telemetry_dashboard"

function DiscrepencyLinks(){

    const userContextVal = useUserContext();

    return (
        <>
            {/* {userContextVal && userContextVal.isSupervisor && (
                <Nav>
                    <NavLink className="nav-item nav-link" to="/fileupload">
                        <button type="button" className="btn btn-outline-primary">
                            For Bulk Uploading, Click Here
                        </button>
                    </NavLink>
                    <NavLink className="nav-item nav-link" to="/telemetry_monthsummary">
                        <button type="button" className="btn btn-outline-primary">
                            Month Summary Details , Click Here
                        </button>
                    </NavLink>
                </Nav>
            )} */}

            <TelemetryDashboard></TelemetryDashboard>
        
        </>
    )

}

export default DiscrepencyLinks;