import axiosInstance from "./axiosInstance";

export const cashbookApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/cashbook", { params });
    return response;
  },

  create: async (data, params = {}) => {
    const response = await axiosInstance.post("/api/cashbook", data, { params });
    return response;
  },

  getBalance: async (params = {}) => {
    const response = await axiosInstance.get("/api/cashbook/balance", { params });
    return response;
  },

  delete: async (entryId) => {
    const response = await axiosInstance.delete(`/api/cashbook/${entryId}`);
    return response;
  },

  // Automatischer Abgleich von Kassenbuch-Einträgen
  autoReconcile: async (clientId, fiscalYearId, minConfidence = 0.6) => {
    const response = await axiosInstance.post('/api/cashbook/auto-reconcile', null, {
      params: {
        client_id: clientId,
        fiscal_year_id: fiscalYearId,
        min_confidence: minConfidence,
      },
    });
    return response;
  },
};

