import React, { useEffect, useState } from "react";
import { TableCell, TableRow, Checkbox } from "@material-ui/core"
import useTableDataContext from "../../../context/tableData";
import { getComparator } from "./Utility";
import { formatDate } from '../../../context/dateUtils'



function EnhancedRow(props){

    const { rowSelection, pointDetails, order, orderBy , onRowAction  } = props;
    const { headCells, selectPointDetails, setSelectPointDetails } = useTableDataContext();
    

    const checkSelected = (point) => {
        const checkStatus = selectPointDetails.some((item) => item.id === point.id)
        return checkStatus
    }

    const handleRowSelectClick = (event, point) => {
        let newSelectedRows = []

        if (point.approved_status == 'Approved') {
            return newSelectedRows
        }
        
        setSelectPointDetails((prevSelectedRows) => {
           
            const isAlreadySelected = checkSelected(point);
            if (isAlreadySelected) {
              // Remove the row from selection
              newSelectedRows = prevSelectedRows.filter(item => item.id !== point.id );
            } else {
              // Add the row to the selection
              newSelectedRows =  [...prevSelectedRows, point];
            }
            return newSelectedRows
        });
    }

    const EnhancedRowsData = [...pointDetails].sort(getComparator(order, orderBy))
    return (
        <>
            {!rowSelection && EnhancedRowsData.map((row, index) => {
                return (
                    <TableRow key={index}>
                        {headCells.map((header, i) => {
                        //    if header column is id then first block else second block.This is to add extra column (Sl No).
                            return header.id === 'id' ? (
                                <TableCell key={i} >
                                    {index+1} 
                                </TableCell>
                            ) : (
                                <TableCell key={i} >
                                    {!header.key && (header.id === 'functionCall' ? row[header.id]() : row[header.id])}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                )
            })}

            {rowSelection && EnhancedRowsData.map((point , index) => {

                const isSelected = checkSelected(point)
                
                return (
                    <TableRow
                    key={index}
                    role="checkbox"
                    hover
                    tabIndex={-1}
                    selected={isSelected} >
                        <TableCell padding="checkbox" onClick={(event) => handleRowSelectClick(event, point)}>
                            <Checkbox
                            checked={isSelected} disabled={point.approved_status === 'Approved'} />
                        </TableCell>
                        <TableCell>{point.category}</TableCell>
                        <TableCell>{point.ELEMENT_DESCRIPTION}</TableCell>
                        <TableCell>{point.ELEMENT_CATEGORY}</TableCell>
                        <TableCell>{point.Metric_Type}</TableCell>
                        <TableCell align="right">{point.non_availability_percentage}</TableCell>
                        <TableCell align="right">{point.non_availability_percentage_prevmonth}</TableCell>
                        <TableCell>{point.status}</TableCell>
                        <TableCell>{point.remarks}</TableCell>
                        <TableCell>{formatDate(point.timeline)}</TableCell>
                        <TableCell>{point.admin_remarks}</TableCell>
                        <TableCell>{point.approved_status}</TableCell>
                        <TableCell> <button type="button" onClick={() => onRowAction(point)} className="btn btn-outline-primary">History</button></TableCell>
                    </TableRow>
                )
            })}
        </>
    )

}

export default EnhancedRow;