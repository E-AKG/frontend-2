import axiosInstance from "./axiosInstance";

export const propertyApi = {
  list: (params = {}) => {
    const { search, client_id, page = 1, page_size = 20 } = params;
    return axiosInstance.get("/api/properties", {
      params: { search, client_id, page, page_size },
    });
  },

  create: (data, clientId = null) => {
    const params = {};
    if (clientId) params.client_id = clientId;
    return axiosInstance.post("/api/properties", data, { params });
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

  downloadPdf: async (propertyId, propertyName = "liegenschaft") => {
    const response = await axiosInstance.get(`/api/properties/${propertyId}/export-pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    const safeName = (propertyName || "liegenschaft").replace(/[^a-zA-Z0-9ÄÖÜäöüß -]/g, "_").slice(0, 50);
    link.setAttribute("download", `${safeName}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};

