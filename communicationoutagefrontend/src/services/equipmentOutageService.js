import http from "./httpService";

const apiEndpoint = "/equipmentoutage";

export function getCOA2Equipments(year, month) {
  return http.get(`${apiEndpoint}/coa2/${year}/${month}`);
}

export async function saveEquipmentOutage(equipmentOutage, edit = "") {
  if (equipmentOutage._id) {
    const body = { ...equipmentOutage };
    delete body._id;
    if (edit) {
      return http.put(apiEndpoint + `/editOutage/${equipmentOutage._id}`, body);
    }
    return http.put(
      apiEndpoint + `/outageApproval/${equipmentOutage._id}`,
      body
    );
  } else {
    return http.post(apiEndpoint, equipmentOutage);
  }
}

export async function approveAllCOA2Outages(year, month) {
  return http.put(apiEndpoint + `/approveAll/${year}/${month}`);
}

// can delete before any approval or rejection
export async function deleteOutage(outage) {
  if (outage._id) {
    return http.put(apiEndpoint + `/delete/${outage._id}`);
  }
}

export function getRollingOutageMillisec(equipmentId, year, month) {
  return http.get(
    `${apiEndpoint}/getRollingOutageMillisec/${equipmentId}/${year}/${month}`
  );
}

export function getCOD2(year, month) {
  return http.get(`${apiEndpoint}/cod2/${year}/${month}`);
}

export async function saveCOD2Outage(equipment) {
  if (equipment._id) {
    const body = { ...equipment };
    delete body._id;
    return http.put(apiEndpoint + `/saveCOD2Outage/${equipment._id}`, body);
  }
}

export async function makeNotAvailed(equipmentOutageId, body) {
  return http.put(apiEndpoint + `/makeNotAvailed/${equipmentOutageId}`, body);
}

export async function d3sendMail(equipmentOutageId) {
  return http.put(apiEndpoint + `/d3sendMail/${equipmentOutageId}`);
}

export async function generateEquipmentCode(equipmentOutage, typeCode) {
  const body = { typeCode: typeCode };
  return http.put(apiEndpoint + `/generateCode/${equipmentOutage._id}`, body);
}
