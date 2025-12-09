import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Edit
} from "lucide-react";

export default function Vertraege() {
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
  });

  const [komponentenForm, setKomponentenForm] = useState({
    type: "cold_rent",
    amount: "",
    description: "",
  });

  // React Query: Fetch Leases
  const { data: vertraege = [], isLoading: loading } = useQuery({
    queryKey: ['leases'],
    queryFn: async () => {
      const response = await leaseApi.list({});
      return response.data.items;
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Verträge", "fehler");
    },
  });

  // React Query: Fetch Units
  const { data: einheiten = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await unitApi.list({ page_size: 100 });
      return response.data.items;
    },
  });

  // React Query: Fetch Tenants
  const { data: mieter = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await tenantApi.list({ page_size: 100 });
      return response.data.items;
    },
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
      const payload = {
        ...daten,
        due_day: parseInt(daten.due_day),
        end_date: daten.end_date || null,
      };
      return await leaseApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      invalidateSollstellungen();
      zeigeBenachrichtigung("Vertrag erfolgreich erstellt");
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
      return await leaseApi.createComponent(leaseId, {
        ...componentData,
        amount: parseFloat(componentData.amount),
      });
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
    });
  };

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setFormDaten({
        unit_id: "",
        tenant_id: "",
        start_date: "",
        end_date: "",
        status: "pending",
        due_day: "1",
      });
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
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-0">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button type="submit" icon={<Plus className="w-5 h-5" />} className="w-full sm:w-auto">Erstellen</Button>
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
          <form onSubmit={handleKomponenteHinzufuegen} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
          </form>
        </div>

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
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {komponenten.map((komp) => (
                  <tr key={komp.id}>
                    <td className="px-4 py-2 text-sm">
                      {komp.type === "cold_rent"
                        ? "Kaltmiete"
                        : komp.type === "operating_costs"
                        ? "Nebenkosten"
                        : komp.type === "heating_costs"
                        ? "Heizkosten"
                        : "Sonstiges"}
                    </td>
                    <td className="px-4 py-2 text-sm">{parseFloat(komp.amount).toFixed(2)} €</td>
                    <td className="px-4 py-2 text-sm">{komp.description || "—"}</td>
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
                  <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}

