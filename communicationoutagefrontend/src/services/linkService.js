import http from "./httpService";

const apiEndPoint = "/links";

function linkUrl(id) {
  return `${apiEndPoint}/${id}`;
}

export function getLinks() {
  return http.get(apiEndPoint);
}

export function getLink(linkId) {
  return http.get(linkUrl(linkId));
}

export function saveLink(link) {
  debugger;
  var ownerList = [];
  var linkTypemList = [];
  var channelTypemList = [];
  for (var i = 0; i < link["ownership"].length; i++) {
    ownerList.push(link["ownership"][i].value);
  }
  for (var i = 0; i < link["linkTypem"].length; i++) {
    linkTypemList.push(link["linkTypem"][i].value);
  }
  for (var i = 0; i < link["channelTypem"].length; i++) {
    channelTypemList.push(link["channelTypem"][i].value);
  }
  const body = { ...link };
  body["ownership"] = ownerList;
  body["linkTypem"] = linkTypemList;
  body["channelTypem"] = channelTypemList;
  // body["linkType"] = link["linkType"].value;
  body["pathType"] = link["pathType"].value;
  if (link._id) {
    delete body._id;
    return http.put(linkUrl(link._id), body);
  }
  return http.post(apiEndPoint, body);
}

export function getDBLinkRequests() {
  return http.get(apiEndPoint+'/linkRequests/new');
}

export function linkRequestApproval(linkid,action) {
  debugger;
    return http.put(`${apiEndPoint}/linkRequestApproval/${linkid}/${action}`);
  }
  
export function hideLink(linkid) {
  return http.put(`${apiEndPoint}/hide/${linkid}`);
}
    
export function getlinksByMonth(year, month) {
  return http.get(`${apiEndPoint}/linksByMonth/${year}/${month}`);
}