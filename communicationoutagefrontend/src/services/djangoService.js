
import http from "./httpService";

const apiEndpoint = "/telemetry";

export async function postadminFileUpload( formData ) {
    return http.post(`/v1${apiEndpoint}/fileupload/`, formData);
}

export async function ScadaPointsFileUpload(formData) {
    return http.post(`/v1${apiEndpoint}/ScadaPointsfileupload/`, formData);
}

export async function postStatesSCADAStationMonthSummary( formData ) {
    
    return http.post(`/v1${apiEndpoint}/statesSCADAMonthSummary/`, formData);
}

export async function postPointDetailsForSpecificSubstationAndSpecificMonthYearID(formData) {
    
    return http.post(`/v1${apiEndpoint}/getPointDetailsForSpecificSubstationAndSpecificMonthYear/`, formData);
}

export async function postStatesSCADAPointsStatusAndRemarks(formData) {
    
    return http.post(`/v1${apiEndpoint}/statesPointsStatusAndRemarks/`, formData);
}

export async function scadaPointHistory( formData ) {

    return http.post(`/v1${apiEndpoint}/scadaPointHistory/`, formData);
}
// telemetry dashboard

export async function stationsCompletelyNotReporting(formData) {

    return http.post(`/v1${apiEndpoint}/stationsCompletelyNotReporting/`,formData);
}
export async function stateDownloadExcel(formData) {

    return http.post(`/v1${apiEndpoint}/stateDownloadExcel/`,formData , {
        responseType: "blob", // Expect file as response
    });
}

export async function stateUploadExcel(formData) {
    return http.post(`/v1${apiEndpoint}/stateUploadExcel/`,formData );
}


export async function approvePointDetails(formData) {
    return http.post(`/v1${apiEndpoint}/approvePointDetails/`,formData );
}

export async function getIndianStatesBySystemType(systemType) {
    return http.post(`/v1${apiEndpoint}/getStatesSystemType/`,systemType );
}

export async function generateLetter(formData) {
    return http.post(`/v1${apiEndpoint}/generate_letter/`,formData ,{
        responseType: "blob", // Expect file as response
    } );
}
// Plotly Dashboard URLS

export async function plotlyDataDashboards(formData) {
    return http.post(`/v1${apiEndpoint}/plotlyDataDashboards/` , formData);
}

export async function remarksTimelineTableDashboard(formData) {
    return http.post(`/v1${apiEndpoint}/remarksTimelineTableDashboard/` , formData);
}

export async function notReportingTableDashboard(formData) {
    return http.post(`/v1${apiEndpoint}/notReportingTableDashboard/` , formData);
}

export async function notRectifiedTableDashboard(formData) {
    return http.post(`/v1${apiEndpoint}/notRectifiedTableDashboard/` , formData);
}
//Scada Points Master

export async function getScadaPointMasterList() {
    return http.get(`/v1${apiEndpoint}/getScadaPointMasterList/` );
}

// RTU Not Reporting

export async function getRTUMasterList() {
    return http.get(`/v1${apiEndpoint}/getRTUMasterList/` );
}

export async function getLatestRTUData() {
    return http.get(`/v1${apiEndpoint}/getLatestRTUData/` );
}

export async function rtuMasterChange(formData) {
    return http.post(`/v1${apiEndpoint}/rtuMasterChange/` ,formData );
}

export async function saveRTUNotReporting(formData) {
    return http.post(`/v1${apiEndpoint}/saveRTUNotReporting/` , formData);
}

export async function sendRTUReportMail(formData) {
    return http.post(`/v1${apiEndpoint}/sendRTUReportMail/` , formData);
}

export async function saveRTUMasterTable(formData) {
    return http.post(`/v1${apiEndpoint}/saveRTUMasterTable/` , formData);
}

export async function saveSCADAPointsMasterTable(formData) {
    return http.post(`/v1${apiEndpoint}/saveSCADAPointsMasterTable/` , formData);
}

export async function downloadRTUTemplate() {
    return http.get(`/v1${apiEndpoint}/downloadRTUTemplate/` , {
        responseType: "blob",
    });
}


export async function uploadRTUMaster(formData) {
    return http.post(`/v1${apiEndpoint}/uploadRTUMaster/`,formData );
}

export async function newRTUCreate(formData) {
    return http.post(`/v1${apiEndpoint}/newRTUCreate/`,formData );
}

export async function previewReport(formData) {
    return http.post(`/v1${apiEndpoint}/previewReport/`,formData ,{
        responseType: "blob",
    });
}

export async function downloadRTULog() {
    return http.get(`/v1${apiEndpoint}/downloadRTULog/`,{
        responseType: "blob",
    });
}
// Intra State Data Request
export async function intraStateReq(formData) {
    return http.post(`/v1${apiEndpoint}/intraStateReq/`,formData );
}

export async function getIntraStateReq() {
    return http.get(`/v1${apiEndpoint}/getIntraStateReq/` );
}

export async function getSubstationsList(formdata) {
    return http.post(`/v1${apiEndpoint}/getSubstationsList/` , formdata);
}

export async function downloadIntraStateUploads(fileurl) {
    return http.post(`/v1${apiEndpoint}/downloadIntraStateUploads/` , fileurl , {
        responseType: "blob",
    });
}

// Digital Point Summary
export async function digitalPointDetailsSummary(formData) {

    return http.post(`/v1${apiEndpoint}/digitalPointDetailsSummary/`, formData);
}

export async function updateDigitalPoint(formData) {

    return http.post(`/v1${apiEndpoint}/updateDigitalPoint/`, formData);
}