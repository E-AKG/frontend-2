import axiosInstance from "./axiosInstance";

export const reminderApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/reminders", { params });
    return response;
  },

  get: async (reminderId) => {
    const response = await axiosInstance.get(`/api/reminders/${reminderId}`);
    return response;
  },

  create: async (data, clientId) => {
    const response = await axiosInstance.post("/api/reminders", data, {
      params: { client_id: clientId },
    });
    return response;
  },

  update: async (reminderId, data) => {
    const response = await axiosInstance.put(`/api/reminders/${reminderId}`, data);
    return response;
  },

  delete: async (reminderId) => {
    const response = await axiosInstance.delete(`/api/reminders/${reminderId}`);
    return response;
  },

  bulkCreate: async (reminderType, clientId, params = {}) => {
    const response = await axiosInstance.post("/api/reminders/bulk-create", null, {
      params: { reminder_type: reminderType, client_id: clientId, ...params },
    });
    return response;
  },

  generatePdf: async (reminderId) => {
    const response = await axiosInstance.post(`/api/reminders/${reminderId}/generate-pdf`);
    return response;
  },

  markSent: async (reminderId) => {
    const response = await axiosInstance.post(`/api/reminders/${reminderId}/mark-sent`);
    return response;
  },

  // Test-PDF generieren (mit echten Daten aus dem Tool)
  testPdf: async (templateName = null, clientId = null) => {
    const params = {};
    if (templateName) params.template_name = templateName;
    if (clientId) params.client_id = clientId;
    const response = await axiosInstance.post("/api/reminders/test-pdf", null, { params });
    return response;
  },
};

