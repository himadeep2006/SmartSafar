import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function handleApiError(error) {
  if (error.response?.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("smartsafar:unauthorized"));
  }
  return Promise.reject(error);
}

api.interceptors.response.use((response) => response, handleApiError);

export default api;
