import http from "./httpService";

const apiEndPoint = "/meetings";

export function getMeetings() {
  return http.get(apiEndPoint);
}

export function getlatestMeetingNo() {
  return http.get(apiEndPoint+'/latestMeetingNo');
}


export async function saveMeeting(meeting) {
  if (meeting._id) {
    const body = { ...meeting };
    delete body._id;
    return http.put(apiEndPoint + `/${meeting._id}`, body);
  } else {
    return http.post(apiEndPoint, meeting);
  }
}
