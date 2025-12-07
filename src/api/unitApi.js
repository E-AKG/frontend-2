import axiosInstance from "./axiosInstance";

export const unitApi = {
  list: (params = {}) => {
    const { property_id, status, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/units", {
      params: { property_id, status, page, page_size },
    });
  },

  create: (data) => {
    return axiosInstance.post("/api/units", data);
  },

  get: (id) => {
    return axiosInstance.get(`/api/units/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/units/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/units/${id}`);
  },
};

