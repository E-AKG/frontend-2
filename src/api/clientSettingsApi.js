import axiosInstance from "./axiosInstance";

export const clientSettingsApi = {
  get: (clientId) => {
    return axiosInstance.get(`/api/clients/${clientId}/settings`);
  },

  update: (clientId, data) => {
    return axiosInstance.put(`/api/clients/${clientId}/settings`, data);
  },

  uploadLogo: (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post(`/api/clients/${clientId}/settings/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteLogo: (clientId) => {
    return axiosInstance.delete(`/api/clients/${clientId}/settings/logo`);
  },
};

