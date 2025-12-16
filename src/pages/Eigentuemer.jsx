import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "../api/ownerApi";
import { useApp } from "../contexts";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { 
  Search, 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  FileText,
  Edit,
  Trash2,
  Percent,
  Building2
} from "lucide-react";

export default function Eigentuemer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suche, setSuche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  const [formDaten, setFormDaten] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    // Steuerliche Daten
    tax_id: "",
    // Eigentumsanteile
    ownership_percentage: "",
    // Zahlungsverkehr
    iban: "",
    bank_name: "",
    // Status
    status: "",
    // Zusätzliche Infos
    notes: "",
  });

  // React Query: Fetch Owners
  const { data: eigentuemer = [], isLoading: loading } = useQuery({
    queryKey: ['owners', selectedClient?.id, suche],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const response = await ownerApi.list({ client_id: selectedClient.id });
      return response.data || [];
    },
    enabled: !!selectedClient?.id,
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Eigentümer", "fehler");
    },
  });

  // Filtere nach Suche
  const gefilterteEigentuemer = eigentuemer.filter((e) => {
    if (!suche) return true;
    const sucheLower = suche.toLowerCase();
    return (
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(sucheLower) ||
      (e.email && e.email.toLowerCase().includes(sucheLower))
    );
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => ownerApi.create(data, selectedClient.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      zeigeBenachrichtigung("Eigentümer erfolgreich erstellt");
      setShowModal(false);
      formZuruecksetzen();
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Speichern",
        "fehler"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ownerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      zeigeBenachrichtigung("Eigentümer erfolgreich aktualisiert");
      setShowModal(false);
      setBearbeitung(null);
      formZuruecksetzen();
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Aktualisieren",
        "fehler"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ownerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      zeigeBenachrichtigung("Eigentümer erfolgreich gelöscht");
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formDaten,
      ownership_percentage: formDaten.ownership_percentage ? parseFloat(formDaten.ownership_percentage) : null,
      tax_id: formDaten.tax_id?.trim() || null,
      iban: formDaten.iban?.trim() || null,
      bank_name: formDaten.bank_name?.trim() || null,
      status: formDaten.status || null,
      email: formDaten.email?.trim() || null,
      phone: formDaten.phone?.trim() || null,
      address: formDaten.address?.trim() || null,
      notes: formDaten.notes?.trim() || null,
    };
    
    if (bearbeitung) {
      updateMutation.mutate({ id: bearbeitung.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleLoeschen = (eigentuemer) => {
    if (!confirm(`Eigentümer "${eigentuemer.first_name} ${eigentuemer.last_name}" wirklich löschen?`)) return;
    deleteMutation.mutate(eigentuemer.id);
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      tax_id: "",
      ownership_percentage: "",
      iban: "",
      bank_name: "",
      status: "",
      notes: "",
    });
  };

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      formZuruecksetzen();
      setShowModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const spalten = [
    {
      key: "name",
      label: "Name",
      render: (zeile) => `${zeile.first_name} ${zeile.last_name}`,
    },
    {
      key: "email",
      label: "E-Mail",
      render: (zeile) => zeile.email || "—",
    },
    {
      key: "phone",
      label: "Telefon",
      render: (zeile) => zeile.phone || "—",
    },
    {
      key: "ownership_percentage",
      label: "Anteil",
      render: (zeile) => zeile.ownership_percentage ? `${zeile.ownership_percentage}%` : "—",
    },
    {
      key: "actions",
      label: "Aktionen",
      render: (zeile) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBearbeitung(zeile);
              setFormDaten({
                first_name: zeile.first_name,
                last_name: zeile.last_name,
                email: zeile.email || "",
                phone: zeile.phone || "",
                address: zeile.address || "",
                tax_id: zeile.tax_id || "",
                ownership_percentage: zeile.ownership_percentage || "",
                iban: zeile.iban || "",
                bank_name: zeile.bank_name || "",
                status: zeile.status || "",
                notes: zeile.notes || "",
              });
              setShowModal(true);
            }}
            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLoeschen(zeile);
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

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Bitte wählen Sie einen Mandanten aus</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Building2 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Eigentümer
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Verwalten Sie Ihre Eigentümer</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Name oder E-Mail..."
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white hover:border-gray-300"
            />
          </div>
          <Button
            onClick={() => {
              formZuruecksetzen();
              setBearbeitung(null);
              setShowModal(true);
            }}
            icon={<Plus className="w-5 h-5" />}
          >
            Neuer Eigentümer
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <Tabelle spalten={spalten} daten={gefilterteEigentuemer} loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setBearbeitung(null);
          formZuruecksetzen();
        }}
        titel={bearbeitung ? "Eigentümer bearbeiten" : "Neuer Eigentümer"}
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="Vorname"
              name="first_name"
              value={formDaten.first_name}
              onChange={(e) => setFormDaten({ ...formDaten, first_name: e.target.value })}
              required
            />
            <Formularfeld
              label="Nachname"
              name="last_name"
              value={formDaten.last_name}
              onChange={(e) => setFormDaten({ ...formDaten, last_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="E-Mail"
              name="email"
              type="email"
              value={formDaten.email}
              onChange={(e) => setFormDaten({ ...formDaten, email: e.target.value })}
              icon={<Mail className="w-5 h-5" />}
            />
            <Formularfeld
              label="Telefon"
              name="phone"
              value={formDaten.phone}
              onChange={(e) => setFormDaten({ ...formDaten, phone: e.target.value })}
              icon={<Phone className="w-5 h-5" />}
            />
          </div>
          <Formularfeld
            label="Adresse"
            name="address"
            value={formDaten.address}
            onChange={(e) => setFormDaten({ ...formDaten, address: e.target.value })}
            icon={<MapPin className="w-5 h-5" />}
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="Eigentumsanteil (%)"
              name="ownership_percentage"
              type="number"
              step="0.01"
              value={formDaten.ownership_percentage}
              onChange={(e) => setFormDaten({ ...formDaten, ownership_percentage: e.target.value })}
              icon={<Percent className="w-5 h-5" />}
            />
            <Formularfeld
              label="IBAN"
              name="iban"
              value={formDaten.iban}
              onChange={(e) => setFormDaten({ ...formDaten, iban: e.target.value })}
              icon={<CreditCard className="w-5 h-5" />}
            />
          </div>
          <Formularfeld
            label="Bank"
            name="bank_name"
            value={formDaten.bank_name}
            onChange={(e) => setFormDaten({ ...formDaten, bank_name: e.target.value })}
          />
          <Formularfeld
            label="Notizen"
            name="notes"
            type="textarea"
            value={formDaten.notes}
            onChange={(e) => setFormDaten({ ...formDaten, notes: e.target.value })}
            icon={<FileText className="w-5 h-5" />}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-0">
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

