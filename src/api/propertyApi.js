import axiosInstance from "./axiosInstance";

export const propertyApi = {
  list: (params = {}) => {
    const { search, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/properties", {
      params: { search, page, page_size },
    });
  },

  create: (data) => {
    return axiosInstance.post("/api/properties", data);
  },

  get: (id) => {
    return axiosInstance.get(`/api/properties/${id}`);
  },

  update: (id, data) => {
    return axiosInstance.put(`/api/properties/${id}`, data);
  },

  remove: (id) => {
    return axiosInstance.delete(`/api/properties/${id}`);
  },
};

