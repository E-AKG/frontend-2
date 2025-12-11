import axiosInstance from "./axiosInstance";

export const meterApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/meters", { params });
    return response;
  },

  get: async (meterId) => {
    const response = await axiosInstance.get(`/api/meters/${meterId}`);
    return response;
  },

  create: async (data, clientId) => {
    const response = await axiosInstance.post("/api/meters", data, {
      params: { client_id: clientId },
    });
    return response;
  },

  update: async (meterId, data) => {
    const response = await axiosInstance.put(`/api/meters/${meterId}`, data);
    return response;
  },

  delete: async (meterId) => {
    const response = await axiosInstance.delete(`/api/meters/${meterId}`);
    return response;
  },

  listReadings: async (meterId) => {
    const response = await axiosInstance.get(`/api/meters/${meterId}/readings`);
    return response;
  },

  createReading: async (meterId, data) => {
    const response = await axiosInstance.post(`/api/meters/${meterId}/readings`, data);
    return response;
  },
};

