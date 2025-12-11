import { TableDataContextProvider } from "../../../context/tableData";
import HeaderSorting from "../MaterialUITable/HeaderSorting";
import { Table, TableContainer, TableBody, TableRow, TableCell,} from "@material-ui/core";
import useSubmitStatusRemarksContext from "../../../context/submitStatusRemarks";

const headCells = [
    
    {
        key : false,
        id : 'element_description',
        numeric : false,
        isSorting : false,
        label : 'Element Description'
    },
    {
        key : false,
        id : 'element_category',
        numeric : false,
        isSorting : false,
        label : 'Element Category'
    },
    {
        key : false,
        id : 'metric_type',
        numeric : false,
        isSorting : false,
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
        isSorting : false,
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
    }
]

function DisplayPointTable(){

    const { selectPointDetails } = useSubmitStatusRemarksContext();
    return (
        <>
        <TableDataContextProvider value={{}}>
            <TableContainer>
                <Table>
                    <HeaderSorting 
                    headCells={headCells}
                    />
                    <TableBody>
                        {selectPointDetails && selectPointDetails.length > 0
                        && selectPointDetails.map((point , index) => {
                            return (
                                <TableRow
                                key={index}>
                                    <TableCell>{point.ELEMENT_DESCRIPTION}</TableCell>
                                    <TableCell>{point.ELEMENT_CATEGORY}</TableCell>
                                    <TableCell>{point.Metric_Type}</TableCell>
                                    <TableCell align="right">{point.non_availability_percentage}</TableCell>
                                    <TableCell align="right">{point.non_availability_percentage_prevmonth}</TableCell>
                                    <TableCell>{point.status}</TableCell>
                                    <TableCell>{point.remarks}</TableCell>
                                    <TableCell>{point.timeLine}</TableCell>
                                    <TableCell>{point.admin_remarks}</TableCell>
                                    <TableCell>{point.approved_status}</TableCell>
                            </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableDataContextProvider>
        </>
    )
}

export default DisplayPointTable;