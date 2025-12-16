import axiosInstance from "./axiosInstance";

export const unitApi = {
  list: (params = {}) => {
    const { property_id, client_id, status, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/units", {
      params: { property_id, client_id, status, page, page_size },
    });
  },

  create: (data, clientId = null) => {
    const params = {};
    if (clientId) params.client_id = clientId;
    return axiosInstance.post("/api/units", data, { params });
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

