import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceProviderApi } from "../api/serviceProviderApi";
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
  Wrench, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  FileText,
  Edit,
  Trash2,
  Star,
  Building2
} from "lucide-react";

export default function Dienstleister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suche, setSuche] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  const [formDaten, setFormDaten] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    service_type: "electrician",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    tax_id: "",
    iban: "",
    bank_name: "",
    rating: "",
    notes: "",
  });

  // React Query: Fetch Service Providers
  const { data: dienstleister = [], isLoading: loading } = useQuery({
    queryKey: ['serviceProviders', selectedClient?.id, filterType],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const response = await serviceProviderApi.list({ 
        client_id: selectedClient.id,
        service_type: filterType || undefined,
      });
      return response.data || [];
    },
    enabled: !!selectedClient?.id,
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Dienstleister", "fehler");
    },
  });

  // Filtere nach Suche
  const gefilterteDienstleister = dienstleister.filter((d) => {
    if (!suche) return true;
    const sucheLower = suche.toLowerCase();
    return (
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(sucheLower) ||
      (d.company_name && d.company_name.toLowerCase().includes(sucheLower)) ||
      (d.email && d.email.toLowerCase().includes(sucheLower))
    );
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => serviceProviderApi.create(data, selectedClient.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      zeigeBenachrichtigung("Dienstleister erfolgreich erstellt");
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
    mutationFn: ({ id, data }) => serviceProviderApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      zeigeBenachrichtigung("Dienstleister erfolgreich aktualisiert");
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
    mutationFn: (id) => serviceProviderApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceProviders'] });
      zeigeBenachrichtigung("Dienstleister erfolgreich gelöscht");
    },
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Löschen", "fehler");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formDaten,
      rating: formDaten.rating ? parseInt(formDaten.rating) : null,
    };
    
    if (bearbeitung) {
      updateMutation.mutate({ id: bearbeitung.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleLoeschen = (dienstleister) => {
    const name = dienstleister.company_name || `${dienstleister.first_name} ${dienstleister.last_name}`;
    if (!confirm(`Dienstleister "${name}" wirklich löschen?`)) return;
    deleteMutation.mutate(dienstleister.id);
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      company_name: "",
      first_name: "",
      last_name: "",
      service_type: "electrician",
      email: "",
      phone: "",
      mobile: "",
      address: "",
      tax_id: "",
      iban: "",
      bank_name: "",
      rating: "",
      notes: "",
    });
  };

  const getServiceTypeLabel = (type) => {
    const labels = {
      electrician: "Elektriker",
      plumber: "Klempner",
      heating: "Heizungstechniker",
      cleaning: "Reinigung",
      gardening: "Gartenpflege",
      locksmith: "Schlüsseldienst",
      painter: "Maler",
      roofer: "Dachdecker",
      other: "Sonstiges",
    };
    return labels[type] || type;
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
      render: (zeile) => (
        <div>
          <div className="font-medium">{zeile.company_name || `${zeile.first_name} ${zeile.last_name}`}</div>
          {zeile.company_name && (
            <div className="text-sm text-gray-500">{zeile.first_name} {zeile.last_name}</div>
          )}
        </div>
      ),
    },
    {
      key: "service_type",
      label: "Typ",
      render: (zeile) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          {getServiceTypeLabel(zeile.service_type)}
        </span>
      ),
    },
    {
      key: "contact",
      label: "Kontakt",
      render: (zeile) => (
        <div className="text-sm">
          {zeile.email && <div>{zeile.email}</div>}
          {zeile.phone && <div className="text-gray-500">{zeile.phone}</div>}
        </div>
      ),
    },
    {
      key: "rating",
      label: "Bewertung",
      render: (zeile) => zeile.rating ? (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < zeile.rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      ) : "—",
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
                company_name: zeile.company_name || "",
                first_name: zeile.first_name,
                last_name: zeile.last_name,
                service_type: zeile.service_type,
                email: zeile.email || "",
                phone: zeile.phone || "",
                mobile: zeile.mobile || "",
                address: zeile.address || "",
                tax_id: zeile.tax_id || "",
                iban: zeile.iban || "",
                bank_name: zeile.bank_name || "",
                rating: zeile.rating || "",
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
          <Wrench className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Dienstleister
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Verwalten Sie Ihre Handwerker und Dienstleister</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
            <Auswahl
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              optionen={[
                { value: "", label: "Alle Typen" },
                { value: "electrician", label: "Elektriker" },
                { value: "plumber", label: "Klempner" },
                { value: "heating", label: "Heizungstechniker" },
                { value: "cleaning", label: "Reinigung" },
                { value: "gardening", label: "Gartenpflege" },
                { value: "locksmith", label: "Schlüsseldienst" },
                { value: "painter", label: "Maler" },
                { value: "roofer", label: "Dachdecker" },
                { value: "other", label: "Sonstiges" },
              ]}
              className="min-w-[200px]"
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
            Neuer Dienstleister
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <Tabelle spalten={spalten} daten={gefilterteDienstleister} loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setBearbeitung(null);
          formZuruecksetzen();
        }}
        titel={bearbeitung ? "Dienstleister bearbeiten" : "Neuer Dienstleister"}
        groesse="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-2">
          <Formularfeld
            label="Firmenname (optional)"
            name="company_name"
            value={formDaten.company_name}
            onChange={(e) => setFormDaten({ ...formDaten, company_name: e.target.value })}
            icon={<Building2 className="w-5 h-5" />}
          />
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
          <Auswahl
            label="Dienstleistungstyp"
            name="service_type"
            value={formDaten.service_type}
            onChange={(e) => setFormDaten({ ...formDaten, service_type: e.target.value })}
            optionen={[
              { value: "electrician", label: "Elektriker" },
              { value: "plumber", label: "Klempner" },
              { value: "heating", label: "Heizungstechniker" },
              { value: "cleaning", label: "Reinigung" },
              { value: "gardening", label: "Gartenpflege" },
              { value: "locksmith", label: "Schlüsseldienst" },
              { value: "painter", label: "Maler" },
              { value: "roofer", label: "Dachdecker" },
              { value: "other", label: "Sonstiges" },
            ]}
            required
          />
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
            label="Mobil"
            name="mobile"
            value={formDaten.mobile}
            onChange={(e) => setFormDaten({ ...formDaten, mobile: e.target.value })}
            icon={<Phone className="w-5 h-5" />}
          />
          <Formularfeld
            label="Adresse"
            name="address"
            value={formDaten.address}
            onChange={(e) => setFormDaten({ ...formDaten, address: e.target.value })}
            icon={<MapPin className="w-5 h-5" />}
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="Steuernummer"
              name="tax_id"
              value={formDaten.tax_id}
              onChange={(e) => setFormDaten({ ...formDaten, tax_id: e.target.value })}
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
            label="Bewertung (1-5)"
            name="rating"
            type="number"
            min="1"
            max="5"
            value={formDaten.rating}
            onChange={(e) => setFormDaten({ ...formDaten, rating: e.target.value })}
            icon={<Star className="w-5 h-5" />}
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

