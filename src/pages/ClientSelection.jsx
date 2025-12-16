import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { clientApi } from "../api/clientApi";
import { Building2, Calendar, Plus, ArrowRight, Loader2, Edit, X, AlertCircle } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";

export default function ClientSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, fiscalYears, loading, loadClients, loadFiscalYears, updateClient, updateFiscalYear } = useApp();
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState(null);
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newYearData, setNewYearData] = useState({ 
    year: new Date().getFullYear(), 
    start_date: `${new Date().getFullYear()}-01-01`, 
    end_date: `${new Date().getFullYear()}-12-31` 
  });
  const [clientFormData, setClientFormData] = useState({
    name: "",
    client_type: "private_landlord",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [creatingYear, setCreatingYear] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadFiscalYears(selectedClientId);
    }
  }, [selectedClientId]);

  // Wenn keine Mandanten vorhanden sind, öffne automatisch das Erstellungs-Modal
  useEffect(() => {
    if (!loading && clients.length === 0 && !showClientModal) {
      setShowClientModal(true);
    }
  }, [loading, clients.length, showClientModal]);

  // Wenn über /clients/new aufgerufen, öffne automatisch das Erstellungs-Modal
  useEffect(() => {
    if (location.pathname === "/clients/new" && !showClientModal && !loading) {
      setEditingClient(null);
      setClientFormData({
        name: "",
        client_type: "private_landlord",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      setShowClientModal(true);
      // Entferne /clients/new aus der URL
      navigate("/client-selection", { replace: true });
    }
  }, [location.pathname, showClientModal, loading, navigate]);

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

  const handleCreateClient = async () => {
    if (!clientFormData.name) {
      zeigeBenachrichtigung("Bitte geben Sie einen Namen ein", "fehler");
      return;
    }

    setCreatingClient(true);
    try {
      const response = await clientApi.create(clientFormData);
      await loadClients();
      setSelectedClientId(response.data.id);
      setShowClientModal(false);
      setClientFormData({
        name: "",
        client_type: "private_landlord",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      zeigeBenachrichtigung("Mandant erfolgreich erstellt");
      
      // Automatisch ein Geschäftsjahr für das aktuelle Jahr erstellen
      const currentYear = new Date().getFullYear();
      try {
        const yearResponse = await clientApi.createFiscalYear(response.data.id, {
          year: currentYear,
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`,
          is_active: true,
        });
        await loadFiscalYears(response.data.id);
        setSelectedFiscalYearId(yearResponse.data.id);
      } catch (yearError) {
        console.error("Fehler beim Erstellen des Geschäftsjahres:", yearError);
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Mandanten:", error);
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Erstellen des Mandanten",
        "fehler"
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !clientFormData.name) {
      zeigeBenachrichtigung("Bitte geben Sie einen Namen ein", "fehler");
      return;
    }

    setCreatingClient(true);
    try {
      await clientApi.update(editingClient.id, clientFormData);
      await loadClients();
      setShowClientModal(false);
      setEditingClient(null);
      setClientFormData({
        name: "",
        client_type: "private_landlord",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      zeigeBenachrichtigung("Mandant erfolgreich aktualisiert");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Mandanten:", error);
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Aktualisieren des Mandanten",
        "fehler"
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateNewYear = async () => {
    if (!selectedClientId || !newYearData.year || !newYearData.start_date || !newYearData.end_date) {
      zeigeBenachrichtigung("Bitte füllen Sie alle Felder aus", "fehler");
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
      const nextYear = parseInt(newYearData.year) + 1;
      setNewYearData({ 
        year: nextYear, 
        start_date: `${nextYear}-01-01`, 
        end_date: `${nextYear}-12-31` 
      });
      zeigeBenachrichtigung("Geschäftsjahr erfolgreich erstellt");
    } catch (error) {
      console.error("Fehler beim Erstellen des Geschäftsjahres:", error);
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Erstellen des Geschäftsjahres",
        "fehler"
      );
    } finally {
      setCreatingYear(false);
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      client_type: client.client_type,
      contact_name: client.contact_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setShowClientModal(true);
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
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                1. Mandant wählen
              </h2>
              <Button
                onClick={() => {
                  setEditingClient(null);
                  setClientFormData({
                    name: "",
                    client_type: "private_landlord",
                    contact_name: "",
                    email: "",
                    phone: "",
                    address: "",
                    notes: "",
                  });
                  setShowClientModal(true);
                }}
                size="sm"
                icon={<Plus className="w-4 h-4" />}
              >
                Neuer Mandant
              </Button>
            </div>
            
            {clients.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Noch keine Mandanten vorhanden</p>
                <Button
                  onClick={() => {
                    setEditingClient(null);
                    setClientFormData({
                      name: "",
                      client_type: "private_landlord",
                      contact_name: "",
                      email: "",
                      phone: "",
                      address: "",
                      notes: "",
                    });
                    setShowClientModal(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Ersten Mandanten erstellen
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedClientId === client.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => handleClientSelect(client.id)}
                        className="flex-1 text-left"
                      >
                        <div className="font-semibold text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {client.client_type === "private_landlord" ? "Privater Vermieter" :
                           client.client_type === "weg" ? "WEG" :
                           client.client_type === "company" ? "Firma" :
                           client.client_type === "fund" ? "Fonds" : "Sonstiges"}
                        </div>
                        {client.email && (
                          <div className="text-xs text-gray-500 mt-1">{client.email}</div>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClient(client);
                        }}
                        className="ml-2 p-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schritt 2: Geschäftsjahr wählen */}
          {selectedClientId && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  2. Geschäftsjahr wählen
                </h2>
                <Button
                  onClick={() => {
                    const currentYear = new Date().getFullYear();
                    setNewYearData({
                      year: currentYear,
                      start_date: `${currentYear}-01-01`,
                      end_date: `${currentYear}-12-31`,
                    });
                    setShowNewYearModal(true);
                  }}
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  Neues Geschäftsjahr anlegen
                </Button>
              </div>
              
              {fiscalYears.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Noch kein Geschäftsjahr vorhanden</p>
                  <Button
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      setNewYearData({
                        year: currentYear,
                        start_date: `${currentYear}-01-01`,
                        end_date: `${currentYear}-12-31`,
                      });
                      setShowNewYearModal(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Erstes Geschäftsjahr erstellen
                  </Button>
                </div>
              ) : (
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
              )}
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

      {/* Modal: Mandant erstellen/bearbeiten */}
      <Modal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setEditingClient(null);
          setClientFormData({
            name: "",
            client_type: "private_landlord",
            contact_name: "",
            email: "",
            phone: "",
            address: "",
            notes: "",
          });
        }}
        titel={editingClient ? "Mandant bearbeiten" : "Neuen Mandanten erstellen"}
        groesse="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingClient) {
              handleUpdateClient();
            } else {
              handleCreateClient();
            }
          }}
          className="space-y-4"
        >
          <Formularfeld
            label="Name des Mandanten"
            value={clientFormData.name}
            onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
            placeholder="z.B. WEG Müllerstraße, GbR Schmidt"
            required
          />
          <Auswahl
            label="Mandantentyp"
            value={clientFormData.client_type}
            onChange={(e) => setClientFormData({ ...clientFormData, client_type: e.target.value })}
            optionen={[
              { value: "private_landlord", label: "Privater Vermieter" },
              { value: "weg", label: "WEG (Wohnungseigentümergemeinschaft)" },
              { value: "company", label: "Firma / Eigenbestand" },
              { value: "fund", label: "Fonds" },
              { value: "other", label: "Sonstiges" },
            ]}
            required
          />
          <Formularfeld
            label="Kontaktperson (optional)"
            value={clientFormData.contact_name}
            onChange={(e) => setClientFormData({ ...clientFormData, contact_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Formularfeld
              label="E-Mail (optional)"
              type="email"
              value={clientFormData.email}
              onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
            />
            <Formularfeld
              label="Telefon (optional)"
              value={clientFormData.phone}
              onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
            />
          </div>
          <Formularfeld
            label="Adresse (optional)"
            value={clientFormData.address}
            onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
          />
          <Formularfeld
            label="Notizen (optional)"
            type="textarea"
            value={clientFormData.notes}
            onChange={(e) => setClientFormData({ ...clientFormData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowClientModal(false);
                setEditingClient(null);
                setClientFormData({
                  name: "",
                  client_type: "private_landlord",
                  contact_name: "",
                  email: "",
                  phone: "",
                  address: "",
                  notes: "",
                });
              }}
              disabled={creatingClient}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={creatingClient}>
              {creatingClient ? "Speichere..." : editingClient ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Neues Geschäftsjahr */}
      <Modal
        isOpen={showNewYearModal}
        onClose={() => {
          setShowNewYearModal(false);
          const currentYear = new Date().getFullYear();
          setNewYearData({
            year: currentYear,
            start_date: `${currentYear}-01-01`,
            end_date: `${currentYear}-12-31`,
          });
        }}
        titel="Neues Geschäftsjahr anlegen"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateNewYear();
          }}
          className="space-y-4"
        >
          <Formularfeld
            label="Jahr"
            type="number"
            value={newYearData.year}
            onChange={(e) => {
              const year = parseInt(e.target.value);
              setNewYearData({
                ...newYearData,
                year: year,
                start_date: `${year}-01-01`,
                end_date: `${year}-12-31`,
              });
            }}
            required
          />
          <Formularfeld
            label="Startdatum"
            type="date"
            value={newYearData.start_date}
            onChange={(e) => setNewYearData({ ...newYearData, start_date: e.target.value })}
            required
          />
          <Formularfeld
            label="Enddatum"
            type="date"
            value={newYearData.end_date}
            onChange={(e) => setNewYearData({ ...newYearData, end_date: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNewYearModal(false);
                const currentYear = new Date().getFullYear();
                setNewYearData({
                  year: currentYear,
                  start_date: `${currentYear}-01-01`,
                  end_date: `${currentYear}-12-31`,
                });
              }}
              disabled={creatingYear}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={creatingYear}>
              {creatingYear ? "Erstelle..." : "Anlegen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

