import axiosInstance from "./axiosInstance";

export const documentApi = {
  list: async (params = {}) => {
    const response = await axiosInstance.get("/api/documents", { params });
    return response;
  },

  get: async (documentId) => {
    const response = await axiosInstance.get(`/api/documents/${documentId}`);
    return response;
  },

  upload: async (file, params = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Füge alle anderen Parameter hinzu
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        formData.append(key, params[key]);
      }
    });
    
    const response = await axiosInstance.post("/api/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: params,
    });
    return response;
  },

  delete: async (documentId) => {
    const response = await axiosInstance.delete(`/api/documents/${documentId}`);
    return response;
  },
};

