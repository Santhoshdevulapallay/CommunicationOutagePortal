import { createContext, useContext } from "react";

export const TableDataContext = createContext({});

export const TableDataContextProvider = TableDataContext.Provider;

export default function useTableDataContext(){

    const tableData = useContext(TableDataContext);

    if(tableData === undefined){
        throw new Error("useTableDataContext must be used in TableDataContextProvider");
    }
    
    return tableData;
}