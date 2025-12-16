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

  generate: async (accountingId, templateName = null, generateAllSettlements = true) => {
    const params = {};
    if (templateName) params.template_name = templateName;
    params.generate_all_settlements = generateAllSettlements;
    const response = await axiosInstance.post(`/api/accounting/${accountingId}/generate`, null, { params });
    return response;
  },

  downloadPdf: async (accountingId) => {
    // PDF wird über axiosInstance heruntergeladen (mit automatischer Authentication)
    try {
      const response = await axiosInstance.get(`/api/accounting/${accountingId}/download-pdf`, {
        responseType: 'blob', // Wichtig: Blob für PDF-Download
      });
      
      // Erstelle Blob-URL und trigger Download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `accounting_${accountingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Fehler beim Download:", error);
      throw error;
    }
  },

  deleteItem: async (accountingId, itemId) => {
    const response = await axiosInstance.delete(`/api/accounting/${accountingId}/items/${itemId}`);
    return response;
  },

  checkMeters: async (accountingId) => {
    const response = await axiosInstance.get(`/api/accounting/${accountingId}/meter-check`);
    return response;
  },

  delete: async (accountingId) => {
    const response = await axiosInstance.delete(`/api/accounting/${accountingId}`);
    return response;
  },
};

