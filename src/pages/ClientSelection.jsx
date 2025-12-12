import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { clientApi } from "../api/clientApi";
import { Building2, Calendar, Plus, ArrowRight, Loader2 } from "lucide-react";
import Button from "../components/Button";

export default function ClientSelection() {
  const navigate = useNavigate();
  const { clients, fiscalYears, loading, loadClients, loadFiscalYears, updateClient, updateFiscalYear } = useApp();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState(null);
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [newYearData, setNewYearData] = useState({ year: new Date().getFullYear() + 1, start_date: "", end_date: "" });
  const [creatingYear, setCreatingYear] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadFiscalYears(selectedClientId);
    }
  }, [selectedClientId]);

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    setSelectedFiscalYearId(null);
  };

  const handleFiscalYearSelect = (fiscalYearId) => {
    setSelectedFiscalYearId(fiscalYearId);
  };

  const handleContinue = () => {
    if (!selectedClientId || !selectedFiscalYearId) {
      return;
    }

    const client = clients.find((c) => c.id === selectedClientId);
    const fiscalYear = fiscalYears.find((fy) => fy.id === selectedFiscalYearId);

    if (client && fiscalYear) {
      updateClient(client);
      updateFiscalYear(fiscalYear);
      navigate("/dashboard");
    }
  };

  const handleCreateNewYear = async () => {
    if (!selectedClientId || !newYearData.year || !newYearData.start_date || !newYearData.end_date) {
      return;
    }

    setCreatingYear(true);
    try {
      const response = await clientApi.createFiscalYear(selectedClientId, {
        year: parseInt(newYearData.year),
        start_date: newYearData.start_date,
        end_date: newYearData.end_date,
        is_active: true,
      });

      await loadFiscalYears(selectedClientId);
      setSelectedFiscalYearId(response.data.id);
      setShowNewYearModal(false);
      setNewYearData({ year: newYearData.year + 1, start_date: "", end_date: "" });
    } catch (error) {
      console.error("Fehler beim Erstellen des Geschäftsjahres:", error);
      alert("Fehler beim Erstellen des Geschäftsjahres");
    } finally {
      setCreatingYear(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Mandanten...</p>
        </div>
      </div>
    );
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedFiscalYear = fiscalYears.find((fy) => fy.id === selectedFiscalYearId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Immpire Pro" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mandant & Geschäftsjahr wählen</h1>
          <p className="text-gray-600">Wählen Sie den Mandanten und das Geschäftsjahr für Ihre Arbeit</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Schritt 1: Mandant wählen */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              1. Mandant wählen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedClientId === client.id
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{client.client_type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Schritt 2: Geschäftsjahr wählen */}
          {selectedClientId && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  2. Geschäftsjahr wählen
                </h2>
                <button
                  onClick={() => setShowNewYearModal(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Neues Geschäftsjahr anlegen
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fiscalYears.map((fy) => (
                  <button
                    key={fy.id}
                    onClick={() => handleFiscalYearSelect(fy.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedFiscalYearId === fy.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{fy.year}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(fy.start_date).toLocaleDateString("de-DE")} -{" "}
                      {new Date(fy.end_date).toLocaleDateString("de-DE")}
                    </div>
                    {fy.is_active && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                        Aktiv
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weiter-Button */}
          {selectedClientId && selectedFiscalYearId && (
            <div className="flex justify-end">
              <Button
                onClick={handleContinue}
                className="flex items-center gap-2"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Weiter zum Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Neues Geschäftsjahr */}
      {showNewYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Neues Geschäftsjahr anlegen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
                <input
                  type="number"
                  value={newYearData.year}
                  onChange={(e) => setNewYearData({ ...newYearData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                <input
                  type="date"
                  value={newYearData.start_date}
                  onChange={(e) => setNewYearData({ ...newYearData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
                <input
                  type="date"
                  value={newYearData.end_date}
                  onChange={(e) => setNewYearData({ ...newYearData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewYearModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={creatingYear}
              >
                Abbrechen
              </button>
              <Button onClick={handleCreateNewYear} disabled={creatingYear} className="flex-1">
                {creatingYear ? "Erstelle..." : "Anlegen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

