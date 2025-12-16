import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/propertyApi";
import { unitApi } from "../api/unitApi";
import { meterApi } from "../api/meterApi";
import { keyApi } from "../api/keyApi";
import { tenantApi } from "../api/tenantApi";
import { insuranceApi, propertyBankAccountApi, allocationKeyApi } from "../api/propertyExtendedApi";
import { useApp } from "../contexts/AppContext";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { 
  Gauge, Key as KeyIcon, Plus, Edit, Trash2, Calendar, User, History, TrendingUp,
  FileText, Shield, CreditCard, Calculator, Building2, Thermometer, FileCheck
} from "lucide-react";

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
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [showAllocationKeyModal, setShowAllocationKeyModal] = useState(false);
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
  
  // Lade Versicherungen
  const { data: insurances = [], refetch: refetchInsurances } = useQuery({
    queryKey: ["insurances", id],
    queryFn: async () => {
      const response = await insuranceApi.list(id);
      return response.data || [];
    },
    enabled: !!id,
  });
  
  // Lade Bankkonten
  const { data: bankAccounts = [], refetch: refetchBankAccounts } = useQuery({
    queryKey: ["propertyBankAccounts", id],
    queryFn: async () => {
      const response = await propertyBankAccountApi.list(id);
      return response.data || [];
    },
    enabled: !!id,
  });
  
  // Lade Verteilerschlüssel
  const { data: allocationKeys = [], refetch: refetchAllocationKeys } = useQuery({
    queryKey: ["allocationKeys", id],
    queryFn: async () => {
      const response = await allocationKeyApi.list(id);
      return response.data || [];
    },
    enabled: !!id,
  });

  const [formDaten, setFormDaten] = useState({
    unit_label: "",
    floor: "",
    size_sqm: "",
    status: "vacant",
    // Basisdaten
    location: "",
    unit_number: "",
    // Flächen & Anteile
    living_area_sqm: "",
    mea_numerator: "",
    mea_denominator: "",
    // Nutzungsart
    usage_type: "",
    // Ausstattung
    rooms: "",
    bathroom_type: "",
    has_balcony: false,
    floor_covering: "",
  });

  // Meter Form State
  const [meterForm, setMeterForm] = useState({
    meter_number: "",
    meter_type: "water",
    location: "",
    unit_id: "",
    calibration_due_date: "",
  });

  // Reading Form State
  const [readingForm, setReadingForm] = useState({
    reading_value: "",
    reading_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Key Form State
  const [keyForm, setKeyForm] = useState({
    key_type: "apartment",
    key_number: "",
    description: "",
    unit_id: "",
  });

  // Key Assign Form State
  const [keyAssignForm, setKeyAssignForm] = useState({
    assigned_to_type: "tenant",
    assigned_to_id: "",
    notes: "",
  });

  // Insurance Form State
  const [insuranceForm, setInsuranceForm] = useState({
    insurance_type: "building",
    insurer_name: "",
    policy_number: "",
    coverage_description: "",
    start_date: "",
    end_date: "",
    annual_premium: "",
    notes: "",
  });

  // Bank Account Form State
  const [bankAccountForm, setBankAccountForm] = useState({
    account_type: "rent",
    account_name: "",
    iban: "",
    bank_name: "",
    account_holder: "",
    notes: "",
  });

  // Allocation Key Form State
  const [allocationKeyForm, setAllocationKeyForm] = useState({
    name: "",
    allocation_method: "area",
    default_factor: "1.0",
    is_active: true,
    notes: "",
  });

  // Bearbeitungs-States für neue Entities
  const [bearbeiteteVersicherung, setBearbeiteteVersicherung] = useState(null);
  const [bearbeitetesBankkonto, setBearbeitetesBankkonto] = useState(null);
  const [bearbeiteterVerteilerschluessel, setBearbeiteterVerteilerschluessel] = useState(null);

  // Lade Tenants für Schlüssel-Zuweisung
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await tenantApi.list({});
      return response.data?.items || [];
    },
  });

  useEffect(() => {
    if (id) {
      ladeObjekt();
      ladeEinheiten();
    }
  }, [id]);

  const ladeObjekt = async () => {
    try {
      const response = await propertyApi.get(id);
      const data = response.data;
      console.log("Geladene Objekt-Daten:", data);
      setObjekt(data);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
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
        // Basisdaten
        location: formDaten.location || null,
        unit_number: formDaten.unit_number || null,
        // Flächen & Anteile
        living_area_sqm: formDaten.living_area_sqm ? parseFloat(formDaten.living_area_sqm) : null,
        mea_numerator: formDaten.mea_numerator ? parseInt(formDaten.mea_numerator) : null,
        mea_denominator: formDaten.mea_denominator ? parseInt(formDaten.mea_denominator) : null,
        // Nutzungsart
        usage_type: formDaten.usage_type || null,
        // Ausstattung
        rooms: formDaten.rooms ? parseInt(formDaten.rooms) : null,
        bathroom_type: formDaten.bathroom_type || null,
        has_balcony: formDaten.has_balcony || false,
        floor_covering: formDaten.floor_covering || null,
      };

      if (bearbeitung) {
        await unitApi.update(bearbeitung.id, daten);
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
      // Basisdaten
      location: "",
      unit_number: "",
      // Flächen & Anteile
      living_area_sqm: "",
      mea_numerator: "",
      mea_denominator: "",
      // Nutzungsart
      usage_type: "",
      // Ausstattung
      rooms: "",
      bathroom_type: "",
      has_balcony: false,
      floor_covering: "",
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
                // Basisdaten
                location: zeile.location || "",
                unit_number: zeile.unit_number || "",
                // Flächen & Anteile
                living_area_sqm: zeile.living_area_sqm || "",
                mea_numerator: zeile.mea_numerator || "",
                mea_denominator: zeile.mea_denominator || "",
                // Nutzungsart
                usage_type: zeile.usage_type || "",
                // Ausstattung
                rooms: zeile.rooms || "",
                bathroom_type: zeile.bathroom_type || "",
                has_balcony: zeile.has_balcony || false,
                floor_covering: zeile.floor_covering || "",
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
        onClick={() => navigate("/verwaltung")}
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
            { id: "stammdaten", label: "Stammdaten", icon: FileText },
            { id: "technische-daten", label: "Technische Daten", icon: Thermometer },
            { id: "versicherungen", label: "Versicherungen", count: insurances.length, icon: Shield },
            { id: "bankkonten", label: "Bankkonten", count: bankAccounts.length, icon: CreditCard },
            { id: "verteilerschluessel", label: "Verteilerschlüssel", count: allocationKeys.length, icon: Calculator },
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
                setBearbeiteterZaehler(null);
                setMeterForm({
                  meter_number: "",
                  meter_type: "water",
                  location: "",
                  unit_id: "",
                  calibration_due_date: "",
                });
                setShowMeterModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
              icon={<Plus className="w-4 h-4" />}
            >
              Neuer Zähler
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

      {/* Stammdaten Tab */}
      {activeTab === "stammdaten" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Erweiterte Stammdaten</h2>
            <p className="text-sm text-gray-600">
              Diese Daten werden für <strong>Grundsteuer-Abrechnungen</strong>, <strong>Steuerberater</strong> und <strong>Katasterdaten</strong> benötigt. 
              Sie werden in Berichten und Exporten verwendet.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              💡 <strong>Praktischer Nutzen:</strong> Einheitswert-Aktenzeichen für Grundsteuer-Erklärung, 
              Katasterdaten für Steuerberater-Export, rechtliche Dokumentation bei Objektverkauf/Erbschaft.
            </div>
          </div>
          {!objekt && (
            <div className="text-center py-8 text-gray-500">
              Lade Objekt-Daten...
            </div>
          )}
          {objekt && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const updateData = {
                unit_value_file_number: objekt?.unit_value_file_number || null,
                cadastral_district: objekt?.cadastral_district || null,
                cadastral_parcel: objekt?.cadastral_parcel || null,
              };
              // Entferne leere Strings
              Object.keys(updateData).forEach(key => {
                if (updateData[key] === "" || updateData[key] === null) {
                  updateData[key] = null;
                }
              });
              const response = await propertyApi.update(id, updateData);
              // Prüfe, ob die Daten tatsächlich zurückgegeben werden
              const savedData = response.data;
              console.log("Gespeicherte Daten:", savedData);
              const hasData = savedData?.unit_value_file_number || savedData?.cadastral_district || savedData?.cadastral_parcel;
              
              if (!hasData && (updateData.unit_value_file_number || updateData.cadastral_district || updateData.cadastral_parcel)) {
                // Daten wurden nicht gespeichert - Migration fehlt
                zeigeBenachrichtigung("⚠️ Datenbank-Migration erforderlich! Die Daten konnten nicht gespeichert werden. Bitte führen Sie zuerst die Migration durch.", "fehler");
              } else {
                // Aktualisiere den State direkt mit den zurückgegebenen Daten
                if (savedData) {
                  setObjekt(prev => ({ ...prev, ...savedData }));
                }
                zeigeBenachrichtigung("Stammdaten erfolgreich aktualisiert");
                // Lade auch nochmal neu, um sicherzustellen, dass alles synchron ist
                setTimeout(() => {
                  ladeObjekt();
                }, 300);
              }
            } catch (error) {
              console.error("Fehler beim Speichern:", error);
              if (error.response?.status === 422) {
                zeigeBenachrichtigung("⚠️ Diese Felder sind noch nicht verfügbar. Bitte führen Sie zuerst die Datenbank-Migration durch.", "fehler");
              } else {
                zeigeBenachrichtigung("Fehler beim Speichern: " + (error.response?.data?.detail || error.message), "fehler");
              }
            }
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Formularfeld
                label="Einheitswert-Aktenzeichen"
                value={objekt?.unit_value_file_number ?? ""}
                onChange={(e) => setObjekt({ ...objekt, unit_value_file_number: e.target.value })}
                placeholder="z.B. EW-12345/2023"
              />
              <Formularfeld
                label="Flur"
                value={objekt?.cadastral_district ?? ""}
                onChange={(e) => setObjekt({ ...objekt, cadastral_district: e.target.value })}
                placeholder="z.B. 123"
              />
              <Formularfeld
                label="Flurstück"
                value={objekt?.cadastral_parcel ?? ""}
                onChange={(e) => setObjekt({ ...objekt, cadastral_parcel: e.target.value })}
                placeholder="z.B. 456/78"
              />
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit">Speichern</Button>
            </div>
          </form>
          )}
        </div>
      )}

      {/* Technische Daten Tab */}
      {activeTab === "technische-daten" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Technische Daten</h2>
            <p className="text-sm text-gray-600">
              Diese Daten sind wichtig für <strong>GEG-Compliance</strong> (Gebäudeenergiegesetz), <strong>Energieausweis-Verwaltung</strong>, 
              <strong>Heizkosten-Abrechnungen</strong> und <strong>Energieberichte</strong>. Sie werden automatisch in Abrechnungen und Berichten verwendet.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              💡 <strong>Praktischer Nutzen:</strong> Heizungsart bestimmt Abrechnungsmethode, Energieausweis-Daten für Vermietung/Verkauf, 
              Gesamtflächen für Betriebskosten-Umlage, Energieklasse für Portfolio-Analyse und Sanierungsplanung.
            </div>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const updateData = {
                heating_type: objekt?.heating_type || null,
                energy_certificate_valid_until: objekt?.energy_certificate_valid_until || null,
                energy_rating_value: objekt?.energy_rating_value || null,
                energy_rating_class: objekt?.energy_rating_class || null,
                total_residential_area: objekt?.total_residential_area || null,
                total_commercial_area: objekt?.total_commercial_area || null,
              };
              // Entferne leere Strings und konvertiere Zahlen
              Object.keys(updateData).forEach(key => {
                if (updateData[key] === "" || updateData[key] === null) {
                  updateData[key] = null;
                } else if (key === "energy_rating_value" && updateData[key]) {
                  updateData[key] = parseFloat(updateData[key]);
                } else if ((key === "total_residential_area" || key === "total_commercial_area") && updateData[key]) {
                  updateData[key] = parseInt(updateData[key]);
                }
              });
              const response = await propertyApi.update(id, updateData);
              // Prüfe, ob die Daten tatsächlich zurückgegeben werden
              const savedData = response.data;
              console.log("Gespeicherte Daten:", savedData);
              const hasData = savedData?.heating_type || savedData?.energy_rating_value || savedData?.total_residential_area;
              
              if (!hasData && (updateData.heating_type || updateData.energy_rating_value || updateData.total_residential_area)) {
                // Daten wurden nicht gespeichert - Migration fehlt
                zeigeBenachrichtigung("⚠️ Datenbank-Migration erforderlich! Die Daten konnten nicht gespeichert werden. Bitte führen Sie zuerst die Migration durch.", "fehler");
              } else {
                // Aktualisiere den State direkt mit den zurückgegebenen Daten
                if (savedData) {
                  setObjekt(prev => ({ ...prev, ...savedData }));
                }
                zeigeBenachrichtigung("✅ Technische Daten erfolgreich gespeichert! Die Daten werden in Abrechnungen, Energieberichten und für GEG-Compliance verwendet.", "erfolg");
                // Lade auch nochmal neu, um sicherzustellen, dass alles synchron ist
                setTimeout(() => {
                  ladeObjekt();
                }, 300);
              }
            } catch (error) {
              console.error("Fehler beim Speichern:", error);
              if (error.response?.status === 422) {
                zeigeBenachrichtigung("⚠️ Diese Felder sind noch nicht verfügbar. Bitte führen Sie zuerst die Datenbank-Migration durch.", "fehler");
              } else {
                zeigeBenachrichtigung("Fehler beim Speichern: " + (error.response?.data?.detail || error.message), "fehler");
              }
            }
          }}>
            <div className="space-y-4">
              <div>
                <Auswahl
                  label="Heizungsart"
                  value={objekt?.heating_type || ""}
                  onChange={(e) => {
                    const newHeatingType = e.target.value;
                    // Warnung anzeigen, wenn Heizungsart geändert wird und bereits Daten vorhanden sind
                    if (objekt?.heating_type && objekt.heating_type !== newHeatingType && 
                        (objekt.energy_rating_value || objekt.energy_rating_class || objekt.total_residential_area)) {
                      const oldType = objekt.heating_type === "gas" ? "Gas" : 
                                     objekt.heating_type === "oil" ? "Öl" : 
                                     objekt.heating_type === "electric" ? "Strom" : 
                                     objekt.heating_type === "heat_pump" ? "Wärmepumpe" : 
                                     objekt.heating_type === "district_heating" ? "Fernwärme" : 
                                     objekt.heating_type === "pellets" ? "Pellets" : "Sonstige";
                      if (window.confirm(`⚠️ Achtung: Sie ändern die Heizungsart von "${oldType}" zu einer anderen.\n\nDie aktuellen technischen Daten (Energiekennwert, Energieklasse, Flächen) werden überschrieben, wenn Sie speichern.\n\nMöchten Sie fortfahren?`)) {
                        setObjekt({ ...objekt, heating_type: newHeatingType });
                      }
                    } else {
                      setObjekt({ ...objekt, heating_type: newHeatingType });
                    }
                  }}
                  optionen={[
                    { value: "", label: "Bitte wählen" },
                    { value: "gas", label: "Gas" },
                    { value: "oil", label: "Öl" },
                    { value: "electric", label: "Strom" },
                    { value: "heat_pump", label: "Wärmepumpe" },
                    { value: "district_heating", label: "Fernwärme" },
                    { value: "pellets", label: "Pellets" },
                    { value: "other", label: "Sonstige" },
                  ]}
                />
                {objekt?.heating_type && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ <strong>Hinweis:</strong> Ein Objekt kann nur einen Satz technischer Daten haben. 
                    Wenn Sie die Heizungsart ändern, werden die aktuellen Werte überschrieben. 
                    Die alten Werte werden nicht mehr angezeigt, bleiben aber in der Datenbank gespeichert.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Formularfeld
                  label="Energieausweis gültig bis"
                  type="date"
                  value={objekt?.energy_certificate_valid_until ? (typeof objekt.energy_certificate_valid_until === 'string' ? objekt.energy_certificate_valid_until.split('T')[0] : new Date(objekt.energy_certificate_valid_until).toISOString().split("T")[0]) : ""}
                  onChange={(e) => setObjekt({ ...objekt, energy_certificate_valid_until: e.target.value || null })}
                />
                <Formularfeld
                  label="Energiekennwert (kWh/m²a)"
                  type="number"
                  step="0.01"
                  value={objekt?.energy_rating_value ?? ""}
                  onChange={(e) => setObjekt({ ...objekt, energy_rating_value: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="z.B. 120"
                />
              </div>
              <Formularfeld
                label="Energieklasse"
                value={objekt?.energy_rating_class ?? ""}
                onChange={(e) => setObjekt({ ...objekt, energy_rating_class: e.target.value || null })}
                placeholder="z.B. A+, A, B, C"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Formularfeld
                  label="Wohnfläche (m²)"
                  type="number"
                  value={objekt?.total_residential_area ?? ""}
                  onChange={(e) => setObjekt({ ...objekt, total_residential_area: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="z.B. 500"
                />
                <Formularfeld
                  label="Gewerbefläche (m²)"
                  type="number"
                  value={objekt?.total_commercial_area ?? ""}
                  onChange={(e) => setObjekt({ ...objekt, total_commercial_area: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="z.B. 200"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        </div>
      )}

      {/* Versicherungen Tab */}
      {activeTab === "versicherungen" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Versicherungen</h2>
            <Button
              onClick={() => {
                setBearbeiteteVersicherung(null);
                setInsuranceForm({
                  insurance_type: "building",
                  insurer_name: "",
                  policy_number: "",
                  coverage_description: "",
                  start_date: "",
                  end_date: "",
                  annual_premium: "",
                  notes: "",
                });
                setShowInsuranceModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
              icon={<Plus className="w-4 h-4" />}
            >
              Neue Versicherung
            </Button>
          </div>
          {insurances.length > 0 ? (
            <div className="space-y-3">
              {insurances.map((insurance) => (
                <div
                  key={insurance.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {insurance.insurance_type === "building" ? "Gebäudeversicherung" : insurance.insurance_type === "liability" ? "Haftpflichtversicherung" : "Sonstige"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insurance.insurer_name}
                        {insurance.policy_number && ` - Police: ${insurance.policy_number}`}
                      </div>
                      {insurance.coverage_description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {insurance.coverage_description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setBearbeiteteVersicherung(insurance);
                          setInsuranceForm({
                            insurance_type: insurance.insurance_type,
                            insurer_name: insurance.insurer_name || "",
                            policy_number: insurance.policy_number || "",
                            coverage_description: insurance.coverage_description || "",
                            start_date: insurance.start_date || "",
                            end_date: insurance.end_date || "",
                            annual_premium: insurance.annual_premium || "",
                            notes: insurance.notes || "",
                          });
                          setShowInsuranceModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Versicherung wirklich löschen?")) {
                            try {
                              await insuranceApi.delete(insurance.id);
                              refetchInsurances();
                              zeigeBenachrichtigung("Versicherung gelöscht");
                            } catch (error) {
                              zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
              Keine Versicherungen vorhanden
            </div>
          )}
        </div>
      )}

      {/* Bankkonten Tab */}
      {activeTab === "bankkonten" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Bankkonten</h2>
            <Button
              onClick={() => {
                setBearbeitetesBankkonto(null);
                setBankAccountForm({
                  account_type: "rent",
                  account_name: "",
                  iban: "",
                  bank_name: "",
                  account_holder: "",
                  notes: "",
                });
                setShowBankAccountModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
              icon={<Plus className="w-4 h-4" />}
            >
              Neues Bankkonto
            </Button>
          </div>
          {bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {account.account_type === "rent" ? "Mietkonto" : account.account_type === "reserves" ? "Rücklagenkonto" : account.account_type === "deposit" ? "Kautionskonto" : "Sonstiges"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {account.account_name}
                        {account.iban && ` - IBAN: ${account.iban}`}
                      </div>
                      {account.bank_name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {account.bank_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setBearbeitetesBankkonto(account);
                          setBankAccountForm({
                            account_type: account.account_type,
                            account_name: account.account_name || "",
                            iban: account.iban || "",
                            bank_name: account.bank_name || "",
                            account_holder: account.account_holder || "",
                            notes: account.notes || "",
                          });
                          setShowBankAccountModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Bankkonto wirklich löschen?")) {
                            try {
                              await propertyBankAccountApi.delete(account.id);
                              refetchBankAccounts();
                              zeigeBenachrichtigung("Bankkonto gelöscht");
                            } catch (error) {
                              zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
              Keine Bankkonten vorhanden
            </div>
          )}
        </div>
      )}

      {/* Verteilerschlüssel Tab */}
      {activeTab === "verteilerschluessel" && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Verteilerschlüssel</h2>
            <Button
              onClick={() => {
                setBearbeiteterVerteilerschluessel(null);
                setAllocationKeyForm({
                  name: "",
                  allocation_method: "area",
                  default_factor: "1.0",
                  is_active: true,
                  notes: "",
                });
                setShowAllocationKeyModal(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
              icon={<Plus className="w-4 h-4" />}
            >
              Neuer Verteilerschlüssel
            </Button>
          </div>
          {allocationKeys.length > 0 ? (
            <div className="space-y-3">
              {allocationKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {key.name}
                        {key.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">Aktiv</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">Inaktiv</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {key.allocation_method === "area" ? "Nach m²" : key.allocation_method === "units" ? "Nach Wohneinheiten" : key.allocation_method === "persons" ? "Nach Personen" : key.allocation_method === "consumption" ? "Nach Verbrauch" : "Individuell"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setBearbeiteterVerteilerschluessel(key);
                          setAllocationKeyForm({
                            name: key.name || "",
                            allocation_method: key.allocation_method,
                            default_factor: key.default_factor?.toString() || "1.0",
                            is_active: key.is_active,
                            notes: key.notes || "",
                          });
                          setShowAllocationKeyModal(true);
                        }}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Verteilerschlüssel wirklich löschen?")) {
                            try {
                              await allocationKeyApi.delete(key.id);
                              refetchAllocationKeys();
                              zeigeBenachrichtigung("Verteilerschlüssel gelöscht");
                            } catch (error) {
                              zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
              Keine Verteilerschlüssel vorhanden
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
          {/* Basisdaten */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basisdaten</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Formularfeld
                label="Lage"
                name="location"
                value={formDaten.location}
                onChange={(e) => setFormDaten({ ...formDaten, location: e.target.value })}
                placeholder="z.B. EG links, 1. OG"
              />
              <Formularfeld
                label="Einheitsnummer"
                name="unit_number"
                value={formDaten.unit_number}
                onChange={(e) => setFormDaten({ ...formDaten, unit_number: e.target.value })}
                placeholder="z.B. 001"
              />
            </div>
          </div>

          {/* Flächen & Anteile */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Flächen & Anteile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Formularfeld
                label="Etage"
                name="floor"
                type="number"
                value={formDaten.floor}
                onChange={(e) => setFormDaten({ ...formDaten, floor: e.target.value })}
                placeholder="z.B. 2"
              />
              <Formularfeld
                label="Gesamtfläche (m²)"
                name="size_sqm"
                type="number"
                value={formDaten.size_sqm}
                onChange={(e) => setFormDaten({ ...formDaten, size_sqm: e.target.value })}
                placeholder="z.B. 65"
              />
              <Formularfeld
                label="Wohnfläche (m²) - DIN 277/WoFlV"
                name="living_area_sqm"
                type="number"
                step="0.01"
                value={formDaten.living_area_sqm}
                onChange={(e) => setFormDaten({ ...formDaten, living_area_sqm: e.target.value })}
                placeholder="z.B. 60.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <Formularfeld
                  label="MEA Zähler"
                  name="mea_numerator"
                  type="number"
                  value={formDaten.mea_numerator}
                  onChange={(e) => setFormDaten({ ...formDaten, mea_numerator: e.target.value })}
                  placeholder="z.B. 125"
                />
                <Formularfeld
                  label="MEA Nenner"
                  name="mea_denominator"
                  type="number"
                  value={formDaten.mea_denominator}
                  onChange={(e) => setFormDaten({ ...formDaten, mea_denominator: e.target.value })}
                  placeholder="z.B. 1000"
                />
              </div>
            </div>
            {formDaten.mea_numerator && formDaten.mea_denominator && (
              <p className="text-xs text-gray-500 mt-1">
                MEA: {formDaten.mea_numerator}/{formDaten.mea_denominator} = {((parseInt(formDaten.mea_numerator) / parseInt(formDaten.mea_denominator)) * 100).toFixed(2)}%
              </p>
            )}
          </div>

          {/* Nutzungsart */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nutzungsart</h3>
            <Auswahl
              label="Nutzungsart"
              name="usage_type"
              value={formDaten.usage_type}
              onChange={(e) => setFormDaten({ ...formDaten, usage_type: e.target.value })}
              optionen={[
                { value: "", label: "Bitte wählen" },
                { value: "residential", label: "Wohnen" },
                { value: "commercial", label: "Gewerbe" },
                { value: "parking", label: "Stellplatz/Garage" },
                { value: "basement", label: "Kellerraum" },
                { value: "other", label: "Sonstige" },
              ]}
            />
          </div>

          {/* Ausstattung */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ausstattung</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Formularfeld
                label="Anzahl Zimmer"
                name="rooms"
                type="number"
                value={formDaten.rooms}
                onChange={(e) => setFormDaten({ ...formDaten, rooms: e.target.value })}
                placeholder="z.B. 3"
              />
              <Auswahl
                label="Bad"
                name="bathroom_type"
                value={formDaten.bathroom_type}
                onChange={(e) => setFormDaten({ ...formDaten, bathroom_type: e.target.value })}
                optionen={[
                  { value: "", label: "Bitte wählen" },
                  { value: "bath", label: "Wanne" },
                  { value: "shower", label: "Dusche" },
                  { value: "both", label: "Wanne und Dusche" },
                  { value: "none", label: "Kein Bad" },
                ]}
              />
              <Formularfeld
                label="Bodenbelag"
                name="floor_covering"
                value={formDaten.floor_covering}
                onChange={(e) => setFormDaten({ ...formDaten, floor_covering: e.target.value })}
                placeholder="z.B. Parkett, Laminat, Fliesen"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_balcony"
                  checked={formDaten.has_balcony}
                  onChange={(e) => setFormDaten({ ...formDaten, has_balcony: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="has_balcony" className="text-sm text-gray-700">
                  Balkon vorhanden
                </label>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-gray-200 pt-4 mt-4">
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
            />
          </div>
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

      {/* Versicherung Modal */}
      <Modal
        isOpen={showInsuranceModal}
        onClose={() => {
          setShowInsuranceModal(false);
          setBearbeiteteVersicherung(null);
        }}
        titel={bearbeiteteVersicherung ? "Versicherung bearbeiten" : "Neue Versicherung"}
        groesse="lg"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            // Konvertiere leere Strings zu null für optionale Felder
            const formData = {
              insurance_type: insuranceForm.insurance_type,
              insurer_name: insuranceForm.insurer_name.trim(),
              policy_number: insuranceForm.policy_number?.trim() || null,
              coverage_description: insuranceForm.coverage_description?.trim() || null,
              start_date: insuranceForm.start_date || null,
              end_date: insuranceForm.end_date || null,
              annual_premium: insuranceForm.annual_premium?.trim() || null,
              notes: insuranceForm.notes?.trim() || null,
            };
            
            if (bearbeiteteVersicherung) {
              await insuranceApi.update(bearbeiteteVersicherung.id, formData);
              zeigeBenachrichtigung("Versicherung aktualisiert");
            } else {
              await insuranceApi.create(id, formData);
              zeigeBenachrichtigung("Versicherung erstellt");
            }
            setShowInsuranceModal(false);
            refetchInsurances();
          } catch (error) {
            console.error("Fehler beim Speichern:", error);
            const errorMessage = error.response?.data?.detail || "Fehler beim Speichern";
            zeigeBenachrichtigung(errorMessage, "fehler");
          }
        }}>
          <Auswahl
            label="Versicherungstyp"
            value={insuranceForm.insurance_type}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, insurance_type: e.target.value })}
            optionen={[
              { value: "building", label: "Gebäudeversicherung" },
              { value: "liability", label: "Haftpflichtversicherung" },
              { value: "other", label: "Sonstige" },
            ]}
            required
          />
          <Formularfeld
            label="Versicherer"
            value={insuranceForm.insurer_name}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, insurer_name: e.target.value })}
            required
          />
          <Formularfeld
            label="Police-Nr."
            value={insuranceForm.policy_number}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, policy_number: e.target.value })}
          />
          <Formularfeld
            label="Abdeckung"
            type="textarea"
            value={insuranceForm.coverage_description}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, coverage_description: e.target.value })}
            placeholder="Was ist abgedeckt?"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Formularfeld
              label="Startdatum"
              type="date"
              value={insuranceForm.start_date}
              onChange={(e) => setInsuranceForm({ ...insuranceForm, start_date: e.target.value })}
            />
            <Formularfeld
              label="Enddatum"
              type="date"
              value={insuranceForm.end_date}
              onChange={(e) => setInsuranceForm({ ...insuranceForm, end_date: e.target.value })}
            />
          </div>
          <Formularfeld
            label="Jahresprämie"
            value={insuranceForm.annual_premium}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, annual_premium: e.target.value })}
            placeholder="z.B. 1.200,00 €"
          />
          <Formularfeld
            label="Notizen"
            type="textarea"
            value={insuranceForm.notes}
            onChange={(e) => setInsuranceForm({ ...insuranceForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowInsuranceModal(false);
                setBearbeiteteVersicherung(null);
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              {bearbeiteteVersicherung ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bankkonto Modal */}
      <Modal
        isOpen={showBankAccountModal}
        onClose={() => {
          setShowBankAccountModal(false);
          setBearbeitetesBankkonto(null);
        }}
        titel={bearbeitetesBankkonto ? "Bankkonto bearbeiten" : "Neues Bankkonto"}
        groesse="lg"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (bearbeitetesBankkonto) {
              await propertyBankAccountApi.update(bearbeitetesBankkonto.id, bankAccountForm);
              zeigeBenachrichtigung("Bankkonto aktualisiert");
            } else {
              await propertyBankAccountApi.create(id, bankAccountForm);
              zeigeBenachrichtigung("Bankkonto erstellt");
            }
            setShowBankAccountModal(false);
            refetchBankAccounts();
          } catch (error) {
            zeigeBenachrichtigung("Fehler beim Speichern", "fehler");
          }
        }}>
          <Auswahl
            label="Kontotyp"
            value={bankAccountForm.account_type}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_type: e.target.value })}
            optionen={[
              { value: "rent", label: "Mietkonto" },
              { value: "reserves", label: "Rücklagenkonto" },
              { value: "deposit", label: "Kautionskonto" },
              { value: "other", label: "Sonstiges" },
            ]}
            required
          />
          <Formularfeld
            label="Kontoname"
            value={bankAccountForm.account_name}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_name: e.target.value })}
            required
          />
          <Formularfeld
            label="IBAN"
            value={bankAccountForm.iban}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, iban: e.target.value })}
            placeholder="DE89 3704 0044 0532 0130 00"
          />
          <Formularfeld
            label="Bankname"
            value={bankAccountForm.bank_name}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })}
          />
          <Formularfeld
            label="Kontoinhaber"
            value={bankAccountForm.account_holder}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_holder: e.target.value })}
          />
          <Formularfeld
            label="Notizen"
            type="textarea"
            value={bankAccountForm.notes}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowBankAccountModal(false);
                setBearbeitetesBankkonto(null);
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              {bearbeitetesBankkonto ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verteilerschlüssel Modal */}
      <Modal
        isOpen={showAllocationKeyModal}
        onClose={() => {
          setShowAllocationKeyModal(false);
          setBearbeiteterVerteilerschluessel(null);
        }}
        titel={bearbeiteterVerteilerschluessel ? "Verteilerschlüssel bearbeiten" : "Neuer Verteilerschlüssel"}
        groesse="lg"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const data = {
              ...allocationKeyForm,
              default_factor: allocationKeyForm.default_factor ? parseFloat(allocationKeyForm.default_factor) : 1.0,
            };
            if (bearbeiteterVerteilerschluessel) {
              await allocationKeyApi.update(bearbeiteterVerteilerschluessel.id, data);
              zeigeBenachrichtigung("Verteilerschlüssel aktualisiert");
            } else {
              await allocationKeyApi.create(id, data);
              zeigeBenachrichtigung("Verteilerschlüssel erstellt");
            }
            setShowAllocationKeyModal(false);
            refetchAllocationKeys();
          } catch (error) {
            zeigeBenachrichtigung("Fehler beim Speichern", "fehler");
          }
        }}>
          <Formularfeld
            label="Name"
            value={allocationKeyForm.name}
            onChange={(e) => setAllocationKeyForm({ ...allocationKeyForm, name: e.target.value })}
            placeholder="z.B. Heizung, Wasser, Hausmeister"
            required
          />
          <Auswahl
            label="Verteilungsmethode"
            value={allocationKeyForm.allocation_method}
            onChange={(e) => setAllocationKeyForm({ ...allocationKeyForm, allocation_method: e.target.value })}
            optionen={[
              { value: "area", label: "Nach m²" },
              { value: "units", label: "Nach Wohneinheiten" },
              { value: "persons", label: "Nach Personen" },
              { value: "consumption", label: "Nach Verbrauch" },
              { value: "custom", label: "Individuell" },
            ]}
            required
          />
          {allocationKeyForm.allocation_method !== "custom" && (
            <Formularfeld
              label="Standard-Faktor"
              type="number"
              step="0.0001"
              value={allocationKeyForm.default_factor}
              onChange={(e) => setAllocationKeyForm({ ...allocationKeyForm, default_factor: e.target.value })}
              placeholder="1.0"
            />
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={allocationKeyForm.is_active}
              onChange={(e) => setAllocationKeyForm({ ...allocationKeyForm, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
              Aktiv
            </label>
          </div>
          <Formularfeld
            label="Notizen"
            type="textarea"
            value={allocationKeyForm.notes}
            onChange={(e) => setAllocationKeyForm({ ...allocationKeyForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAllocationKeyModal(false);
                setBearbeiteterVerteilerschluessel(null);
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              {bearbeiteterVerteilerschluessel ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

