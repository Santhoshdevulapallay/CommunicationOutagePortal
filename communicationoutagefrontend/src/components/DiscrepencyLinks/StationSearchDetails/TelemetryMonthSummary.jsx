

import React, { useState } from "react";
import useUserContext from "../../../context/user";
import StationSearchForm from "./StationSearchForm"
import StationDetailsTable from "./StationDetailsTable";

import { StationContextProvider } from "../../../context/stationSummary";
import { UserSearchParamsContextProvider } from "../../../context/userSearchParams";

const TelemetryMonthSummary = () => {

    const userContextVal = useUserContext();
    
    const [ userSearchParams, setUserSearchParams ] = useState({});
    const [ stationSummaryList, setStationSummaryList ] = useState([]);

    const stationState = [ stationSummaryList, setStationSummaryList ]
    const userSearchState = { userSearchParams, setUserSearchParams }

    return (
        <>
            <StationContextProvider value={stationState}>
                <UserSearchParamsContextProvider value={userSearchState}>
                    <StationSearchForm />
                    {userContextVal && (userContextVal.isSupervisor || userContextVal.isState) && (
                        <StationDetailsTable />
                    )}
                </UserSearchParamsContextProvider>
            </StationContextProvider>
        </>
    )

}


export default TelemetryMonthSummary