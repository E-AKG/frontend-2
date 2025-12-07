import axiosInstance from "./axiosInstance";

export const billrunApi = {
  list: (params = {}) => {
    const { period_year, status, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/bill-runs", {
      params: { period_year, status, page, page_size },
    });
  },

  generate: (data) => {
    return axiosInstance.post("/api/bill-runs/generate", data);
  },

  get: (id) => {
    return axiosInstance.get(`/api/bill-runs/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/bill-runs/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/bill-runs/${id}`);
  },

  // Charges
  listCharges: (params = {}) => {
    const { bill_run_id, status, page = 1, page_size = 50 } = params;
    return axiosInstance.get("/api/charges", {
      params: { bill_run_id, status, page, page_size },
    });
  },

  updateCharge: (id, data) => {
    return axiosInstance.put(`/api/charges/${id}`, data);
  },
};

