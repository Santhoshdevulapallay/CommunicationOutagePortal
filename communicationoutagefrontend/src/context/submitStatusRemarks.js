import { createContext, useContext } from "react";

export const SubmitStatusRemarksContext = createContext({});

export const SubmitStatusRemarksContextProvider = SubmitStatusRemarksContext.Provider;

export default function useSubmitStatusRemarksContext(){

    const submitStatusRemarks = useContext(SubmitStatusRemarksContext);

    if(submitStatusRemarks === undefined){
        throw new Error("useSubmitStatusRemarksContext must be used in SubmitStatusRemarksContextProvider");
    }
    
    return submitStatusRemarks;
}