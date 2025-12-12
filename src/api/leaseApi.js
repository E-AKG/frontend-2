import axiosInstance from "./axiosInstance";

export const leaseApi = {
  list: (params = {}) => {
    const { status, tenant_id, unit_id, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/leases", {
      params: { status, tenant_id, unit_id, page, page_size },
    });
  },

  create: (data) => {
    return axiosInstance.post("/api/leases", data);
  },

  get: (id) => {
    return axiosInstance.get(`/api/leases/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/leases/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/leases/${id}`);
  },

  // Lease components
  getComponents: (leaseId) => {
    return axiosInstance.get(`/api/leases/${leaseId}/components`);
  },

  createComponent: (leaseId, data) => {
    return axiosInstance.post(`/api/leases/${leaseId}/components`, data);
  },

  updateComponent: (componentId, data) => {
    return axiosInstance.put(`/api/lease-components/${componentId}`, data);
  },

  removeComponent: (componentId) => {
    return axiosInstance.delete(`/api/lease-components/${componentId}`);
  },

  // Rent Adjustments
  getAdjustments: (componentId) => {
    return axiosInstance.get(`/api/lease-components/${componentId}/adjustments`);
  },

  adjustRent: (componentId, newAmount, adjustmentDate, reason) => {
    return axiosInstance.post(`/api/lease-components/${componentId}/adjust-rent`, null, {
      params: {
        new_amount: newAmount,
        adjustment_date: adjustmentDate,
        reason: reason,
      },
    });
  },

  getUpcomingAdjustments: (leaseId) => {
    return axiosInstance.get(`/api/leases/${leaseId}/upcoming-adjustments`);
  },
};

