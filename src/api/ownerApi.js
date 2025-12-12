import axiosInstance from "./axiosInstance";

export const ownerApi = {
  list: (params = {}) => {
    return axiosInstance.get("/api/owners", { params });
  },

  get: (id) => {
    return axiosInstance.get(`/api/owners/${id}`);
  },

  create: (data, clientId) => {
    return axiosInstance.post("/api/owners", data, {
      params: { client_id: clientId },
    });
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/owners/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/owners/${id}`);
  },
};

