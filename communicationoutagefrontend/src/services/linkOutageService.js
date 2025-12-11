import http from "./httpService";

const apiEndpoint = "/linkoutage";

export function getCOA1Links(year, month) {
  return http.get(`${apiEndpoint}/coa1/${year}/${month}`);
}

export function getCOD1(year, month) {
  return http.get(`${apiEndpoint}/cod1/${year}/${month}`);
}

export async function saveLinkOutage(linkOutage, edit = "") {
  debugger;
  if (linkOutage._id) {
    const body = { ...linkOutage };
    delete body._id;
    if (edit) {
      return http.put(apiEndpoint + `/editOutage/${linkOutage._id}`, body);
    }
    return http.put(apiEndpoint + `/outageApproval/${linkOutage._id}`, body);
  } else {
    return http.post(apiEndpoint, linkOutage);
  }
}

export async function generateLinkCode(linkOutage, typeCode) {
  debugger;
  if (linkOutage._id) {
    const body = { typeCode: typeCode };
    return http.put(apiEndpoint + `/generateCode/${linkOutage._id}`, body);
  } else {
    return http.post(apiEndpoint, linkOutage);
  }
}

export async function getLinkOutage(outageRequestId) {
  var x = await http.get(apiEndpoint + `/${outageRequestId}`);
  return x;
}

export async function saveCOD1Outage(linkOutage) {
  if (linkOutage._id) {
    const body = { ...linkOutage };
    delete body._id;
    return http.put(apiEndpoint + `/saveCOD1Outage/${linkOutage._id}`, body);
  }
}

export async function makeNotAvailed(linkOutageId, body) {
  return http.put(apiEndpoint + `/makeNotAvailed/${linkOutageId}`, body);
}

export async function approveAllCOA1Outages(year, month) {
  return http.put(apiEndpoint + `/approveAll/${year}/${month}`);
}

export async function deleteOutage(outage, deleteFrom) {
  if (outage._id) {
    const body = { deleteFrom: deleteFrom };
    return http.put(apiEndpoint + `/delete/${outage._id}`, body);
  }
}

export function getRollingOutageMillisec(linkId, year, month) {
  return http.get(
    `${apiEndpoint}/getRollingOutageMillisec/${linkId}/${year}/${month}`
  );
}

export async function d3sendMail(linkOutageId) {
  return http.put(apiEndpoint + `/d3sendMail/${linkOutageId}`);
}

// export function deleteMovie(movie) {
//    return http.delete(movieURL(movie._id || movie));
// }
