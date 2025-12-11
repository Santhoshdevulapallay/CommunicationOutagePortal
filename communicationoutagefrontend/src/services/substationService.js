import http from "./httpService";

const apiEndpoint = "/substations";


export async function postAdminFileBulkImport( formData ){

    return http.post(`/v1${apiEndpoint}/adminFileBulkImport/`, formData);
}

export async function postStatesFileBulkImport( formData ){

    return http.post(`/v1${apiEndpoint}/statesFileBulkImport`, formData);
}

export async function postStatesSCADAPointsStatusAndRemarks( formData ) {

    return http.post(`/v1${apiEndpoint}/statesPointsStatusAndRemarks/`, formData);
}

export async function postPointDetailsForSpecificSubstationAndSpecificMonthYearID ( formData ) {

    return http.post(`v1${apiEndpoint}/getPointDetailsForSpecificSubstationAndSpecificMonthYear/`, formData);

}

export async function downloadStationSummaryDetails( formData ){

    return http.post(`v1${apiEndpoint}/statesdownloadsubstationsummarydetails/`, formData);
}