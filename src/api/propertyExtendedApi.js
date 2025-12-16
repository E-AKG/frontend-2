import axiosInstance from "./axiosInstance";

// ========== Versicherungen ==========
export const insuranceApi = {
  list: async (propertyId) => {
    const response = await axiosInstance.get(`/api/properties/${propertyId}/insurances`);
    return response;
  },
  
  create: async (propertyId, data) => {
    const response = await axiosInstance.post(`/api/properties/${propertyId}/insurances`, data);
    return response;
  },
  
  update: async (insuranceId, data) => {
    const response = await axiosInstance.put(`/api/property-insurances/${insuranceId}`, data);
    return response;
  },
  
  delete: async (insuranceId) => {
    const response = await axiosInstance.delete(`/api/property-insurances/${insuranceId}`);
    return response;
  },
};

// ========== Property Bank Accounts ==========
export const propertyBankAccountApi = {
  list: async (propertyId) => {
    const response = await axiosInstance.get(`/api/properties/${propertyId}/bank-accounts`);
    return response;
  },
  
  create: async (propertyId, data) => {
    const response = await axiosInstance.post(`/api/properties/${propertyId}/bank-accounts`, data);
    return response;
  },
  
  update: async (accountId, data) => {
    const response = await axiosInstance.put(`/api/property-bank-accounts/${accountId}`, data);
    return response;
  },
  
  delete: async (accountId) => {
    const response = await axiosInstance.delete(`/api/property-bank-accounts/${accountId}`);
    return response;
  },
};

// ========== Verteilerschlüssel ==========
export const allocationKeyApi = {
  list: async (propertyId) => {
    const response = await axiosInstance.get(`/api/properties/${propertyId}/allocation-keys`);
    return response;
  },
  
  create: async (propertyId, data) => {
    const response = await axiosInstance.post(`/api/properties/${propertyId}/allocation-keys`, data);
    return response;
  },
  
  update: async (keyId, data) => {
    const response = await axiosInstance.put(`/api/allocation-keys/${keyId}`, data);
    return response;
  },
  
  delete: async (keyId) => {
    const response = await axiosInstance.delete(`/api/allocation-keys/${keyId}`);
    return response;
  },
};

