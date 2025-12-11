import React, { useState } from "react";
import { NavLink } from "react-router-dom"
import { Nav } from "react-bootstrap";
import useStationContext from "../../../context/stationSummary";
import { Table, TableContainer, TableBody, TableRow, TableCell,} from "@material-ui/core";
import useUserSearchParamsContext from "../../../context/userSearchParams";
import HeaderSorting from "../MaterialUITable/HeaderSorting";
import { TableDataContextProvider } from "../../../context/tableData";
import EnhancedRow from "../MaterialUITable/EnhancedRow";
import './TableStyles.css'; 

const headCells = [
    // {
    //     key : true,
    //     id : 'substation_code'
    // },
    {
        key : false,
        id : 'id',
        label : 'Sl No'
    },
    {
        key : false,
        id : 'substation',
        numeric : false,
        isSorting : false,
        label : 'Substation Name'
    },
    {
        key : false,
        id : 'Voltage_Level',
        numeric : false,
        isSorting : true,
        label : 'Voltage Level'
    },
    {
        key : false,
        id : 'analog_completely_not_reporting_points',
        numeric : true,
        isSorting : true,
        label : 'No. of Non Reporting Analog Points'
    },
    {
        key : false,
        id : 'analog_no_of_points',
        numeric : true,
        isSorting : true,
        label : 'No. of Analog Points'
    },
    {
        key : false,
        id : 'analog_percentage_number_of_points_non_reporting',
        numeric : true,
        isSorting : true,
        label : 'Analog Substation Non Observability(%)'
    },
    {
        key : false,
        id : 'digital_completely_not_reporting_points',
        numeric : true,
        isSorting : true,
        label : 'No. of Non Reporting Digital Points'
    },
    {
        key : false,
        id : 'digital_no_of_points',
        numeric : true,
        isSorting : true,
        label : 'No. of Digital Points'
    },
    {
        key : false,
        id : 'digital_percentage_number_of_points_non_reporting',
        numeric : true,
        isSorting : true,
        label : 'Digital Substation Non Observability(%)'
    },
    {
        key : false,
        id : 'functionCall',
        numeric : false,
        isSorting : false,
        label : '',
    }
]

function StationDetailsTable(){

    const { userSearchParams } = useUserSearchParamsContext();
    const [ stationSummaryList ] = useStationContext();
    const [ order, setOrder ] = useState('desc');
    const [ orderBy, setOrderBy ] = useState('percentage_number_of_points_non_reporting');

    const tableState = {
        headCells,
        order,
        setOrder,
        orderBy,
        setOrderBy
    }
    stationSummaryList.forEach((station) => {
        station.key = station.substation_code;
        station.functionCall = function renderNavLinks(){
            return (
                <Nav>
                    <NavLink
                    className="nav-item nav-link"
                    to={{
                        pathname:
                        userSearchParams["category"] === "ALL"
                            ? "/pointDetails"
                            : "/digitalPointSummary",
                        state: {
                        ...userSearchParams,
                        substation: station.substation,
                        },
                    }}
                    >
                    <button type="button" className="btn btn-outline-primary w-100">
                        Show Details
                    </button>
                    </NavLink>
                </Nav>
            )
        }
    });

    
    return (
        <>
        {stationSummaryList && stationSummaryList?.length <= 0 && (
            <div className="container mt-2 d-flex justify-content-center">
                <h2>No Data to Display</h2>
            </div>
        )}
        {stationSummaryList && stationSummaryList.length > 0 && (
            <>
            <div className="container mt-2 d-flex justify-content-center gap-2">
                <h2>Substation's Summary</h2>
            </div>
            <div className="container-fluid">
                <TableDataContextProvider value={tableState}>
                    <TableContainer className="table-container">
                        <Table className="table">
                            <HeaderSorting 
                            order={order}
                            orderBy={orderBy}
                            headCells={headCells}
                            selectAllCheckBox={false}
                            />
                            <TableBody>
                                <EnhancedRow
                                    rowSelection={false}
                                    pointDetails={stationSummaryList}
                                    order={order}
                                    orderBy={orderBy}
                                />
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TableDataContextProvider>
                        
            </div>
            </>
        )}
        </>
    )
}

export default StationDetailsTable;