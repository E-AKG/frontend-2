import axiosInstance from "./axiosInstance";

export const ticketApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/tickets", { params });
    return response;
  },

  get: async (ticketId) => {
    const response = await axiosInstance.get(`/api/tickets/${ticketId}`);
    return response;
  },

  create: async (data, params = {}) => {
    const response = await axiosInstance.post("/api/tickets", data, { params });
    return response;
  },

  update: async (ticketId, data) => {
    const response = await axiosInstance.put(`/api/tickets/${ticketId}`, data);
    return response;
  },

  delete: async (ticketId) => {
    const response = await axiosInstance.delete(`/api/tickets/${ticketId}`);
    return response;
  },

  addComment: async (ticketId, comment) => {
    const response = await axiosInstance.post(`/api/tickets/${ticketId}/comments`, { comment });
    return response;
  },

  getComments: async (ticketId) => {
    const response = await axiosInstance.get(`/api/tickets/${ticketId}/comments`);
    return response;
  },
};

