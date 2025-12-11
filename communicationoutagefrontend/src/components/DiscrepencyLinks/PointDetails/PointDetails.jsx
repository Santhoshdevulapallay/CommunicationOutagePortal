import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Table, TableContainer, TableBody, TableCell, TableRow, Checkbox } from "@material-ui/core"
// import { postPointDetailsForSpecificSubstationAndSpecificMonthYearID } from "../../../services/substationService"
import { toast } from "react-toastify";
import { postPointDetailsForSpecificSubstationAndSpecificMonthYearID , approvePointDetails } from "../../../services/djangoService"

import HeaderSorting from "../MaterialUITable/HeaderSorting";
import { TableDataContextProvider } from "../../../context/tableData";
import ModalSubmitStatusRemarks from "./ModalSubmitStatusRemarks";
import { UserSearchParamsContextProvider } from "../../../context/userSearchParams";
import EnhancedRow from "../MaterialUITable/EnhancedRow";
import '../StationSearchDetails/TableStyles.css'; 

import loadingGif from '../../../assets/Loading_icon.gif';

import { scadaPointHistory } from "../../../services/djangoService"
import Modal from "react-bootstrap/Modal";
import { formatDate } from "../../../context/dateUtils";
import { NavLink } from "react-router-dom"
import { Nav } from "react-bootstrap";

const headCells = [
    {
        key : false,
        id : 'category',
        numeric : false,
        isSorting : true,
        label : 'Category'
    },
    {
        key : false,
        id : 'ELEMENT_DESCRIPTION',
        numeric : false,
        isSorting : true,
        label : 'Ele Description'
    },
    {
        key : false,
        id : 'element_category',
        numeric : false,
        isSorting : true,
        label : 'Ele Category'
    },
    {
        key : false,
        id : 'metric_type',
        numeric : false,
        isSorting : true,
        label : 'Metric Type'
    },
    {
        key : false,
        id : 'non_availability_percentage',
        numeric : true,
        isSorting : false,
        label : 'No. of Non Available Time Instances'
    },
    {
        key : false,
        id : 'non_availability_percentage_prevmonth',
        numeric : true,
        isSorting : true,
        label : 'Non Availability Percentage Prev Month'
    },
    {
        key : false,
        id : 'status',
        numeric : false,
        isSorting : false,
        label : 'Status'
    },
    {
        key : false,
        id : 'remarks',
        numeric : false,
        isSorting : false,
        label : 'Remarks'
    },
    {
        key : false,
        id : 'timeline',
        numeric : false,
        isSorting : false,
        label : 'TimeLine'
    },
    {
        key : false,
        id : 'admin_remarks',
        numeric : false,
        isSorting : false,
        label : 'Admin Remarks'
    },
    {
        key : false,
        id : 'approved_status',
        numeric : false,
        isSorting : false,
        label : 'Approval Status'
    },
    {
        key : true,
        id : '',
        numeric : false,
        isSorting : false,
        label : 'History'
    }
]

function SelectedPointsAppBar(props) {
    const { substationName, selectedPointDetails, showSelectedPointDetails, clearAll, approveAdmin } = props
    const location = useLocation();
    return (
        <>
            <div className="d-flex" style={{ marginTop : "10px "}}>
                <h4>Substation Name : {substationName}</h4>
            </div>
            <div className="row">
                <div className="col-md-2">
                    <Nav>
                        <NavLink 
                            className="nav-item nav-link" 
                            to={{
                                pathname: "/telemetry_monthsummary",
                                state: location.state // <--- Pass the existing search params back!
                            }}
                        >
                            <button type="button" className="btn btn-outline-danger">
                                Go to Month Summary
                            </button>
                        </NavLink>
                        
                        {/* <NavLink className="nav-item nav-link" to={{pathname: "/telemetry_monthsummary"}}>
                            <button type="button" className="btn btn-outline-danger">
                                Go to Month Summary
                            </button>
                        </NavLink> */}
                    </Nav>
                </div>
            </div>
            <div className="d-flex gap-2" style={{ minHeight: "60px" }}>
                {selectedPointDetails && selectedPointDetails.length > 0 && (
                    <>
                    <button type="button" className="btn btn-outline-primary mt-3"
                    onClick={() => showSelectedPointDetails()} 
                    >
                    Show Selected Points
                    </button>
                    <button type="button" className="btn btn-outline-primary mt-3"
                    onClick={() => clearAll()}
                    >Clear All</button>
                    <button type="button" className="btn btn-success mt-3"
                    onClick={() => approveAdmin()}
                    >Approve</button>
                    </>
                )}
            </div>
        </>
    )
}

