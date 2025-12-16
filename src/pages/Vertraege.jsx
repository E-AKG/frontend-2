import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { leaseApi } from "../api/leaseApi";
import { unitApi } from "../api/unitApi";
import { tenantApi } from "../api/tenantApi";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  DoorOpen, 
  Euro,
  Settings,
  Layers,
  Trash2,
  Edit,
  TrendingUp,
  Calculator,
  X,
  AlertCircle,
  Clock
} from "lucide-react";

export default function Vertraege() {
  const { selectedClient, selectedFiscalYear } = useApp();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [showKomponentenModal, setShowKomponentenModal] = useState(false);
  const [ausgewaehlterVertrag, setAusgewaehlterVertrag] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  const [formDaten, setFormDaten] = useState({
    unit_id: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
    status: "pending",
    due_day: "1",
    // Mietkomponenten - alle auf einmal
    components: {
      cold_rent: { amount: "", description: "Kaltmiete" },
      operating_costs: { amount: "", description: "Nebenkosten" },
      heating_costs: { amount: "", description: "Heizkosten" },
      other: [], // Array für mehrere "Sonstiges"-Einträge
    },
  });

  const [komponentenForm, setKomponentenForm] = useState({
    type: "cold_rent",
    amount: "",
    description: "",
    adjustment_type: "fixed",
    staggered_schedule: [],
    index_type: "",
    index_base_value: "",
    index_base_date: "",
    index_adjustment_date: "",
    index_adjustment_percentage: "",
    allocation_key: "",
    allocation_factor: "",
    allocation_notes: "",
  });
  const [showStaggeredForm, setShowStaggeredForm] = useState(false);
  const [staggeredEntry, setStaggeredEntry] = useState({ date: "", amount: "" });

  // React Query: Fetch Leases
  const { data: vertraege = [], isLoading: loading } = useQuery({
    queryKey: ['leases', selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      const response = await leaseApi.list({ 
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id
      });
      return response.data.items;
    },
    enabled: !!selectedClient,
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Verträge", "fehler");
    },
  });

  // React Query: Fetch Units
  const { data: einheiten = [] } = useQuery({
    queryKey: ['units', selectedClient?.id],
    queryFn: async () => {
      const response = await unitApi.list({ page_size: 100, client_id: selectedClient?.id });
      return response.data.items;
    },
    enabled: !!selectedClient,
  });

  // React Query: Fetch Tenants
  const { data: mieter = [] } = useQuery({
    queryKey: ['tenants', selectedClient?.id],
    queryFn: async () => {
      const response = await tenantApi.list({ page_size: 100, client_id: selectedClient?.id });
      return response.data.items;
    },
    enabled: !!selectedClient,
  });

  // React Query: Fetch Lease Components
  const { data: komponenten = [] } = useQuery({
    queryKey: ['leaseComponents', ausgewaehlterVertrag?.id],
    queryFn: async () => {
      if (!ausgewaehlterVertrag?.id) return [];
      const response = await leaseApi.getComponents(ausgewaehlterVertrag.id);
      return response.data;
    },
    enabled: !!ausgewaehlterVertrag?.id,
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Komponenten", "fehler");
    },
  });

  // Helper function to invalidate Sollstellungen
  const invalidateSollstellungen = () => {
    queryClient.invalidateQueries({ queryKey: ['billRuns'] });
    queryClient.invalidateQueries({ queryKey: ['charges'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  // Mutations
  const createLeaseMutation = useMutation({
    mutationFn: async (daten) => {
      if (!selectedClient) {
        throw new Error("Bitte wählen Sie zuerst einen Mandanten aus");
      }
      
      // Erstelle zuerst den Vertrag
      const payload = {
        unit_id: daten.unit_id,
        tenant_id: daten.tenant_id,
        start_date: daten.start_date,
        end_date: daten.end_date || null,
        status: daten.status,
        due_day: parseInt(daten.due_day),
      };
      
      const leaseResponse = await leaseApi.create(
        payload, 
        selectedClient.id, 
        selectedFiscalYear?.id
      );
      const leaseId = leaseResponse.data.id;
      
      // Erstelle dann alle Komponenten
      const components = daten.components || {};
      const componentPromises = [];
      
      // Standard-Komponenten (cold_rent, operating_costs, heating_costs)
      for (const [type, component] of Object.entries(components)) {
        if (type === 'other') continue; // Wird separat behandelt
        
        if (component.amount && parseFloat(component.amount) > 0) {
          componentPromises.push(
            leaseApi.createComponent(leaseId, {
              type: type,
              amount: parseFloat(component.amount),
              description: component.description || "",
            })
          );
        }
      }
      
      // "Sonstiges"-Komponenten (Array)
      if (components.other && Array.isArray(components.other)) {
        for (const otherItem of components.other) {
          if (otherItem.amount && parseFloat(otherItem.amount) > 0) {
            componentPromises.push(
              leaseApi.createComponent(leaseId, {
                type: "other",
                amount: parseFloat(otherItem.amount),
                description: otherItem.description || "",
              })
            );
          }
        }
      }
      
      // Warte auf alle Komponenten
      if (componentPromises.length > 0) {
        await Promise.all(componentPromises);
      }
      
      return leaseResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['leaseComponents'] });
      invalidateSollstellungen();
      zeigeBenachrichtigung("Vertrag mit allen Komponenten erfolgreich erstellt");
      setShowModal(false);
      formZuruecksetzen();
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Speichern",
        "fehler"
      );
    }
  });

  const deleteLeaseMutation = useMutation({
    mutationFn: async (leaseId) => {
      return await leaseApi.remove(leaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      invalidateSollstellungen();
      zeigeBenachrichtigung("Vertrag erfolgreich gelöscht");
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Löschen des Vertrags",
        "fehler"
      );
    }
  });

  const addComponentMutation = useMutation({
    mutationFn: async ({ leaseId, componentData }) => {
      const payload = {
        ...componentData,
        amount: parseFloat(componentData.amount),
      };
      
      // Bereinige leere Felder
      if (!payload.staggered_schedule || payload.staggered_schedule.length === 0) {
        delete payload.staggered_schedule;
      }
      if (!payload.index_type) delete payload.index_type;
      if (!payload.index_base_value) delete payload.index_base_value;
      if (!payload.index_base_date) delete payload.index_base_date;
      if (!payload.index_adjustment_date) delete payload.index_adjustment_date;
      if (!payload.index_adjustment_percentage) delete payload.index_adjustment_percentage;
      if (!payload.allocation_key) delete payload.allocation_key;
      if (!payload.allocation_factor) delete payload.allocation_factor;
      if (!payload.allocation_notes) delete payload.allocation_notes;
      
      return await leaseApi.createComponent(leaseId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaseComponents'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      invalidateSollstellungen();
      zeigeBenachrichtigung("Komponente erfolgreich hinzugefügt");
      setKomponentenForm({ type: "cold_rent", amount: "", description: "" });
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Hinzufügen der Komponente", "fehler");
    }
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (componentId) => {
      return await leaseApi.removeComponent(componentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaseComponents'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      invalidateSollstellungen();
      zeigeBenachrichtigung("Komponente erfolgreich gelöscht");
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createLeaseMutation.mutate(formDaten);
  };

  const handleKomponenteHinzufuegen = (e) => {
    e.preventDefault();
    addComponentMutation.mutate({
      leaseId: ausgewaehlterVertrag.id,
      componentData: komponentenForm
    });
  };

  const handleKomponenteLoeschen = (komponenteId) => {
    if (!window.confirm("Komponente wirklich löschen?")) return;
    deleteComponentMutation.mutate(komponenteId);
  };

  const handleVertragLoeschen = (vertrag) => {
    if (!window.confirm(`Möchten Sie den Vertrag für ${getMieterName(vertrag.tenant_id)} wirklich löschen?`)) {
      return;
    }
    deleteLeaseMutation.mutate(vertrag.id);
  };

  const handleKomponentenAnzeigen = (vertrag) => {
    setAusgewaehlterVertrag(vertrag);
    setShowKomponentenModal(true);
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      unit_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      status: "pending",
      due_day: "1",
      components: {
        cold_rent: { amount: "", description: "Kaltmiete" },
        operating_costs: { amount: "", description: "Nebenkosten" },
        heating_costs: { amount: "", description: "Heizkosten" },
        other: [],
      },
    });
  };

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      formZuruecksetzen();
      setShowModal(true);
      // Entferne Query-Parameter aus URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const getEinheitLabel = (unitId) => {
    const einheit = einheiten.find((e) => e.id === unitId);
    return einheit ? einheit.unit_label : unitId;
  };

  const getMieterName = (tenantId) => {
    const mieterObj = mieter.find((m) => m.id === tenantId);
    return mieterObj ? `${mieterObj.first_name} ${mieterObj.last_name}` : tenantId;
  };

  const getGesamtmiete = (vertrag) => {
    if (!vertrag.components || vertrag.components.length === 0) return "—";
    const gesamt = vertrag.components.reduce((summe, k) => summe + parseFloat(k.amount), 0);
    return `${gesamt.toFixed(2)} €`;
  };

  const spalten = [
    {
      key: "unit",
      label: "Einheit",
      render: (zeile) => getEinheitLabel(zeile.unit_id),
    },
    {
      key: "tenant",
      label: "Mieter",
      render: (zeile) => getMieterName(zeile.tenant_id),
    },
    { key: "start_date", label: "Beginn" },
    {
      key: "end_date",
      label: "Ende",
      render: (zeile) => zeile.end_date || "Unbefristet",
    },
      {
        key: "status",
        label: "Status",
        render: (zeile) => (
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              zeile.status === "active"
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                : zeile.status === "pending"
                ? "bg-amber-100 text-amber-700 border-2 border-amber-200"
                : "bg-gray-100 text-gray-700 border-2 border-gray-200"
            }`}
          >
            {zeile.status === "active"
              ? "Aktiv"
              : zeile.status === "pending"
              ? "Ausstehend"
              : "Beendet"}
          </span>
        ),
      },
    {
      key: "rent",
      label: "Gesamtmiete",
      render: (zeile) => getGesamtmiete(zeile),
    },
      {
        key: "actions",
        label: "Aktionen",
        render: (zeile) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleKomponentenAnzeigen(zeile);
              }}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Komponenten anzeigen"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVertragLoeschen(zeile);
              }}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
  ];

  return (
    <div className="animate-fade-in">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Verträge
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Verwalten Sie Ihre Mietverträge</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5 lg:mb-6">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              formZuruecksetzen();
              setShowModal(true);
            }}
            icon={<Plus className="w-5 h-5" />}
          >
            Neuer Vertrag
          </Button>
        </div>
      </div>

      <Tabelle spalten={spalten} daten={vertraege} loading={loading} />

      {/* Vertrag Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          formZuruecksetzen();
        }}
        titel="Neuen Vertrag anlegen"
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-2">
          <Auswahl
            label="Einheit"
            name="unit_id"
            value={formDaten.unit_id}
            onChange={(e) => setFormDaten({ ...formDaten, unit_id: e.target.value })}
            optionen={einheiten.map((e) => ({
              value: e.id,
              label: `${e.unit_label} (${e.status === "vacant" ? "Leer" : "Vermietet"})`,
            }))}
            required
          />
          <Auswahl
            label="Mieter"
            name="tenant_id"
            value={formDaten.tenant_id}
            onChange={(e) => setFormDaten({ ...formDaten, tenant_id: e.target.value })}
            optionen={mieter.map((m) => ({
              value: m.id,
              label: `${m.first_name} ${m.last_name}`,
            }))}
            required
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="Beginn"
              name="start_date"
              type="date"
              value={formDaten.start_date}
              onChange={(e) => setFormDaten({ ...formDaten, start_date: e.target.value })}
              required
              icon={<Calendar className="w-5 h-5" />}
            />
            <Formularfeld
              label="Ende (optional)"
              name="end_date"
              type="date"
              value={formDaten.end_date}
              onChange={(e) => setFormDaten({ ...formDaten, end_date: e.target.value })}
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Auswahl
              label="Status"
              name="status"
              value={formDaten.status}
              onChange={(e) => setFormDaten({ ...formDaten, status: e.target.value })}
              optionen={[
                { value: "pending", label: "Ausstehend" },
                { value: "active", label: "Aktiv" },
                { value: "ended", label: "Beendet" },
              ]}
              required
            />
            <Formularfeld
              label="Fälligkeitstag (1-28)"
              name="due_day"
              type="number"
              value={formDaten.due_day}
              onChange={(e) => setFormDaten({ ...formDaten, due_day: e.target.value })}
              required
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>
          
          {/* Mietkomponenten - alle auf einmal */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              Mietkomponenten
            </h3>
            <p className="text-xs text-gray-500 mb-4">Geben Sie alle Mietkomponenten auf einmal ein:</p>
            
            <div className="space-y-4">
              {/* Kaltmiete */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kaltmiete
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Formularfeld
                    label="Betrag"
                    name="cold_rent_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formDaten.components.cold_rent.amount}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        cold_rent: { ...formDaten.components.cold_rent, amount: e.target.value }
                      }
                    })}
                    icon={<Euro className="w-4 h-4" />}
                  />
                  <Formularfeld
                    label="Beschreibung (optional)"
                    name="cold_rent_description"
                    placeholder="z.B. Grundmiete"
                    value={formDaten.components.cold_rent.description}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        cold_rent: { ...formDaten.components.cold_rent, description: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              
              {/* Nebenkosten */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nebenkosten
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Formularfeld
                    label="Betrag"
                    name="operating_costs_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formDaten.components.operating_costs.amount}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        operating_costs: { ...formDaten.components.operating_costs, amount: e.target.value }
                      }
                    })}
                    icon={<Euro className="w-4 h-4" />}
                  />
                  <Formularfeld
                    label="Beschreibung (optional)"
                    name="operating_costs_description"
                    placeholder="z.B. Betriebskostenvorauszahlung"
                    value={formDaten.components.operating_costs.description}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        operating_costs: { ...formDaten.components.operating_costs, description: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              
              {/* Heizkosten */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Heizkosten
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Formularfeld
                    label="Betrag"
                    name="heating_costs_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formDaten.components.heating_costs.amount}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        heating_costs: { ...formDaten.components.heating_costs, amount: e.target.value }
                      }
                    })}
                    icon={<Euro className="w-4 h-4" />}
                  />
                  <Formularfeld
                    label="Beschreibung (optional)"
                    name="heating_costs_description"
                    placeholder="z.B. Heizkostenvorauszahlung"
                    value={formDaten.components.heating_costs.description}
                    onChange={(e) => setFormDaten({
                      ...formDaten,
                      components: {
                        ...formDaten.components,
                        heating_costs: { ...formDaten.components.heating_costs, description: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              
              {/* Sonstiges - Mehrfach */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Sonstiges
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFormDaten({
                        ...formDaten,
                        components: {
                          ...formDaten.components,
                          other: [...formDaten.components.other, { amount: "", description: "" }]
                        }
                      });
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Hinzufügen
                  </Button>
                </div>
                
                {formDaten.components.other.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Keine Sonstiges-Komponenten hinzugefügt</p>
                ) : (
                  <div className="space-y-3">
                    {formDaten.components.other.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-300">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                          <Formularfeld
                            label="Betrag"
                            name={`other_${index}_amount`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) => {
                              const newOther = [...formDaten.components.other];
                              newOther[index] = { ...newOther[index], amount: e.target.value };
                              setFormDaten({
                                ...formDaten,
                                components: {
                                  ...formDaten.components,
                                  other: newOther
                                }
                              });
                            }}
                            icon={<Euro className="w-4 h-4" />}
                          />
                          <Formularfeld
                            label="Beschreibung"
                            name={`other_${index}_description`}
                            placeholder="z.B. Garage, Stellplatz, Keller"
                            value={item.description}
                            onChange={(e) => {
                              const newOther = [...formDaten.components.other];
                              newOther[index] = { ...newOther[index], description: e.target.value };
                              setFormDaten({
                                ...formDaten,
                                components: {
                                  ...formDaten.components,
                                  other: newOther
                                }
                              });
                            }}
                            className="sm:col-span-1"
                          />
                          <div className="flex items-end h-full">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const newOther = formDaten.components.other.filter((_, i) => i !== index);
                                setFormDaten({
                                  ...formDaten,
                                  components: {
                                    ...formDaten.components,
                                    other: newOther
                                  }
                                });
                              }}
                              className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Entfernen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Gesamtsumme */}
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-emerald-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Gesamtmiete:
                </span>
                <span className="text-2xl font-bold text-emerald-700">
                  {(
                    parseFloat(formDaten.components.cold_rent.amount || 0) +
                    parseFloat(formDaten.components.operating_costs.amount || 0) +
                    parseFloat(formDaten.components.heating_costs.amount || 0) +
                    (formDaten.components.other || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
                  ).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-0">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button type="submit" icon={<Plus className="w-5 h-5" />} className="w-full sm:w-auto">Vertrag erstellen</Button>
          </div>
        </form>
      </Modal>

      {/* Komponenten Modal */}
      <Modal
        isOpen={showKomponentenModal}
        onClose={() => {
          setShowKomponentenModal(false);
          setAusgewaehlterVertrag(null);
          setKomponenten([]);
        }}
        titel={`Mietkomponenten`}
        groesse="lg"
      >
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Neue Komponente</h3>
          <form onSubmit={handleKomponenteHinzufuegen} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <Auswahl
                name="type"
                value={komponentenForm.type}
                onChange={(e) =>
                  setKomponentenForm({ ...komponentenForm, type: e.target.value })
                }
                optionen={[
                  { value: "cold_rent", label: "Kaltmiete" },
                  { value: "operating_costs", label: "Nebenkosten" },
                  { value: "heating_costs", label: "Heizkosten" },
                  { value: "other", label: "Sonstiges" },
                ]}
              />
              <Formularfeld
                placeholder="Betrag (€)"
                name="amount"
                type="number"
                step="0.01"
                value={komponentenForm.amount}
                onChange={(e) =>
                  setKomponentenForm({ ...komponentenForm, amount: e.target.value })
                }
                required
              />
              <Formularfeld
                placeholder="Beschreibung"
                name="description"
                value={komponentenForm.description}
                onChange={(e) =>
                  setKomponentenForm({ ...komponentenForm, description: e.target.value })
                }
              />
              <Button type="submit" className="w-full sm:w-auto">Hinzufügen</Button>
            </div>

            {/* Mietanpassung */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mietanpassung
              </label>
              <Auswahl
                name="adjustment_type"
                value={komponentenForm.adjustment_type}
                onChange={(e) =>
                  setKomponentenForm({ ...komponentenForm, adjustment_type: e.target.value })
                }
                optionen={[
                  { value: "fixed", label: "Feste Miete" },
                  { value: "staggered", label: "Staffelmiete" },
                  { value: "index_linked", label: "Indexmiete" },
                ]}
              />
            </div>

            {/* Staffelmiete */}
            {komponentenForm.adjustment_type === "staggered" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Staffelmiete-Zeitplan</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowStaggeredForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Stufe hinzufügen
                  </Button>
                </div>
                {komponentenForm.staggered_schedule && komponentenForm.staggered_schedule.length > 0 ? (
                  <div className="space-y-2">
                    {komponentenForm.staggered_schedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <span className="text-sm">
                          {new Date(item.date).toLocaleDateString("de-DE")}: {parseFloat(item.amount).toFixed(2)} €
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSchedule = komponentenForm.staggered_schedule.filter((_, i) => i !== idx);
                            setKomponentenForm({ ...komponentenForm, staggered_schedule: newSchedule });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Noch keine Staffelstufen hinzugefügt
                  </p>
                )}
              </div>
            )}

            {/* Indexmiete */}
            {komponentenForm.adjustment_type === "index_linked" && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Indexmiete-Konfiguration</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Formularfeld
                    label="Index-Typ"
                    placeholder="z.B. VPI, Mietspiegel"
                    value={komponentenForm.index_type}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, index_type: e.target.value })
                    }
                  />
                  <Formularfeld
                    label="Basiswert"
                    type="number"
                    step="0.01"
                    value={komponentenForm.index_base_value}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, index_base_value: e.target.value })
                    }
                  />
                  <Formularfeld
                    label="Basis-Datum"
                    type="date"
                    value={komponentenForm.index_base_date}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, index_base_date: e.target.value })
                    }
                  />
                  <Formularfeld
                    label="Nächstes Anpassungsdatum"
                    type="date"
                    value={komponentenForm.index_adjustment_date}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, index_adjustment_date: e.target.value })
                    }
                  />
                  <Formularfeld
                    label="Anpassungsprozentsatz (%)"
                    type="number"
                    step="0.01"
                    value={komponentenForm.index_adjustment_percentage}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, index_adjustment_percentage: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Umlageschlüssel (für Betriebskosten) */}
            {(komponentenForm.type === "operating_costs" || komponentenForm.type === "heating_costs") && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Umlageschlüssel</h4>
                <Auswahl
                  label="Umlageschlüssel"
                  value={komponentenForm.allocation_key}
                  onChange={(e) =>
                    setKomponentenForm({ ...komponentenForm, allocation_key: e.target.value })
                  }
                  optionen={[
                    { value: "", label: "Standard" },
                    { value: "area", label: "Nach Fläche (m²)" },
                    { value: "units", label: "Nach Einheiten" },
                    { value: "persons", label: "Nach Personen" },
                    { value: "custom", label: "Individuell" },
                  ]}
                />
                {komponentenForm.allocation_key === "custom" && (
                  <Formularfeld
                    label="Individueller Faktor"
                    type="number"
                    step="0.0001"
                    value={komponentenForm.allocation_factor}
                    onChange={(e) =>
                      setKomponentenForm({ ...komponentenForm, allocation_factor: e.target.value })
                    }
                  />
                )}
                <Formularfeld
                  label="Notizen zum Umlageschlüssel"
                  type="textarea"
                  value={komponentenForm.allocation_notes}
                  onChange={(e) =>
                    setKomponentenForm({ ...komponentenForm, allocation_notes: e.target.value })
                  }
                />
              </div>
            )}
          </form>
        </div>

        {/* Staffelmiete-Eintrag Modal */}
        {showStaggeredForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Staffelstufe hinzufügen
              </h3>
              <div className="space-y-4">
                <Formularfeld
                  label="Datum"
                  type="date"
                  value={staggeredEntry.date}
                  onChange={(e) => setStaggeredEntry({ ...staggeredEntry, date: e.target.value })}
                  required
                />
                <Formularfeld
                  label="Betrag (€)"
                  type="number"
                  step="0.01"
                  value={staggeredEntry.amount}
                  onChange={(e) => setStaggeredEntry({ ...staggeredEntry, amount: e.target.value })}
                  required
                />
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      if (staggeredEntry.date && staggeredEntry.amount) {
                        const newSchedule = [
                          ...(komponentenForm.staggered_schedule || []),
                          {
                            date: staggeredEntry.date,
                            amount: parseFloat(staggeredEntry.amount),
                          },
                        ].sort((a, b) => new Date(a.date) - new Date(b.date));
                        setKomponentenForm({ ...komponentenForm, staggered_schedule: newSchedule });
                        setStaggeredEntry({ date: "", amount: "" });
                        setShowStaggeredForm(false);
                      }
                    }}
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowStaggeredForm(false);
                      setStaggeredEntry({ date: "", amount: "" });
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-base font-semibold mb-3">Komponenten</h3>
          {komponenten.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Keine Komponenten vorhanden</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Typ
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Betrag
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Beschreibung
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Details
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {komponenten.map((komp) => (
                  <tr key={komp.id}>
                    <td className="px-4 py-2 text-sm">
                      <div>
                        {komp.type === "cold_rent"
                          ? "Kaltmiete"
                          : komp.type === "operating_costs"
                          ? "Nebenkosten"
                          : komp.type === "heating_costs"
                          ? "Heizkosten"
                          : "Sonstiges"}
                        {komp.adjustment_type && komp.adjustment_type !== "fixed" && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                            ({komp.adjustment_type === "staggered" ? "Staffel" : "Index"})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div>{parseFloat(komp.amount).toFixed(2)} €</div>
                      {komp.allocation_key && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Umlage: {komp.allocation_key === "area" ? "Fläche" : komp.allocation_key === "units" ? "Einheiten" : komp.allocation_key === "persons" ? "Personen" : "Individuell"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">{komp.description || "—"}</td>
                    <td className="px-4 py-2 text-sm">
                      {komp.adjustment_type === "staggered" && komp.staggered_schedule && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {komp.staggered_schedule.length} Staffelstufe(n)
                        </div>
                      )}
                      {komp.adjustment_type === "index_linked" && komp.index_type && (
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          Index: {komp.index_type}
                          {komp.index_adjustment_date && (
                            <div>Nächste Anpassung: {new Date(komp.index_adjustment_date).toLocaleDateString("de-DE")}</div>
                          )}
                        </div>
                      )}
                      {(!komp.adjustment_type || komp.adjustment_type === "fixed") && (
                        <span className="text-xs text-gray-400">Feste Miete</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleKomponenteLoeschen(komp.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-2 text-sm">Gesamt</td>
                  <td className="px-4 py-2 text-sm">
                    {komponenten
                      .reduce((s, k) => s + parseFloat(k.amount), 0)
                      .toFixed(2)}{" "}
                    €
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}

