import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPortalApi } from "../api/adminPortalApi";
import { documentApi } from "../api/documentApi";
import { tenantApi } from "../api/tenantApi";
import { useApp } from "../contexts/AppContext";
import { FileText, Upload, Link2, Send, Download, X, Check, AlertCircle, Edit } from "lucide-react";
import Modal from "../components/Modal";
import Button from "../components/Button";

/**
 * Admin-Bereich für BK-Verwaltung
 * Upload, Verknüpfung und Veröffentlichung von Betriebskostenabrechnungen
 */
export default function AdminBKVerwaltung() {
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    files: [], // Unterstützt jetzt mehrere Dateien
    document_type: "bk_statement",
    title: "",
    billing_year: new Date().getFullYear(),
    unit_id: "",
    tenant_ids: [], // Unterstützt jetzt mehrere Mieter
  });

  // Hole alle Tenants für Auswahl
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ["tenants", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const response = await tenantApi.list({ client_id: selectedClient.id });
      return response.data?.items || [];
    },
    enabled: !!selectedClient?.id,
  });

  const [selectedStatement, setSelectedStatement] = useState(null);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [selectedTenantsForPublish, setSelectedTenantsForPublish] = useState([]); // Für Bearbeitung vor Veröffentlichung

  // Hole DRAFT Dokumente (Statements und Receipts)
  const { data: draftStatements = [], isLoading: statementsLoading } = useQuery({
    queryKey: ["admin-draft-statements", selectedYear],
    queryFn: async () => {
      // TODO: Endpoint für DRAFT Statements erstellen
      // Für jetzt verwenden wir documentApi
      const response = await documentApi.list({
        client_id: selectedClient?.id,
        document_type: "bk_statement",
        status: "draft",
        billing_year: selectedYear,
      });
      return response.data?.items || response.data || [];
    },
  });

  const { data: draftReceipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ["admin-draft-receipts", selectedYear],
    queryFn: async () => {
      const response = await documentApi.list({
        client_id: selectedClient?.id,
        document_type: "bk_receipt",
        status: "draft",
        billing_year: selectedYear,
      });
      return response.data?.items || response.data || [];
    },
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      return adminPortalApi.uploadDocument(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-draft-statements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-receipts"] });
      setUploadModalOpen(false);
      setUploadForm({
        files: [],
        document_type: "bk_statement",
        title: "",
        billing_year: selectedYear,
        unit_id: "",
        tenant_ids: [],
      });
    },
  });

  // Link Mutation
  const linkMutation = useMutation({
    mutationFn: async ({ statementId, receiptIds }) => {
      return adminPortalApi.linkReceipts(selectedYear, statementId, receiptIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-draft-statements"] });
      setLinkModalOpen(false);
      setSelectedStatement(null);
      setSelectedReceipts([]);
    },
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: async ({ statementId, receiptIds, tenantIds }) => {
      return adminPortalApi.publishBKStatement(selectedYear, statementId, receiptIds, tenantIds);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-draft-statements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-receipts"] });
      setPublishModalOpen(false);
      setSelectedStatement(null);
      setSelectedReceipts([]);
      alert(`Erfolgreich veröffentlicht! ${data.notifications?.sent || 0} Benachrichtigungen gesendet.`);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ documentId, data }) => {
      return documentApi.update(documentId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-draft-statements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-receipts"] });
      setEditModalOpen(false);
      setSelectedStatement(null);
      alert("Dokument erfolgreich aktualisiert!");
    },
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.files || uploadForm.files.length === 0) {
      alert("Bitte wählen Sie mindestens eine Datei aus");
      return;
    }

    // Erstelle ein FormData mit allen Dateien
    const formData = new FormData();
    
    // Füge alle Dateien hinzu (Backend erwartet "files" als Liste)
    uploadForm.files.forEach((file) => {
      formData.append("files", file);
    });
    
    formData.append("document_type", uploadForm.document_type);
    formData.append("title", uploadForm.title || uploadForm.files[0]?.name || "");
    formData.append("billing_year", uploadForm.billing_year.toString());
    if (uploadForm.unit_id) formData.append("unit_id", uploadForm.unit_id);
    
    // Füge alle ausgewählten tenant_ids hinzu
    if (uploadForm.tenant_ids && uploadForm.tenant_ids.length > 0) {
      uploadForm.tenant_ids.forEach((tenantId) => {
        formData.append("tenant_ids", tenantId);
      });
    }

    try {
      await adminPortalApi.uploadDocument(formData);
      queryClient.invalidateQueries({ queryKey: ["admin-draft-statements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-receipts"] });
      setUploadModalOpen(false);
      setUploadForm({
        files: [],
        document_type: "bk_statement",
        title: "",
        billing_year: selectedYear,
        unit_id: "",
        tenant_ids: [],
      });
      alert(`Erfolgreich ${uploadForm.files.length} Datei(en) hochgeladen!`);
    } catch (error) {
      console.error("Upload-Fehler:", error);
      alert("Fehler beim Hochladen der Dateien");
    }
  };

  const handleLink = () => {
    if (!selectedStatement || selectedReceipts.length === 0) {
      alert("Bitte wählen Sie ein Statement und mindestens einen Beleg aus");
      return;
    }
    linkMutation.mutate({
      statementId: selectedStatement.id,
      receiptIds: selectedReceipts.map((r) => r.id),
    });
  };

  const handlePublish = () => {
    if (!selectedStatement) {
      alert("Bitte wählen Sie ein Statement aus");
      return;
    }
    publishMutation.mutate({
      statementId: selectedStatement.id,
      receiptIds: selectedReceipts.length > 0 ? selectedReceipts.map((r) => r.id) : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Betriebskostenabrechnungen</h1>
          <p className="text-slate-600 mt-1">Verwaltung und Veröffentlichung</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Dokument hochladen
          </Button>
        </div>
      </div>

      {/* Statements */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Abrechnungen ({selectedYear})
        </h2>

        {statementsLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : draftStatements.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Keine Abrechnungen für {selectedYear}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {draftStatements.map((statement) => (
              <div
                key={statement.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-cyan-600" />
                      <h3 className="font-semibold text-slate-900">
                        {statement.title || statement.filename}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Entwurf
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {statement.billing_year} • {statement.filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStatement(statement);
                        setEditModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatement(statement);
                        setLinkModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Belege verknüpfen
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStatement(statement);
                        setPublishModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Veröffentlichen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Dokument hochladen"
        groesse="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dokumenttyp
            </label>
            <select
              value={uploadForm.document_type}
              onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="bk_statement">Betriebskostenabrechnung</option>
              <option value="bk_receipt">Beleg</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dateien (mehrere möglich)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setUploadForm({ ...uploadForm, files });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            {uploadForm.files.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadForm.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = uploadForm.files.filter((_, i) => i !== index);
                        setUploadForm({ ...uploadForm, files: newFiles });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Sie können mehrere Dateien gleichzeitig auswählen
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titel
            </label>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="z.B. Betriebskostenabrechnung 2025"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Abrechnungsjahr
            </label>
            <input
              type="number"
              value={uploadForm.billing_year}
              onChange={(e) => setUploadForm({ ...uploadForm, billing_year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mieter (für Benachrichtigung) - Mehrfachauswahl möglich
            </label>
            <div className="border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
              {tenantsLoading ? (
                <div className="text-sm text-slate-500">Lade Mieter...</div>
              ) : tenants.length === 0 ? (
                <div className="text-sm text-slate-500">Keine Mieter verfügbar</div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadForm.tenant_ids.length === tenants.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUploadForm({ ...uploadForm, tenant_ids: tenants.map((t) => t.id) });
                        } else {
                          setUploadForm({ ...uploadForm, tenant_ids: [] });
                        }
                      }}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Alle auswählen</span>
                  </label>
                  <div className="border-t border-slate-200 my-2"></div>
                  {tenants.map((tenant) => (
                    <label
                      key={tenant.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={uploadForm.tenant_ids.includes(tenant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUploadForm({
                              ...uploadForm,
                              tenant_ids: [...uploadForm.tenant_ids, tenant.id],
                            });
                          } else {
                            setUploadForm({
                              ...uploadForm,
                              tenant_ids: uploadForm.tenant_ids.filter((id) => id !== tenant.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-cyan-600 rounded"
                      />
                      <span className="text-sm text-slate-700">
                        {tenant.first_name} {tenant.last_name}
                        {tenant.email && <span className="text-slate-500"> ({tenant.email})</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Wählen Sie einen oder mehrere Mieter aus, die über die neue Abrechnung benachrichtigt werden sollen.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {uploadMutation.isPending ? "Hochladen..." : "Hochladen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Modal */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Belege verknüpfen"
        groesse="lg"
      >
        {selectedStatement && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Statement</p>
              <p className="font-semibold text-slate-900">
                {selectedStatement.title || selectedStatement.filename}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verfügbare Belege
              </label>
              {receiptsLoading ? (
                <div className="text-center py-4">Lade Belege...</div>
              ) : draftReceipts.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  Keine Belege verfügbar. Laden Sie zuerst Belege hoch.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {draftReceipts.map((receipt) => (
                    <label
                      key={receipt.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReceipts.some((r) => r.id === receipt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReceipts([...selectedReceipts, receipt]);
                          } else {
                            setSelectedReceipts(selectedReceipts.filter((r) => r.id !== receipt.id));
                          }
                        }}
                        className="w-4 h-4 text-cyan-600 rounded"
                      />
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {receipt.title || receipt.filename}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => setLinkModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleLink}
                disabled={linkMutation.isPending || selectedReceipts.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {linkMutation.isPending ? "Verknüpfen..." : "Verknüpfen"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Publish Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Abrechnung veröffentlichen"
        groesse="md"
      >
        {selectedStatement && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    Abrechnung wird veröffentlicht
                  </p>
                  <p className="text-sm text-yellow-700">
                    Die Abrechnung "{selectedStatement.title || selectedStatement.filename}" wird
                    für Mieter sichtbar gemacht. Alle betroffenen Mieter erhalten eine E-Mail-Benachrichtigung.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Statement</p>
              <p className="font-semibold text-slate-900">
                {selectedStatement.title || selectedStatement.filename}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Jahr: {selectedStatement.billing_year}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => setPublishModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {publishMutation.isPending ? "Veröffentlichen..." : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Veröffentlichen & Benachrichtigen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedStatement(null);
        }}
        title="Abrechnung bearbeiten"
        groesse="lg"
      >
        {selectedStatement && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                title: formData.get("title") || null,
                description: formData.get("description") || null,
                billing_year: formData.get("billing_year") ? parseInt(formData.get("billing_year")) : null,
                tenant_id: formData.get("tenant_id") || null,
              };
              updateMutation.mutate({ documentId: selectedStatement.id, data });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titel
              </label>
              <input
                type="text"
                name="title"
                defaultValue={selectedStatement.title || selectedStatement.filename}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Beschreibung
              </label>
              <textarea
                name="description"
                defaultValue={selectedStatement.description || ""}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Abrechnungsjahr
              </label>
              <input
                type="number"
                name="billing_year"
                defaultValue={selectedStatement.billing_year || selectedYear}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mieter (optional)
              </label>
              <select
                name="tenant_id"
                defaultValue={selectedStatement.tenant_id || ""}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Keine Zuordnung --</option>
                {tenantsLoading ? (
                  <option disabled>Lade Mieter...</option>
                ) : (
                  tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name} {tenant.email ? `(${tenant.email})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedStatement(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {updateMutation.isPending ? "Speichern..." : "Speichern"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

