import axiosInstance from "./axiosInstance";

export const serviceProviderApi = {
  list: (params = {}) => {
    return axiosInstance.get("/api/service-providers", { params });
  },

  get: (id) => {
    return axiosInstance.get(`/api/service-providers/${id}`);
  },

  create: (data, clientId) => {
    return axiosInstance.post("/api/service-providers", data, {
      params: { client_id: clientId },
    });
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/service-providers/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/service-providers/${id}`);
  },
};

