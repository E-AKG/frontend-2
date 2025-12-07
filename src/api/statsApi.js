import axiosInstance from "./axiosInstance";

export const statsApi = {
  getDashboard: (params = {}) => {
    const { month, year } = params;
    return axiosInstance.get("/api/stats/dashboard", {
      params: { month, year },
    });
  },
};

