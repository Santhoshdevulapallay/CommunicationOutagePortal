import http from "./httpService";

const apiEndPoint = "/users";

export async function getUsers() {
  const { data: users } = await http.get(`${apiEndPoint}/owners/`);
  const ownersList = [];
  for (var i = 0; i < users.length; i++) {
    ownersList.push({ value: users[i].ownerName, label: users[i].ownerName });
  }
  return ownersList;
}

export function changePassword(data) {
  return http.put(`${apiEndPoint}/changePassword/`, data);
}
