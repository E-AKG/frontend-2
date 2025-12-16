import axiosInstance from "./axiosInstance";

/**
 * Admin Portal API Client
 * Endpoints für BK-Verwaltung (Upload, Verknüpfung, Veröffentlichung)
 */
export const adminPortalApi = {
  /**
   * Lade ein Dokument hoch (BK_STATEMENT oder BK_RECEIPT)
   * @param {FormData} formData - FormData mit file, document_type, title, billing_year, etc.
   */
  uploadDocument: async (formData) => {
    const response = await axiosInstance.post("/api/admin/portal/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Verknüpfe Belege mit einem Statement
   * @param {number} billingYear - Abrechnungsjahr
   * @param {string} statementId - ID des Statements
   * @param {string[]} receiptIds - IDs der Belege
   */
  linkReceipts: async (billingYear, statementId, receiptIds) => {
    const response = await axiosInstance.post(
      `/api/admin/portal/bk/${billingYear}/link-receipts`,
      {
        statement_id: statementId,
        receipt_ids: receiptIds,
      }
    );
    return response.data;
  },

  /**
   * Veröffentliche eine Betriebskostenabrechnung
   * @param {number} billingYear - Abrechnungsjahr
   * @param {string} statementId - ID des Statements
   * @param {string[]} receiptIds - Optional: IDs der zu veröffentlichenden Belege
   * @param {string[]} tenantIds - Optional: IDs der Mieter für Benachrichtigung (überschreibt automatische Suche)
   */
  publishBKStatement: async (billingYear, statementId, receiptIds = null, tenantIds = null) => {
    const formData = new FormData();
    formData.append("statement_id", statementId);
    if (receiptIds && receiptIds.length > 0) {
      receiptIds.forEach((id) => {
        formData.append("receipt_ids", id);
      });
    }
    if (tenantIds && tenantIds.length > 0) {
      tenantIds.forEach((id) => {
        formData.append("tenant_ids", id);
      });
    }
    
    const response = await axiosInstance.post(
      `/api/admin/portal/bk/${billingYear}/publish`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Lade ein Dokument herunter (Admin-Zugriff)
   * @param {string} documentId - ID des Dokuments
   */
  downloadDocument: async (documentId) => {
    const response = await axiosInstance.get(`/api/admin/portal/documents/${documentId}/download`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * Lade einen Mieter zum Portal ein
   * @param {Object} data - { tenant_id, email, send_invitation, lease_id (optional) }
   */
  invitePortalUser: async (data) => {
    const response = await axiosInstance.post("/api/admin/portal/users/invite", data);
    return response.data;
  },

  /**
   * Liste alle Portal-User
   * @param {string} tenantId - Optional: Filter nach Tenant-ID
   */
  listPortalUsers: async (tenantId = null) => {
    const params = tenantId ? { tenant_id: tenantId } : {};
    const response = await axiosInstance.get("/api/admin/portal/users", { params });
    return response.data;
  },
};

