import http from "./httpService";
import jwtDecode from "jwt-decode";

const apiEndPoint = "/auth";
const tokenKey = "token";

http.setJWT(getJWT());

export async function login(userName, password) {
  const { data: jwt } = await http.post(apiEndPoint, { userName, password });
  
  localStorage.setItem(tokenKey, jwt);
}

export function loginWithJWT(jwt) {
  localStorage.setItem(tokenKey, jwt);
}

export function logout() {
  localStorage.removeItem(tokenKey);
}

export function getCurrentUser() {
  try {
    const jwt = localStorage.getItem(tokenKey);
    
    return jwtDecode(jwt);
  } catch (ex) {
    return null;
  }
}

export function getJWT() {
  return localStorage.getItem(tokenKey);
}

export default {
  login,
  logout,
  getCurrentUser,
  loginWithJWT,
  getJWT,
};
