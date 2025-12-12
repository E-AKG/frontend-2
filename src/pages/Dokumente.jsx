import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { documentApi } from "../api/documentApi";
import { Plus, Upload, FileText, Download, Trash2, Search, Filter } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatDate } from "../utils/formatting";

const DOCUMENT_TYPES = [
  { value: "contract", label: "Mietvertrag" },
  { value: "invoice", label: "Rechnung" },
  { value: "receipt", label: "Quittung" },
  { value: "statement", label: "Abrechnung" },
  { value: "certificate", label: "Zertifikat" },
  { value: "protocol", label: "Protokoll" },
  { value: "other", label: "Sonstiges" },
];

export default function Dokumente() {
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [uploadData, setUploadData] = useState({
    file: null,
    document_type: "other",
    title: "",
    description: "",
    tags: "",
  });

  // Lade Dokumente
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", selectedClient?.id, searchQuery, filterType],
    queryFn: async () => {
      const response = await documentApi.list({
        client_id: selectedClient?.id,
        document_type: filterType || undefined,
        search: searchQuery || undefined,
      });
      return response.data || [];
    },
    enabled: !!selectedClient,
  });

  // Mutation: Dokument hochladen
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      return documentApi.upload(formData.file, {
        client_id: selectedClient?.id,
        document_type: formData.document_type,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      setShowUploadModal(false);
      setUploadData({
        file: null,
        document_type: "other",
        title: "",
        description: "",
        tags: "",
      });
    },
  });

  // Mutation: Dokument löschen
  const deleteMutation = useMutation({
    mutationFn: async (documentId) => {
      return documentApi.delete(documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        title: uploadData.title || file.name,
      });
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert("Bitte wählen Sie eine Datei aus");
      return;
    }
    uploadMutation.mutate(uploadData);
  };

  const handleDownload = (document) => {
    // In Produktion: Download-Link generieren
    window.open(`/api/documents/${document.id}/download`, "_blank");
  };

  const getDocumentTypeLabel = (type) => {
    const docType = DOCUMENT_TYPES.find((t) => t.value === type);
    return docType ? docType.label : type;
  };

  if (!selectedClient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Bitte wählen Sie einen Mandanten aus.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dokumente</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Zentrale Dokumentenverwaltung
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Dokument hochladen
        </Button>
      </div>

      {/* Filter & Suche */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dokumente durchsuchen..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Alle Typen</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dokumente-Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Lade Dokumente...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Keine Dokumente vorhanden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {doc.title || doc.filename}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getDocumentTypeLabel(doc.document_type)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {doc.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {doc.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(doc.created_at)}</span>
                {doc.file_size && (
                  <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  icon={<Download className="w-4 h-4" />}
                  className="flex-1"
                >
                  Herunterladen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Dokument hochladen */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          titel="Dokument hochladen"
          onClose={() => setShowUploadModal(false)}
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datei
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titel
              </label>
              <input
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dokumenttitel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={uploadData.document_type}
                onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung
              </label>
              <textarea
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="Optionale Beschreibung..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (komma-getrennt)
              </label>
              <input
                type="text"
                value={uploadData.tags}
                onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="z.B. Miete, 2024, WEG"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={uploadMutation.isLoading}>
                {uploadMutation.isLoading ? "Lade hoch..." : "Hochladen"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

