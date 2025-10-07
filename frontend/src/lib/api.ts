import authService from "@/services/auth.service";
import axios from "axios";

export const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:4000';

// Debug: Log the API URL being used
console.log("🔍 Frontend API Configuration:");
console.log("🔍 VITE_PUBLIC_API_URL:", import.meta.env.VITE_PUBLIC_API_URL);
console.log("🔍 Final API Base URL:", PUBLIC_API_URL + "/api");

export const api = axios.create({
  baseURL: PUBLIC_API_URL + "/api",
});

api.interceptors.request.use((config) => {
  const token = authService.getToken();
  const current_org = JSON.parse(localStorage.getItem("active_org"));
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
    config.headers["x-organization-id"] = current_org;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Debug: Log API errors
    console.error("🚨 API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      baseURL: error.config?.baseURL
    });

    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      console.log("---- refreshing the token -----");
      originalRequest._retry = true;
      const data = await authService.refresh_token();
      const access_token = data?.access_token;
      api.defaults.headers["Authorization"] = "Bearer " + access_token;
      originalRequest.headers["Authorization"] = "Bearer " + access_token;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
