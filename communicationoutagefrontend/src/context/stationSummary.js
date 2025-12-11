import { createContext, useContext } from "react";

export const stationContext = createContext({});

export const StationContextProvider = stationContext.Provider;

export default function useStationContext(){

    const stationSummary = useContext(stationContext);

    if(stationSummary === undefined){
        throw new Error("useStationContext must be used in StationContextProvider");
    }

    return stationSummary;
}