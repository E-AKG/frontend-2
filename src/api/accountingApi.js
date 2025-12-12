import axiosInstance from "./axiosInstance";

export const accountingApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/accounting", { params });
    return response;
  },

  get: async (accountingId) => {
    const response = await axiosInstance.get(`/api/accounting/${accountingId}`);
    return response;
  },

  create: async (data, clientId, fiscalYearId = null) => {
    const response = await axiosInstance.post("/api/accounting", data, {
      params: { client_id: clientId, fiscal_year_id: fiscalYearId },
    });
    return response;
  },

  addItem: async (accountingId, data) => {
    const response = await axiosInstance.post(`/api/accounting/${accountingId}/items`, data);
    return response;
  },

  getItems: async (accountingId) => {
    const response = await axiosInstance.get(`/api/accounting/${accountingId}/items`);
    return response;
  },

  calculate: async (accountingId, allocationMethod = "area") => {
    const response = await axiosInstance.post(`/api/accounting/${accountingId}/calculate`, null, {
      params: { allocation_method: allocationMethod },
    });
    return response;
  },

  getSettlements: async (accountingId) => {
    const response = await axiosInstance.get(`/api/accounting/${accountingId}/settlements`);
    return response;
  },

  generate: async (accountingId) => {
    const response = await axiosInstance.post(`/api/accounting/${accountingId}/generate`);
    return response;
  },

  deleteItem: async (accountingId, itemId) => {
    const response = await axiosInstance.delete(`/api/accounting/${accountingId}/items/${itemId}`);
    return response;
  },

  checkMeters: async (accountingId) => {
    const response = await axiosInstance.get(`/api/accounting/${accountingId}/meter-check`);
    return response;
  },
};

