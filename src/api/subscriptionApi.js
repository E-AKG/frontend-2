import axiosInstance from './axiosInstance';

export const subscriptionApi = {
  // Get current user's subscription
  getMySubscription: () => {
    return axiosInstance.get('/subscriptions/me');
  },

  // Create checkout session
  createCheckout: (data) => {
    return axiosInstance.post('/subscriptions/checkout', data);
  },

  // Cancel subscription
  cancelSubscription: () => {
    return axiosInstance.post('/subscriptions/cancel');
  },

  // Reactivate subscription
  reactivateSubscription: () => {
    return axiosInstance.post('/subscriptions/reactivate');
  },

  // Get payment history
  getPaymentHistory: (limit = 50) => {
    return axiosInstance.get(`/payments/history?limit=${limit}`);
  },

  // Get user limits
  getLimits: () => {
    return axiosInstance.get('/subscriptions/limits');
  },
};

