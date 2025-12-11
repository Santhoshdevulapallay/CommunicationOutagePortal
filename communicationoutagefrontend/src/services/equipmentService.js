import http from "./httpService";

const apiEndPoint = "/equipments";

function equipmentUrl(id) {
  return `${apiEndPoint}/${id}`;
}

export function getEquipments() {
  return http.get(apiEndPoint);
}

// export function deleteMovie(movieId) {
//   return http.delete(movieUrl(movieId));
// }

export function getEquipment(equipmentId) {
  return http.get(equipmentUrl(equipmentId));
}

export function saveEquipment(equipment) {
  debugger;
  var ownerList = [];
  for (var i = 0; i < equipment["ownership"].length; i++) {
    ownerList.push(equipment["ownership"][i].value);
  }
  const body = { ...equipment };
  body["ownership"] = ownerList;
  if (equipment._id) {
    delete body._id;
    return http.put(equipmentUrl(equipment._id), body);
  }
  return http.post(apiEndPoint, body);
}

export function getDBEquipmentRequests() {
  return http.get(apiEndPoint+'/equipmentRequests/new');
}

export function equipmentRequestApproval(equipmentId, action) {
    return http.put(`${apiEndPoint}/equipmentRequestApproval/${equipmentId}/${action}`);
}
  

export function hideEquipment(equipmentId) {
  return http.put(`${apiEndPoint}/hide/${equipmentId}`);
}

export function getequipmentsByMonth(year, month) {
  return http.get(`${apiEndPoint}/equipmentsByMonth/${year}/${month}`);
}