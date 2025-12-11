import axiosInstance from "./axiosInstance";

export const clientApi = {
  // Clients
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/clients", { params });
    return response;
  },

  get: async (clientId) => {
    const response = await axiosInstance.get(`/api/clients/${clientId}`);
    return response;
  },

  create: async (data) => {
    const response = await axiosInstance.post("/api/clients", data);
    return response;
  },

  update: async (clientId, data) => {
    const response = await axiosInstance.put(`/api/clients/${clientId}`, data);
    return response;
  },

  delete: async (clientId) => {
    const response = await axiosInstance.delete(`/api/clients/${clientId}`);
    return response;
  },

  // Fiscal Years
  listFiscalYears: async (clientId) => {
    const response = await axiosInstance.get(`/api/clients/${clientId}/fiscal-years`);
    return response;
  },

  createFiscalYear: async (clientId, data) => {
    const response = await axiosInstance.post(`/api/clients/${clientId}/fiscal-years`, data);
    return response;
  },

  updateFiscalYear: async (fiscalYearId, data) => {
    const response = await axiosInstance.put(`/api/fiscal-years/${fiscalYearId}`, data);
    return response;
  },

  getFiscalYear: async (fiscalYearId) => {
    const response = await axiosInstance.get(`/api/fiscal-years/${fiscalYearId}`);
    return response;
  },
};