function PointDetails(){

    const location = useLocation(); // To access state passed via navigation
    const [ isLoading, setIsLoading ] = useState(false);
    const [ selectPointDetails, setSelectPointDetails ] = useState([]);
    const [ pointDetails, setPointDetails ] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedHistoryRowData, setSelectedHistoryRowData] = useState([]);

    const [ order, setOrder ] = useState('desc');
    const [ orderBy, setOrderBy ] = useState('non_availability_percentage');

    const tableState = {
        selectPointDetails, 
        setSelectPointDetails,
        pointDetails,
        order,
        setOrder,
        orderBy,
        setOrderBy
    }

    const handleClearAll = () => {
        setSelectPointDetails([]);
    }

    const handleModalBox = () => {
        setShowModal((prevState) => !prevState);
    }

    const handleApprove = async() => {
        try {
            setIsLoading(true);
            const res = await approvePointDetails(selectPointDetails);
            setIsLoading(false);
            if (res['status']) {
                toast.success("Point Details are Approved Successfully")
                handleClearAll()
            } else {
                toast.error("Failed to Approve , Try later")
            }
        }
        catch (err) {
            setIsLoading(false);
            toast.error(`Bad Request to Server `);
        }
    }

    useEffect(() => {
        (async() => {
            setIsLoading(true);
            const response = await postPointDetailsForSpecificSubstationAndSpecificMonthYearID(location?.state);
            
            setPointDetails(response?.data)
            setIsLoading(false);
        })();
    }, [location?.state, showModal])

     // Callback to handle modal data
    const handleModalOpen = async (point) => {
        setIsLoading(true); // Start loading
        try {
            // Replace with your API endpoint
            const response = await scadaPointHistory(point)
            setSelectedHistoryRowData(response?.data);
            setShowHistoryModal(true);
            
        } catch (error) {
            toast.success("Error fetching data:")
        } finally {
            setIsLoading(false); // End loading
        }
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
    }

    return (
        <>
        {isLoading && (
            <div className="container col-2 z-1">
                <img src={loadingGif} alt="Loading" />
            </div>
        )}
        <SelectedPointsAppBar
            substationName={location?.state?.substation}
            selectedPointDetails={selectPointDetails}
            showSelectedPointDetails={handleModalBox}
            clearAll={handleClearAll}
            approveAdmin={handleApprove}
        />
        <div className="container-fluid">
            <TableDataContextProvider value={tableState}>
                <TableContainer className="table-container">
                    <Table className="table">
                        <HeaderSorting 
                        order={order}
                        orderBy={orderBy}
                        numSelected={selectPointDetails.length}
                        rowCount={pointDetails.length}
                        headCells={headCells}
                        selectAllCheckBox={true}
                        />
                        <TableBody>
                            <EnhancedRow
                                rowSelection={true}
                                pointDetails={pointDetails}
                                order={order}
                                orderBy={orderBy}
                                onRowAction={handleModalOpen}   
                            >
                            </EnhancedRow>
                            
                        </TableBody>
                    </Table>
                    {showModal && (
                        <>
                        <UserSearchParamsContextProvider value={location?.state}>
                            <ModalSubmitStatusRemarks
                            showModal={showModal}
                            closeModal={handleModalBox}
                            />
                        </UserSearchParamsContextProvider>
                        </>
                        )}
                        
                    {showHistoryModal && (
                        <>
                           <Modal
                            show={showHistoryModal}
                            onHide={() => closeHistoryModal()}
                            dialogClassName="modal-90w"
                            aria-labelledby="example-custom-modal-styling-title"
                            >
                                <Modal.Header closeButton>
                                    <Modal.Title id="examCustom Mople-custom-modal-styling-title">
                                        Analog Point History
                                    </Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    {selectedHistoryRowData && selectedHistoryRowData.length > 0 ? (
                                        <table className="table table-striped table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Sl No</th>
                                                    <th>Point Name</th>
                                                    <th>Month Year ID</th>
                                                    <th>Remarks</th>
                                                    <th>Time Line</th>
                                                    <th>Status</th>
                                                    <th>Approved Staus</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedHistoryRowData.map((row, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{row.point_name}</td>
                                                        <td>{row.monthyearid}</td>
                                                        <td>{row.remarks}</td>
                                                        <td>{formatDate(row.timeline)}</td>
                                                        <td>{row.status}</td>
                                                        <td>{row.approved_status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        ) : (
                                            <h3>No history data available</h3>
                                    )}       
                                </Modal.Body>
                            </Modal>
                        </>
                    )}
                </TableContainer>
            </TableDataContextProvider>
        </div>
        </>
    )
}

export default PointDetails;