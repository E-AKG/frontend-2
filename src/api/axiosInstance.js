import axios from "axios";

// Get API URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL: API_URL, // FastAPI backend - configured via VITE_API_URL env variable
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // withCredentials wird nur für Cookie-basierte Auth benötigt
  // Für JWT in localStorage nicht notwendig, kann aber CORS-Probleme verursachen
  withCredentials: false,
});

// Automatically add JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging (only in dev)
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", response.config.method?.toUpperCase(), response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    // Log errors for debugging
    console.error("❌ API Error:", error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error("❌ Network Error - Backend nicht erreichbar");
      // Zeige Fehler, aber logge nicht aus
      return Promise.reject(error);
    }
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      console.warn("⚠️ Token ungültig - entferne aus localStorage");
      localStorage.removeItem("access_token");
      // Nur redirect wenn nicht bereits auf Login-Seite
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;