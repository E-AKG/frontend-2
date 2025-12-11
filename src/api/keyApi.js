import axiosInstance from "./axiosInstance";

export const keyApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/keys", { params });
    return response;
  },

  get: async (keyId) => {
    const response = await axiosInstance.get(`/api/keys/${keyId}`);
    return response;
  },

  create: async (data, clientId) => {
    const response = await axiosInstance.post("/api/keys", data, {
      params: { client_id: clientId },
    });
    return response;
  },

  update: async (keyId, data) => {
    const response = await axiosInstance.put(`/api/keys/${keyId}`, data);
    return response;
  },

  delete: async (keyId) => {
    const response = await axiosInstance.delete(`/api/keys/${keyId}`);
    return response;
  },

  action: async (keyId, data) => {
    const response = await axiosInstance.post(`/api/keys/${keyId}/action`, data);
    return response;
  },

  getHistory: async (keyId) => {
    const response = await axiosInstance.get(`/api/keys/${keyId}/history`);
    return response;
  },
};

