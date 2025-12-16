import axiosInstance from "./axiosInstance";

export const propertyApi = {
  list: (params = {}) => {
    const { search, client_id, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/properties", {
      params: { search, client_id, page, page_size },
    });
  },

  create: (data, clientId = null) => {
    const params = {};
    if (clientId) params.client_id = clientId;
    return axiosInstance.post("/api/properties", data, { params });
  },

  get: (id) => {
    return axiosInstance.get(`/api/properties/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/properties/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/properties/${id}`);
  },
};

