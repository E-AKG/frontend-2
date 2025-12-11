import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/propertyApi";
import { unitApi } from "../api/unitApi";
import { meterApi } from "../api/meterApi";
import { keyApi } from "../api/keyApi";
import { useApp } from "../contexts/AppContext";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { Gauge, Key as KeyIcon } from "lucide-react";

export default function ObjektDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedClient } = useApp();
  const [objekt, setObjekt] = useState(null);
  const [einheiten, setEinheiten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("units");
  const [showModal, setShowModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
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
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {meter.meter_number} - {meter.meter_type}
                      </div>
                      {meter.location && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {meter.location}
                        </div>
                      )}
                      {meter.calibration_due_date && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Eichfrist: {new Date(meter.calibration_due_date).toLocaleDateString("de-DE")}
                        </div>
                      )}
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
                // TODO: Modal für neuen Schlüssel
                alert("Schlüssel-Verwaltung wird implementiert");
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              + Neuer Schlüssel
            </Button>
          </div>
          {keys.length > 0 ? (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {key.key_type} {key.key_number && `- ${key.key_number}`}
                      </div>
                      {key.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {key.description}
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
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            an: {key.assigned_to_name}
                          </span>
                        )}
                      </div>
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
    </div>
  );
}

