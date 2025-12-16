import axios from "axios";

// Get API URL from environment variable, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Separate Axios instance for Portal (Mieter) requests
 * Uses portal_access_token instead of access_token
 */
const portalAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: false,
});

// Automatically add Portal JWT token to all requests
portalAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("portal_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401/403 responses (unauthorized/forbidden)
portalAxiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("✅ Portal API Response:", response.config.method?.toUpperCase(), response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    console.error("❌ Portal API Error:", error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error("❌ Network Error - Backend nicht erreichbar");
      return Promise.reject(error);
    }
    
    // Handle 401/403 unauthorized/forbidden
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("⚠️ Portal Token ungültig - entferne aus localStorage");
      localStorage.removeItem("portal_access_token");
      localStorage.removeItem("portal_user_email");
      // Redirect to portal login
      if (window.location.pathname !== "/portal/login") {
        window.location.href = "/portal/login";
      }
    }
    return Promise.reject(error);
  }
);

export default portalAxiosInstance;

