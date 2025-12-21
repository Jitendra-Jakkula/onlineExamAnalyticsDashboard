import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function apiGet(path) {
  const res = await api.get(path);
  return res.data;
}

export async function apiPost(path, body) {
  const res = await api.post(path, body);
  return res.data;
}

export async function apiPatch(path, body) {
  const res = await api.patch(path, body);
  return res.data;
}

export async function apiDelete(path) {
  const res = await api.delete(path);
  return res.data;
}

export default api;

