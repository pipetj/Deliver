import axios from "axios";

const API_URL = "http://localhost:3000/api/auth";

export const register = async (username, email, password) => {
  return axios.post(`${API_URL}/register`, { username, email, password });
};

export const login = async (email, password) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

export const createBuild = async (token, champion, items, runes = "") => {
  return axios.post(
    `${API_URL}/builds`,
    { champion, items, runes },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getBuilds = async (token, champion) => {
  return axios.get(`${API_URL}/builds?champion=${champion}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateBuild = async (token, buildId, items, runes = "") => {
  return axios.put(
    `${API_URL}/builds/${buildId}`,
    { items, runes },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};