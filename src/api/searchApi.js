import axiosInstance from "./axiosInstance";

export const searchApi = {
  spotlight: async (query, params = {}) => {
    const response = await axiosInstance.get("/api/search/spotlight", {
      params: { q: query, ...params },
    });
    return response;
  },

  quickStats: async (params = {}) => {
    const response = await axiosInstance.get("/api/search/quick-stats", {
      params,
    });
    return response;
  },
};

