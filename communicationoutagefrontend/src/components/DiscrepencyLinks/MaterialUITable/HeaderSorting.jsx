import React from "react";
import useTableDataContext from "../../../context/tableData"
import { TableHead, TableRow, TableSortLabel, TableCell, Checkbox } from "@material-ui/core"

function HeaderSorting(props){

    const tableDataContext = useTableDataContext();

    const { onSelectAllClick, order, orderBy, 
            onRequestSort, numSelected, rowCount, 
            headCells, selectAllCheckBox } = props;

    const { setOrder, setOrderBy, pointDetails, setSelectPointDetails } = tableDataContext;

    const handleRequestSort = (event, property) => {
      const iAsc = orderBy === property && order === 'asc';
      setOrder(iAsc ? 'desc' : 'asc');
      setOrderBy(property);
  }

    const createSortHandler = (property) => (event) => {
      handleRequestSort(event, property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
          const newSelected = pointDetails.map((n) => n);
          setSelectPointDetails(newSelected);
          return;
        }
        setSelectPointDetails([]);
    };
  
    return (
      <TableHead>
        <TableRow>
            {selectAllCheckBox && (
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={handleSelectAllClick}
                        inputProps={{
                        'aria-label': 'select all points',
                        }}
                    />
                </TableCell>
            )}
          {headCells.map((headCell) => {
            if (headCell.isSorting){
                return (
                    (
                        <TableCell
                          key={headCell.id}
                          className="fw-bold fs-6"
                          align={headCell.numeric ? 'right' : 'left'}
                          sortDirection={orderBy === headCell.id ? order : false}
                          style={{
                            maxWidth: '100px', // Limit the width to demonstrate wrapping
                          }}
                        >
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'desc'}
                            onClick={createSortHandler(headCell.id)}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        </TableCell>
                      )
                )
            }
            else{
                return (
                    <TableCell className="fw-bold fs-6"
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    style={{
                        maxWidth: '90px', // Limit the width to demonstrate wrapping
                    }}>
                        {headCell.label}
                    </TableCell>
                )
            }
          })}
        </TableRow>
      </TableHead>
    );
}

export default HeaderSorting;