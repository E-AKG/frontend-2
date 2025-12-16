import portalAxiosInstance from "./portalAxiosInstance";

/**
 * Portal API Client für Mieter
 * Endpoints für Betriebskostenabrechnungen und Dokumente
 */
export const portalApi = {
  /**
   * Hole Portal-User-Informationen (inkl. Lease, Unit)
   */
  getMe: async () => {
    const response = await portalAxiosInstance.get("/api/portal/me");
    return response.data;
  },

  /**
   * Liste aller veröffentlichten Betriebskostenabrechnungen
   * @param {number} year - Optional: Filter nach Abrechnungsjahr
   */
  listBKStatements: async (year = null) => {
    const params = year ? { year } : {};
    const response = await portalAxiosInstance.get("/api/portal/bk", { params });
    return response.data;
  },

  /**
   * Hole Details einer Betriebskostenabrechnung
   * @param {string} statementId - ID der Abrechnung
   */
  getBKStatement: async (statementId) => {
    const response = await portalAxiosInstance.get(`/api/portal/bk/${statementId}`);
    return response.data;
  },

  /**
   * Lade ein Dokument herunter
   * @param {string} documentId - ID des Dokuments
   */
  downloadDocument: async (documentId) => {
    const response = await portalAxiosInstance.get(`/api/portal/documents/${documentId}/download`, {
      responseType: "blob",
    });
    return response;
  },

  /**
   * Ändere Passwort des Portal-Users
   * @param {Object} passwordData - { current_password, new_password }
   */
  changePassword: async (passwordData) => {
    const response = await portalAxiosInstance.put("/api/portal/me/password", passwordData);
    return response.data;
  },
};

