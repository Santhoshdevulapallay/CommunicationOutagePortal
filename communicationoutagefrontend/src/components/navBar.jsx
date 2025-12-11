import React from "react";
import { NavLink } from "react-router-dom";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";

const TopNavBar = ({ user }) => {
  console.log("TopNavBar render with user:", user);
  return (
    <Navbar collapseOnSelect expand="lg" bg="primary" variant="dark">
      <Navbar.Brand href="#home">Communication Outage 
        Portal </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        {user && !user.isOperator && !user.isscadaOperator &&(
          <Nav className="mr-auto">
            <NavLink className="nav-item nav-link" to="/meetings">
              <i className="fa fa-suitcase" aria-hidden="true"></i> Meetings
            </NavLink>

            <NavDropdown title={<span><i className="fa fa-link" aria-hidden="true"></i> Links</span>} id="meetings-dropdown">
              <NavDropdown.Item as={NavLink} to="/links">
                Links
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/linksByMonth">
                Links By Month
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title={<span><i className="fa fa-microchip" aria-hidden="true"></i> Equipments</span>} id="meetings-dropdown">
              <NavDropdown.Item as={NavLink} to="/equipments">
                Equipments
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/equipmentsByMonth">
                Equipments By Month
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title={<span><i className="fa fa-share" aria-hidden="true"></i> Link Outages</span>} id="meetings-dropdown">
              <NavDropdown.Item as={NavLink} to="/coa1">
                COA1
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/cod1">
                COD1
              </NavDropdown.Item>
            </NavDropdown>
          

            <NavDropdown title={<span><i className="fa fa-share" aria-hidden="true"></i> Equipment Outages</span>} id="meetings-dropdown">
              <NavDropdown.Item as={NavLink} to="/coa2">
                COA2
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/cod2">
                COD2
              </NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title={<span><i className="fa fa-table" aria-hidden="true"></i> Reports</span>} id="meetings-dropdown">
              <NavDropdown.Item as={NavLink} to="/cod3">
                Rolling Report
              </NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/monthsummary">
                Monthly Summary
              </NavDropdown.Item>
            </NavDropdown>
          
          
              <NavDropdown title={<span><i  aria-hidden="true"></i> Telemetry</span>} id="meetings-dropdown">
               
               <NavDropdown.Item as={NavLink} to="/discrepencyLinks">
                  Dashboard
                </NavDropdown.Item>
                  
              { ( user && user?.isState === 'true')  && (
                <>
                    <NavDropdown.Item as={NavLink} to="/telemetry_monthsummary">
                      Month Summary
                    </NavDropdown.Item>
                  
                    <NavDropdown.Item as={NavLink} to="/intrastate/newrequest">
                     Intra State New Request
                    </NavDropdown.Item>
                </>
                )}
              
                {user && user?.isSupervisor && (
                <>
                    {/* <NavDropdown.Item as={NavLink} to="/fileupload">
                      Bulk Upload
                    </NavDropdown.Item> */}
                  
                    
                    <NavDropdown.Item as={NavLink} to="/generateLetter">
                      Gen Letter
                    </NavDropdown.Item>
                  
                    <NavDropdown title={<span style={{ color: 'black' , padding: '10px' }}>Intra State  </span>}  drop="end">
                      <NavDropdown.Item as={NavLink} to="/intrastate/newrequest">
                        New Request
                      </NavDropdown.Item>  
                      <NavDropdown.Item as={NavLink} to="/intrastate/allrequests">
                        All Requests
                      </NavDropdown.Item>
                    </NavDropdown>
                  
                    <NavDropdown title={<span style={{ color: 'black' , padding: '10px' }}>RTU  </span>}  drop="end">
                      <NavDropdown.Item as={NavLink} to="/rtu/notreporting">
                        Daily Report
                      </NavDropdown.Item>
                      <NavDropdown.Item as={NavLink} to="/rtu/masterdata">
                        Master Data
                      </NavDropdown.Item>
                    </NavDropdown>
                  
                    <NavDropdown title={<span style={{ color: 'black' , padding: '10px' }}>SCADA  </span>}  drop="end">
                        <NavDropdown.Item as={NavLink} to="/scada_master">
                          Master Data
                        </NavDropdown.Item>
                        <NavDropdown.Item as={NavLink} to="/ScadaPointsfileupload">
                          File
                        </NavDropdown.Item>
                      </NavDropdown>
                  </>  
                )}
              </NavDropdown>
            
            </Nav>
          )}
          {user && user.isOperator && (
            <Nav className="mr-auto">
              <NavLink className="nav-item nav-link" to="/coa1">
                <i className="fa fa-check" aria-hidden="true"></i> COA1
              </NavLink>
              <NavLink className="nav-item nav-link" to="/coa2">
                <i className="fa fa-check" aria-hidden="true"></i> COA2
              </NavLink>
            
            </Nav>
          )}
        
          {user && user.isscadaOperator && (
            <Nav className="mr-auto">
              <NavLink className="nav-item nav-link" to="/rtu/notreporting">
                Daily Report
              </NavLink>
              <NavLink className="nav-item nav-link" to="/rtu/masterdata">
                 Master Data
              </NavLink>
            </Nav>
          )}
          <Nav>
          
          {user && (
              <React.Fragment>
                <NavLink className="nav-item nav-link" to="/profile">
                  <i className="fa fa-user" aria-hidden="true"></i>{" "}
                  {user.userName}
                </NavLink>
                <NavLink className="nav-item nav-link" to="/logout">
                  <i className="fa fa-sign-out" aria-hidden="true"></i> Logout
                </NavLink>
              </React.Fragment>
            )}
          </Nav>
        </Navbar.Collapse>
        </Navbar>
  );
};

export default TopNavBar;
