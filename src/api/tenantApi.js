import axiosInstance from "./axiosInstance";

export const tenantApi = {
  list: (params = {}) => {
    const { search, client_id, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/tenants", {
      params: { search, client_id, page, page_size },
    });
  },

  create: (data, clientId = null) => {
    const params = {};
    if (clientId) params.client_id = clientId;
    return axiosInstance.post("/api/tenants", data, { params });
  },

  get: (id) => {
    return axiosInstance.get(`/api/tenants/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/tenants/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/tenants/${id}`);
  },

  getCrm: (id) => {
    return axiosInstance.get(`/api/tenants/${id}/crm`);
  },
};

