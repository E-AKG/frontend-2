import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/propertyApi";
import { unitApi } from "../api/unitApi";
import { meterApi } from "../api/meterApi";
import { keyApi } from "../api/keyApi";
import { tenantApi } from "../api/tenantApi";
import { useApp } from "../contexts/AppContext";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { Gauge, Key as KeyIcon, Plus, Edit, Trash2, Calendar, User, History, TrendingUp } from "lucide-react";

export default function ObjektDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedClient } = useApp();
  const [objekt, setObjekt] = useState(null);
  const [einheiten, setEinheiten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("units");
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showMeterReadingsModal, setShowMeterReadingsModal] = useState(false);
  const [showKeyHistoryModal, setShowKeyHistoryModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const [bearbeiteterZaehler, setBearbeiteterZaehler] = useState(null);
  const [bearbeiteterSchluessel, setBearbeiteterSchluessel] = useState(null);
  const [ausgewaehlterZaehler, setAusgewaehlterZaehler] = useState(null);
  const [ausgewaehlterSchluessel, setAusgewaehlterSchluessel] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  // Lade Zähler
  const { data: meters = [], refetch: refetchMeters } = useQuery({
    queryKey: ["meters", id],
    queryFn: async () => {
      const response = await meterApi.list({ property_id: id });
      return response.data || [];
    },
    enabled: !!id,
  });

  // Lade Schlüssel
  const { data: keys = [], refetch: refetchKeys } = useQuery({
    queryKey: ["keys", id],
    queryFn: async () => {
      const response = await keyApi.list({ property_id: id });
      return response.data || [];
    },
    enabled: !!id,
  });

  const [formDaten, setFormDaten] = useState({
    unit_label: "",
    floor: "",
    size_sqm: "",
    status: "vacant",
  });

  useEffect(() => {
    ladeObjekt();
    ladeEinheiten();
  }, [id]);

  const ladeObjekt = async () => {
    try {
      const response = await propertyApi.get(id);
      setObjekt(response.data);
    } catch (error) {
      zeigeBenachrichtigung("Fehler beim Laden des Objekts", "fehler");
    }
  };

  const ladeEinheiten = async () => {
    try {
      setLoading(true);
      const response = await unitApi.list({ property_id: id });
      setEinheiten(response.data.items);
    } catch (error) {
      zeigeBenachrichtigung("Fehler beim Laden der Einheiten", "fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const daten = {
        property_id: id,
        unit_label: formDaten.unit_label,
        floor: formDaten.floor ? parseInt(formDaten.floor) : null,
        size_sqm: formDaten.size_sqm ? parseInt(formDaten.size_sqm) : null,
        status: formDaten.status,
      };

      if (bearbeitung) {
        await unitApi.update(bearbeitung.id, {
          unit_label: daten.unit_label,
          floor: daten.floor,
          size_sqm: daten.size_sqm,
          status: daten.status,
        });
        zeigeBenachrichtigung("Einheit erfolgreich aktualisiert");
      } else {
        await unitApi.create(daten);
        zeigeBenachrichtigung("Einheit erfolgreich erstellt");
      }

      setShowModal(false);
      setBearbeitung(null);
      formZuruecksetzen();
      ladeEinheiten();
    } catch (error) {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Speichern",
        "fehler"
      );
    }
  };

  const handleLoeschen = async (einheit) => {
    if (!confirm(`Einheit "${einheit.unit_label}" wirklich löschen?`)) return;

    try {
      await unitApi.remove(einheit.id);
      zeigeBenachrichtigung("Einheit erfolgreich gelöscht");
      ladeEinheiten();
    } catch (error) {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Löschen",
        "fehler"
      );
    }
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      unit_label: "",
      floor: "",
      size_sqm: "",
      status: "vacant",
    });
  };

  // Meter Mutations
  const createMeterMutation = useMutation({
    mutationFn: (data) => meterApi.create(data, selectedClient?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters", id] });
      zeigeBenachrichtigung("Zähler erfolgreich erstellt");
      setShowMeterModal(false);
      setMeterForm({
        meter_number: "",
        meter_type: "water",
        location: "",
        unit_id: "",
        calibration_due_date: "",
      });
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Erstellen",
        "fehler"
      );
    },
  });

  const updateMeterMutation = useMutation({
    mutationFn: ({ meterId, data }) => meterApi.update(meterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters", id] });
      zeigeBenachrichtigung("Zähler erfolgreich aktualisiert");
      setShowMeterModal(false);
      setBearbeiteterZaehler(null);
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Aktualisieren",
        "fehler"
      );
    },
  });

  const deleteMeterMutation = useMutation({
    mutationFn: (meterId) => meterApi.delete(meterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters", id] });
      zeigeBenachrichtigung("Zähler erfolgreich gelöscht");
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
    },
  });

  const createReadingMutation = useMutation({
    mutationFn: ({ meterId, data }) => meterApi.createReading(meterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters", id] });
      queryClient.invalidateQueries({ queryKey: ["meterReadings", ausgewaehlterZaehler?.id] });
      zeigeBenachrichtigung("Zählerstand erfolgreich erfasst");
      setReadingForm({
        reading_value: "",
        reading_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Erfassen", "fehler");
    },
  });

  // Key Mutations
  const createKeyMutation = useMutation({
    mutationFn: (data) => keyApi.create(data, selectedClient?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys", id] });
      zeigeBenachrichtigung("Schlüssel erfolgreich erstellt");
      setShowKeyModal(false);
      setKeyForm({
        key_type: "apartment",
        key_number: "",
        description: "",
        unit_id: "",
      });
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Erstellen",
        "fehler"
      );
    },
  });

  const updateKeyMutation = useMutation({
    mutationFn: ({ keyId, data }) => keyApi.update(keyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys", id] });
      zeigeBenachrichtigung("Schlüssel erfolgreich aktualisiert");
      setShowKeyModal(false);
      setBearbeiteterSchluessel(null);
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Aktualisieren", "fehler");
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId) => keyApi.delete(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys", id] });
      zeigeBenachrichtigung("Schlüssel erfolgreich gelöscht");
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
    },
  });

  const assignKeyMutation = useMutation({
    mutationFn: ({ keyId, data }) => keyApi.action(keyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys", id] });
      queryClient.invalidateQueries({ queryKey: ["keyHistory", ausgewaehlterSchluessel?.id] });
      zeigeBenachrichtigung("Schlüssel erfolgreich zugewiesen");
      setKeyAssignForm({
        assigned_to_type: "tenant",
        assigned_to_id: "",
        notes: "",
      });
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler bei der Zuweisung", "fehler");
    },
  });

  // Lade Zählerstände
  const { data: meterReadings = [] } = useQuery({
    queryKey: ["meterReadings", ausgewaehlterZaehler?.id],
    queryFn: async () => {
      if (!ausgewaehlterZaehler?.id) return [];
      const response = await meterApi.listReadings(ausgewaehlterZaehler.id);
      return response.data || [];
    },
    enabled: !!ausgewaehlterZaehler?.id,
  });

  // Lade Schlüssel-Historie
  const { data: keyHistory = [] } = useQuery({
    queryKey: ["keyHistory", ausgewaehlterSchluessel?.id],
    queryFn: async () => {
      if (!ausgewaehlterSchluessel?.id) return [];
      const response = await keyApi.getHistory(ausgewaehlterSchluessel.id);
      return response.data || [];
    },
    enabled: !!ausgewaehlterSchluessel?.id,
  });

  const spalten = [
    { key: "unit_label", label: "Bezeichnung" },
    { key: "floor", label: "Etage", render: (zeile) => zeile.floor || "—" },
    {
      key: "size_sqm",
      label: "Fläche (m²)",
      render: (zeile) => (zeile.size_sqm ? `${zeile.size_sqm} m²` : "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (zeile) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            zeile.status === "vacant"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {zeile.status === "vacant" ? "Leer" : "Vermietet"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aktionen",
      render: (zeile) => (
        <div className="flex space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBearbeitung(zeile);
              setFormDaten({
                unit_label: zeile.unit_label,
                floor: zeile.floor || "",
                size_sqm: zeile.size_sqm || "",
                status: zeile.status,
              });
              setShowModal(true);
            }}
            className="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            Bearbeiten
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLoeschen(zeile);
            }}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Löschen
          </button>
        </div>
      ),
    },
  ];

  if (!objekt) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/objekte")}
        className="flex items-center text-slate-600 hover:text-slate-900 mb-4 sm:mb-6 text-sm sm:text-[15px] touch-manipulation"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zurück zu Objekte
      </button>

      {/* Objekt-Info */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{objekt.name}</h1>
        <p className="text-slate-600 text-sm sm:text-[15px] mb-4 sm:mb-6">{objekt.address}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Baujahr</p>
            <p className="text-base sm:text-lg font-semibold text-slate-900">
              {objekt.year_built || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Fläche</p>
            <p className="text-base sm:text-lg font-semibold text-slate-900">
              {objekt.size_sqm ? `${objekt.size_sqm} m²` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Einheiten</p>
            <p className="text-base sm:text-lg font-semibold text-slate-900">{einheiten.length}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Vermietet</p>
            <p className="text-base sm:text-lg font-semibold text-slate-900">
              {einheiten.filter((e) => e.status === "occupied").length}
            </p>
          </div>
        </div>

        {objekt.notes && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-slate-500 mb-1">Notizen</p>
            <p className="text-sm sm:text-[15px] text-slate-700">{objekt.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-8">
          {[
            { id: "units", label: "Einheiten", count: einheiten.length },
            { id: "meters", label: "Zähler", count: meters.length, icon: Gauge },
            { id: "keys", label: "Schlüssel", count: keys.length, icon: KeyIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.count > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "units" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Wohneinheiten</h2>
            <Button
              onClick={() => {
                setBearbeitung(null);
                formZuruecksetzen();
                setShowModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              + Neue Einheit
            </Button>
          </div>
          <Tabelle spalten={spalten} daten={einheiten} loading={loading} />
        </div>
      )}

      {activeTab === "meters" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Zähler</h2>
            <Button
              onClick={() => {
                // TODO: Modal für neuen Zähler
                alert("Zähler-Verwaltung wird implementiert");
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              + Neuer Zähler
            </Button>
          </div>
          {meters.length > 0 ? (
            <div className="space-y-3">
              {meters.map((meter) => (
                <div
                  key={meter.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-primary-600" />
                        {meter.meter_number} - {meter.meter_type === "water" ? "Wasser" : meter.meter_type === "heat" ? "Heizung" : meter.meter_type === "electricity" ? "Strom" : "Gas"}
                      </div>
                      {meter.location && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Standort: {meter.location}
                        </div>
                      )}
                      {meter.unit_label && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Einheit: {meter.unit_label}
                        </div>
                      )}
                      {meter.calibration_due_date && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Eichfrist: {new Date(meter.calibration_due_date).toLocaleDateString("de-DE")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setAusgewaehlterZaehler(meter);
                          setShowMeterReadingsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                        title="Zählerstände"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setBearbeiteterZaehler(meter);
                          setMeterForm({
                            meter_number: meter.meter_number || "",
                            meter_type: meter.meter_type || "water",
                            location: meter.location || "",
                            unit_id: meter.unit_id || "",
                            calibration_due_date: meter.calibration_due_date ? new Date(meter.calibration_due_date).toISOString().split("T")[0] : "",
                          });
                          setShowMeterModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Zähler wirklich löschen?")) {
                            deleteMeterMutation.mutate(meter.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Keine Zähler vorhanden
            </div>
          )}
        </div>
      )}

      {activeTab === "keys" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Schlüssel</h2>
            <Button
              onClick={() => {
                setBearbeiteterSchluessel(null);
                setKeyForm({
                  key_type: "apartment",
                  key_number: "",
                  description: "",
                  unit_id: "",
                });
                setShowKeyModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
              icon={<Plus className="w-4 h-4" />}
            >
              Neuer Schlüssel
            </Button>
          </div>
          {keys.length > 0 ? (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <KeyIcon className="w-4 h-4 text-primary-600" />
                        {key.key_type === "apartment" ? "Wohnungsschlüssel" : key.key_type === "basement" ? "Kellerschlüssel" : key.key_type === "mailbox" ? "Briefkastenschlüssel" : "Sonstiger Schlüssel"}
                        {key.key_number && ` - ${key.key_number}`}
                      </div>
                      {key.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {key.description}
                        </div>
                      )}
                      {key.unit_label && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Einheit: {key.unit_label}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            key.status === "available"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : key.status === "out"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {key.status === "available"
                            ? "Verfügbar"
                            : key.status === "out"
                            ? "Ausgegeben"
                            : key.status}
                        </span>
                        {key.assigned_to_name && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            an: {key.assigned_to_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setAusgewaehlterSchluessel(key);
                          setShowKeyHistoryModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                        title="Historie"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {key.status === "available" && (
                        <button
                          onClick={() => {
                            setAusgewaehlterSchluessel(key);
                            setKeyAssignForm({
                              assigned_to_type: "tenant",
                              assigned_to_id: "",
                              notes: "",
                            });
                            // Öffne Zuweisungs-Modal
                            setShowKeyModal(true);
                          }}
                          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                          title="Zuweisen"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setBearbeiteterSchluessel(key);
                          setKeyForm({
                            key_type: key.key_type || "apartment",
                            key_number: key.key_number || "",
                            description: key.description || "",
                            unit_id: key.unit_id || "",
                          });
                          setShowKeyModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Schlüssel wirklich löschen?")) {
                            deleteKeyMutation.mutate(key.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Keine Schlüssel vorhanden
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setBearbeitung(null);
          formZuruecksetzen();
        }}
        titel={bearbeitung ? "Einheit bearbeiten" : "Neue Einheit"}
      >
        <form onSubmit={handleSubmit}>
          <Formularfeld
            label="Bezeichnung"
            name="unit_label"
            value={formDaten.unit_label}
            onChange={(e) => setFormDaten({ ...formDaten, unit_label: e.target.value })}
            placeholder="z.B. Wohnung 1A"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Formularfeld
              label="Etage"
              name="floor"
              type="number"
              value={formDaten.floor}
              onChange={(e) => setFormDaten({ ...formDaten, floor: e.target.value })}
              placeholder="z.B. 2"
            />
            <Formularfeld
              label="Fläche (m²)"
              name="size_sqm"
              type="number"
              value={formDaten.size_sqm}
              onChange={(e) => setFormDaten({ ...formDaten, size_sqm: e.target.value })}
              placeholder="z.B. 65"
            />
          </div>
          <Auswahl
            label="Status"
            name="status"
            value={formDaten.status}
            onChange={(e) => setFormDaten({ ...formDaten, status: e.target.value })}
            optionen={[
              { value: "vacant", label: "Leer" },
              { value: "occupied", label: "Vermietet" },
            ]}
            required
            className="mt-4"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setBearbeitung(null);
                formZuruecksetzen();
              }}
              className="w-full sm:w-auto"
            >
              Abbrechen
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {bearbeitung ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Meter Modal */}
      <Modal
        isOpen={showMeterModal}
        onClose={() => {
          setShowMeterModal(false);
          setBearbeiteterZaehler(null);
        }}
        titel={bearbeiteterZaehler ? "Zähler bearbeiten" : "Neuer Zähler"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = {
              property_id: id,
              meter_number: meterForm.meter_number,
              meter_type: meterForm.meter_type,
              location: meterForm.location || null,
              unit_id: meterForm.unit_id || null,
              calibration_due_date: meterForm.calibration_due_date || null,
            };
            if (bearbeiteterZaehler) {
              updateMeterMutation.mutate({ meterId: bearbeiteterZaehler.id, data });
            } else {
              createMeterMutation.mutate(data);
            }
          }}
          className="space-y-4"
        >
          <Formularfeld
            label="Zählernummer"
            value={meterForm.meter_number}
            onChange={(e) => setMeterForm({ ...meterForm, meter_number: e.target.value })}
            required
          />
          <Auswahl
            label="Zählertyp"
            value={meterForm.meter_type}
            onChange={(e) => setMeterForm({ ...meterForm, meter_type: e.target.value })}
            optionen={[
              { value: "water", label: "Wasser" },
              { value: "heat", label: "Heizung" },
              { value: "electricity", label: "Strom" },
              { value: "gas", label: "Gas" },
            ]}
            required
          />
          <Auswahl
            label="Einheit (optional)"
            value={meterForm.unit_id}
            onChange={(e) => setMeterForm({ ...meterForm, unit_id: e.target.value })}
            optionen={[
              { value: "", label: "Keine Zuordnung" },
              ...einheiten.map((u) => ({ value: u.id, label: u.unit_label })),
            ]}
          />
          <Formularfeld
            label="Standort"
            value={meterForm.location}
            onChange={(e) => setMeterForm({ ...meterForm, location: e.target.value })}
            placeholder="z.B. Keller, Wohnung 1A"
          />
          <Formularfeld
            label="Eichfrist"
            type="date"
            value={meterForm.calibration_due_date}
            onChange={(e) => setMeterForm({ ...meterForm, calibration_due_date: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowMeterModal(false);
                setBearbeiteterZaehler(null);
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              {bearbeiteterZaehler ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Meter Readings Modal */}
      <Modal
        isOpen={showMeterReadingsModal}
        onClose={() => {
          setShowMeterReadingsModal(false);
          setAusgewaehlterZaehler(null);
        }}
        titel={`Zählerstände - ${ausgewaehlterZaehler?.meter_number || ""}`}
        groesse="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Neuer Zählerstand</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReadingMutation.mutate({
                  meterId: ausgewaehlterZaehler.id,
                  data: {
                    reading_value: parseFloat(readingForm.reading_value),
                    reading_date: readingForm.reading_date,
                    notes: readingForm.notes || null,
                  },
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <Formularfeld
                  label="Wert"
                  type="number"
                  step="0.01"
                  value={readingForm.reading_value}
                  onChange={(e) => setReadingForm({ ...readingForm, reading_value: e.target.value })}
                  required
                />
                <Formularfeld
                  label="Datum"
                  type="date"
                  value={readingForm.reading_date}
                  onChange={(e) => setReadingForm({ ...readingForm, reading_date: e.target.value })}
                  required
                />
              </div>
              <Formularfeld
                label="Notizen"
                type="textarea"
                value={readingForm.notes}
                onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })}
              />
              <Button type="submit" size="sm">Erfassen</Button>
            </form>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Historie</h3>
            {meterReadings.length > 0 ? (
              <div className="space-y-2">
                {meterReadings.map((reading) => (
                  <div
                    key={reading.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {reading.reading_value} {ausgewaehlterZaehler?.meter_type === "water" ? "m³" : "kWh"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(reading.reading_date).toLocaleDateString("de-DE")}
                        </div>
                        {reading.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {reading.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Noch keine Zählerstände erfasst
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setBearbeiteterSchluessel(null);
          setAusgewaehlterSchluessel(null);
        }}
        titel={
          ausgewaehlterSchluessel && ausgewaehlterSchluessel.status === "available"
            ? "Schlüssel zuweisen"
            : bearbeiteterSchluessel
            ? "Schlüssel bearbeiten"
            : "Neuer Schlüssel"
        }
      >
        {ausgewaehlterSchluessel && ausgewaehlterSchluessel.status === "available" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              assignKeyMutation.mutate({
                keyId: ausgewaehlterSchluessel.id,
                data: {
                  action: "assign",
                  assigned_to_type: keyAssignForm.assigned_to_type,
                  assigned_to_id: keyAssignForm.assigned_to_id,
                  notes: keyAssignForm.notes || null,
                },
              });
              setShowKeyModal(false);
              setAusgewaehlterSchluessel(null);
            }}
            className="space-y-4"
          >
            <Auswahl
              label="Zuweisen an"
              value={keyAssignForm.assigned_to_type}
              onChange={(e) =>
                setKeyAssignForm({ ...keyAssignForm, assigned_to_type: e.target.value })
              }
              optionen={[{ value: "tenant", label: "Mieter" }]}
            />
            <Auswahl
              label="Mieter"
              value={keyAssignForm.assigned_to_id}
              onChange={(e) =>
                setKeyAssignForm({ ...keyAssignForm, assigned_to_id: e.target.value })
              }
              optionen={[
                { value: "", label: "Bitte wählen" },
                ...tenants.map((t) => ({
                  value: t.id,
                  label: `${t.first_name} ${t.last_name}`,
                })),
              ]}
              required
            />
            <Formularfeld
              label="Notizen"
              type="textarea"
              value={keyAssignForm.notes}
              onChange={(e) => setKeyAssignForm({ ...keyAssignForm, notes: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowKeyModal(false);
                  setAusgewaehlterSchluessel(null);
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit">Zuweisen</Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = {
                property_id: id,
                key_type: keyForm.key_type,
                key_number: keyForm.key_number || null,
                description: keyForm.description || null,
                unit_id: keyForm.unit_id || null,
              };
              if (bearbeiteterSchluessel) {
                updateKeyMutation.mutate({ keyId: bearbeiteterSchluessel.id, data });
              } else {
                createKeyMutation.mutate(data);
              }
            }}
            className="space-y-4"
          >
            <Auswahl
              label="Schlüsseltyp"
              value={keyForm.key_type}
              onChange={(e) => setKeyForm({ ...keyForm, key_type: e.target.value })}
              optionen={[
                { value: "apartment", label: "Wohnungsschlüssel" },
                { value: "basement", label: "Kellerschlüssel" },
                { value: "mailbox", label: "Briefkastenschlüssel" },
                { value: "other", label: "Sonstiger Schlüssel" },
              ]}
              required
            />
            <Formularfeld
              label="Schlüsselnummer"
              value={keyForm.key_number}
              onChange={(e) => setKeyForm({ ...keyForm, key_number: e.target.value })}
              placeholder="z.B. 1A, Keller-1"
            />
            <Auswahl
              label="Einheit (optional)"
              value={keyForm.unit_id}
              onChange={(e) => setKeyForm({ ...keyForm, unit_id: e.target.value })}
              optionen={[
                { value: "", label: "Keine Zuordnung" },
                ...einheiten.map((u) => ({ value: u.id, label: u.unit_label })),
              ]}
            />
            <Formularfeld
              label="Beschreibung"
              type="textarea"
              value={keyForm.description}
              onChange={(e) => setKeyForm({ ...keyForm, description: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowKeyModal(false);
                  setBearbeiteterSchluessel(null);
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit">
                {bearbeiteterSchluessel ? "Aktualisieren" : "Erstellen"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Key History Modal */}
      <Modal
        isOpen={showKeyHistoryModal}
        onClose={() => {
          setShowKeyHistoryModal(false);
          setAusgewaehlterSchluessel(null);
        }}
        titel={`Historie - ${ausgewaehlterSchluessel?.key_type || ""} ${ausgewaehlterSchluessel?.key_number || ""}`}
        groesse="lg"
      >
        <div className="space-y-3">
          {keyHistory.length > 0 ? (
            keyHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entry.action === "assign" ? "Zugewiesen" : entry.action === "return" ? "Zurückgegeben" : entry.action}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {entry.assigned_to_name && `an: ${entry.assigned_to_name}`}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Noch keine Historie vorhanden
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

