import axiosInstance from "./axiosInstance";

/**
 * Authentication & User Settings API Client
 */
export const authApi = {
  /**
   * Hole aktuelle User-Informationen
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  },

  /**
   * Aktualisiere User-Einstellungen
   * @param {Object} userData - User-Daten (z.B. { notification_from_email: "..." })
   */
  updateUserSettings: async (userData) => {
    const response = await axiosInstance.put("/auth/me", userData);
    return response.data;
  },
};

