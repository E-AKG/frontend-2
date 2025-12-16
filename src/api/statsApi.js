import axiosInstance from "./axiosInstance";

export const statsApi = {
  getDashboard: (params = {}) => {
    const { month, year, client_id, fiscal_year_id } = params;
    return axiosInstance.get("/api/stats/dashboard", {
      params: { month, year, client_id, fiscal_year_id },
    });
  },

  getReports: (params = {}) => {
    const { start_date, end_date, client_id, fiscal_year_id } = params;
    return axiosInstance.get("/api/stats/reports", {
      params: { start_date, end_date, client_id, fiscal_year_id },
    });
  },
};

