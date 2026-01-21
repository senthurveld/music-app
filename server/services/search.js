// client/src/services/api.js
import axios from "axios";

// In development, Vite proxy handles /api to localhost:5001
// In production, same origin (Railway) handles it
const api = axios.create({
  baseURL: "", // Empty for relative URLs - let proxy handle it
  timeout: 15000,
  withCredentials: true, // For cookies if using auth
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.status, error.message);

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
