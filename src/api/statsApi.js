import axiosInstance from "./axiosInstance";

export const statsApi = {
  getDashboard: (params = {}) => {
    const { month, year, client_id, fiscal_year_id } = params;
    return axiosInstance.get("/api/stats/dashboard", {
      params: { month, year, client_id, fiscal_year_id },
    });
  },
};

