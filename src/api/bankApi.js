import axiosInstance from "./axiosInstance";

export const bankApi = {
  // Bank Accounts
  listAccounts: () => {
    return axiosInstance.get("/api/bank-accounts");
  },

  createAccount: (data) => {
    return axiosInstance.post("/api/bank-accounts", data);
  },

  updateAccount: (id, data) => {
    return axiosInstance.put(`/api/bank-accounts/${id}`, data);
  },

  deleteAccount: (id) => {
    return axiosInstance.delete(`/api/bank-accounts/${id}`);
  },

  // FinAPI Integration - temporär auskommentiert
  // connectFinAPI: (accountId) => {
  //   return axiosInstance.post(`/api/bank-accounts/${accountId}/connect-finapi`);
  // },

  // syncTransactions: (accountId, daysBack = 90) => {
  //   return axiosInstance.post(`/api/bank-accounts/${accountId}/sync`, null, {
  //     params: { days_back: daysBack },
  //   });
  // },

  // Transactions
  listTransactions: (params = {}) => {
    const { bank_account_id, is_matched, page = 1, page_size = 50 } = params;
    return axiosInstance.get("/api/bank-transactions", {
      params: { bank_account_id, is_matched, page, page_size },
    });
  },

  createTransaction: (data) => {
    return axiosInstance.post("/api/bank-transactions", data);
  },

  // Payment Matches
  createMatch: (data) => {
    return axiosInstance.post("/api/payment-matches", data);
  },

  deleteMatch: (matchId) => {
    return axiosInstance.delete(`/api/payment-matches/${matchId}`);
  },

  // Automatic Matching
  autoMatchTransaction: (transactionId) => {
    return axiosInstance.post(`/api/bank-transactions/${transactionId}/auto-match`);
  },

  // Erweiterte Zahlungsabgleich-Funktionen
  getUnmatchedTransactions: (params = {}) => {
    const { bank_account_id, page = 1, page_size = 50 } = params;
    return axiosInstance.get("/api/bank/unmatched", {
      params: { bank_account_id, page, page_size },
    });
  },

  getMatchSuggestions: (transactionId) => {
    return axiosInstance.get(`/api/bank/match-suggestions/${transactionId}`);
  },

  manualMatch: (transactionId, chargeId, matchedAmount, note) => {
    return axiosInstance.post("/api/bank/manual-match", {
      transaction_id: transactionId,
      charge_id: chargeId,
      matched_amount: matchedAmount,
      note: note,
    });
  },

  triggerAutoMatchAll: (bankAccountId = null, minConfidence = 80) => {
    return axiosInstance.post("/api/bank/auto-match-all", null, {
      params: { bank_account_id: bankAccountId, min_confidence: minConfidence },
    });
  },

  // CSV Upload
  uploadCsv: (files, bankAccountId = null, accountName = null) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const params = new URLSearchParams();
    if (bankAccountId) {
      params.append('bank_account_id', bankAccountId);
    }
    if (accountName) {
      params.append('account_name', accountName);
    }

    return axiosInstance.post(
      `/api/bank/upload-csv?${params.toString()}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  // CSV-Verwaltung
  listCsvFiles: () => {
    return axiosInstance.get('/api/bank/csv-files');
  },

  getCsvFile: (csvFileId, page = 1, pageSize = 15) => {
    return axiosInstance.get(`/api/bank/csv-files/${csvFileId}`, {
      params: { page, page_size: pageSize },
    });
  },

  deleteCsvFile: (csvFileId) => {
    return axiosInstance.delete(`/api/bank/csv-files/${csvFileId}`);
  },

  // CSV-Abgleich
  reconcileCsv: () => {
    return axiosInstance.post('/api/bank/csv-reconcile');
  },
};

