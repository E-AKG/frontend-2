import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { tenantApi } from "../api/tenantApi";
import { adminPortalApi } from "../api/adminPortalApi";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
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
  CheckCircle2,
  Building2,
  Wrench
} from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import Eigentuemer from "./Eigentuemer";
import Dienstleister from "./Dienstleister";

export default function Mieter() {
  const { selectedClient } = useApp();
  const [activeTab, setActiveTab] = useState("tenants");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    notes: "",
    // Alle Vertragspartner
    contract_partners: [],
    // Bonität
    schufa_score: "",
    salary_proof_document_id: "",
    // Bankverbindung für SEPA
    iban: "",
    sepa_mandate_reference: "",
    sepa_mandate_date: "",
  });

  // React Query: Fetch Tenants
  const { data: mieter = [], isLoading: loading } = useQuery({
    queryKey: ['tenants', suche, selectedClient?.id],
    queryFn: async () => {
      const response = await tenantApi.list({ 
        search: suche,
        client_id: selectedClient?.id 
      });
      return response.data.items;
    },
    enabled: !!selectedClient,
    onError: () => {
      zeigeBenachrichtigung("Fehler beim Laden der Mieter", "fehler");
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!selectedClient) {
        throw new Error("Bitte wählen Sie zuerst einen Mandanten aus");
      }
      const cleanedData = {
        ...data,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        // Vertragspartner
        contract_partners: data.contract_partners && data.contract_partners.length > 0 ? data.contract_partners : null,
        // Bonität
        schufa_score: data.schufa_score ? parseInt(data.schufa_score) : null,
        salary_proof_document_id: data.salary_proof_document_id?.trim() || null,
        // SEPA
        iban: data.iban?.trim() || null,
        sepa_mandate_reference: data.sepa_mandate_reference?.trim() || null,
        sepa_mandate_date: data.sepa_mandate_date || null,
      };
      return await tenantApi.create(cleanedData, selectedClient.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      zeigeBenachrichtigung("Mieter erfolgreich erstellt");
      setShowModal(false);
      setBearbeitung(null);
      formZuruecksetzen();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail;
      if (errorMessage && typeof errorMessage === 'object') {
        const firstError = errorMessage[0];
        if (firstError?.loc && firstError?.msg) {
          const field = firstError.loc[firstError.loc.length - 1];
          zeigeBenachrichtigung(`${field}: ${firstError.msg}`, "fehler");
          return;
        }
      }
      zeigeBenachrichtigung(errorMessage || "Fehler beim Speichern", "fehler");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const cleanedData = {
        ...data,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        // Vertragspartner
        contract_partners: data.contract_partners && data.contract_partners.length > 0 ? data.contract_partners : null,
        // Bonität
        schufa_score: data.schufa_score ? parseInt(data.schufa_score) : null,
        salary_proof_document_id: data.salary_proof_document_id?.trim() || null,
        // SEPA
        iban: data.iban?.trim() || null,
        sepa_mandate_reference: data.sepa_mandate_reference?.trim() || null,
        sepa_mandate_date: data.sepa_mandate_date || null,
      };
      return await tenantApi.update(id, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      zeigeBenachrichtigung("Mieter erfolgreich aktualisiert");
      setShowModal(false);
      setBearbeitung(null);
      formZuruecksetzen();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail;
      if (errorMessage && typeof errorMessage === 'object') {
        const firstError = errorMessage[0];
        if (firstError?.loc && firstError?.msg) {
          const field = firstError.loc[firstError.loc.length - 1];
          zeigeBenachrichtigung(`${field}: ${firstError.msg}`, "fehler");
          return;
        }
      }
      zeigeBenachrichtigung(errorMessage || "Fehler beim Speichern", "fehler");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await tenantApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      zeigeBenachrichtigung("Mieter erfolgreich gelöscht");
    },
    onError: (error) => {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Löschen",
        "fehler"
      );
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bearbeitung) {
      updateMutation.mutate({ id: bearbeitung.id, data: formDaten });
    } else {
      createMutation.mutate(formDaten);
    }
  };

  const handleLoeschen = (mieter) => {
    if (!confirm(`Mieter "${mieter.first_name} ${mieter.last_name}" wirklich löschen?`))
      return;
    deleteMutation.mutate(mieter.id);
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      contract_partners: [],
      schufa_score: "",
      salary_proof_document_id: "",
      iban: "",
      sepa_mandate_reference: "",
      sepa_mandate_date: "",
    });
  };

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setBearbeitung(null);
      setFormDaten({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        iban: "",
        address: "",
        notes: "",
      });
      setShowModal(true);
      // Entferne Query-Parameter aus URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Vereinfachte Spalten - nur das Wichtigste
  const spalten = [
    {
      key: "name",
      label: "Name",
      render: (zeile) => (
        <button
          onClick={() => navigate(`/personen/${zeile.id}`)}
          className="text-left hover:text-primary-600 transition-colors"
        >
          <div className="font-semibold text-gray-900">
            {zeile.first_name} {zeile.last_name}
          </div>
          {zeile.email && (
            <div className="text-xs text-gray-500 mt-0.5">{zeile.email}</div>
          )}
        </button>
      ),
    },
    {
      key: "risk",
      label: "Risiko",
      render: (zeile) => (
        <RiskBadge 
          score={zeile.risk_score} 
          level={zeile.risk_level}
          showScore={true}
          size="sm"
        />
      ),
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
                notes: zeile.notes || "",
                contract_partners: zeile.contract_partners || [],
                schufa_score: zeile.schufa_score || "",
                salary_proof_document_id: zeile.salary_proof_document_id || "",
                iban: zeile.iban || "",
                sepa_mandate_reference: zeile.sepa_mandate_reference || "",
                sepa_mandate_date: zeile.sepa_mandate_date ? zeile.sepa_mandate_date.split('T')[0] : "",
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

  return (
    <div className="animate-fade-in">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Personen
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Verwalten Sie Mieter, Eigentümer und Dienstleister</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: "tenants", label: "Mieter", icon: Users },
            { id: "owners", label: "Eigentümer", icon: Building2 },
            { id: "providers", label: "Dienstleister", icon: Wrench },
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
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "tenants" && (
      <div>
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5 lg:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Name oder E-Mail..."
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white hover:border-gray-300"
            />
          </div>
          <Button
            onClick={() => {
              setBearbeitung(null);
              formZuruecksetzen();
              setShowModal(true);
            }}
            icon={<Plus className="w-5 h-5" />}
          >
            Neuer Mieter
          </Button>
        </div>
      </div>

      <Tabelle spalten={spalten} daten={mieter} loading={loading} />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setBearbeitung(null);
          formZuruecksetzen();
        }}
        titel={bearbeitung ? "Mieter bearbeiten" : "Neuen Mieter anlegen"}
        kompakt={true}
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Formularfeld
              label="Vorname"
              name="first_name"
              value={formDaten.first_name}
              onChange={(e) => setFormDaten({ ...formDaten, first_name: e.target.value })}
              required
              icon={<Users className="w-5 h-5" />}
            />
            <Formularfeld
              label="Nachname"
              name="last_name"
              value={formDaten.last_name}
              onChange={(e) => setFormDaten({ ...formDaten, last_name: e.target.value })}
              required
            />
          </div>
          <Formularfeld
            label="E-Mail (für Mieterportal-Zugang)"
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
          <Formularfeld
            label="Adresse"
            name="address"
            value={formDaten.address}
            onChange={(e) => setFormDaten({ ...formDaten, address: e.target.value })}
            icon={<MapPin className="w-5 h-5" />}
          />
          
          {/* Alle Vertragspartner */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Alle Vertragspartner (z.B. Eheleute)</h3>
            {formDaten.contract_partners.map((partner, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                <Formularfeld
                  label="Vorname"
                  value={partner.first_name || ""}
                  onChange={(e) => {
                    const newPartners = [...formDaten.contract_partners];
                    newPartners[index] = { ...newPartners[index], first_name: e.target.value };
                    setFormDaten({ ...formDaten, contract_partners: newPartners });
                  }}
                />
                <Formularfeld
                  label="Nachname"
                  value={partner.last_name || ""}
                  onChange={(e) => {
                    const newPartners = [...formDaten.contract_partners];
                    newPartners[index] = { ...newPartners[index], last_name: e.target.value };
                    setFormDaten({ ...formDaten, contract_partners: newPartners });
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFormDaten({ ...formDaten, contract_partners: [...formDaten.contract_partners, { first_name: "", last_name: "" }] })}
            >
              + Partner hinzufügen
            </Button>
          </div>
          
          {/* Bonität */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bonität</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Formularfeld
                label="Schufa-Score (0-100)"
                name="schufa_score"
                type="number"
                min="0"
                max="100"
                value={formDaten.schufa_score}
                onChange={(e) => setFormDaten({ ...formDaten, schufa_score: e.target.value })}
                placeholder="z.B. 95"
              />
              <Formularfeld
                label="Gehaltsnachweis (Dokument-ID)"
                name="salary_proof_document_id"
                value={formDaten.salary_proof_document_id}
                onChange={(e) => setFormDaten({ ...formDaten, salary_proof_document_id: e.target.value })}
                placeholder="Wird später verlinkt"
              />
            </div>
          </div>
          
          {/* Bankverbindung für SEPA */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bankverbindung für SEPA-Lastschriftmandate</h3>
            <Formularfeld
              label="IBAN (für SEPA-Lastschriftmandate)"
              name="iban"
              value={formDaten.iban}
              onChange={(e) => setFormDaten({ ...formDaten, iban: e.target.value })}
              placeholder="DE89370400440532013000"
              icon={<CreditCard className="w-5 h-5" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2">
              <Formularfeld
                label="SEPA-Mandatsreferenz"
                name="sepa_mandate_reference"
                value={formDaten.sepa_mandate_reference}
                onChange={(e) => setFormDaten({ ...formDaten, sepa_mandate_reference: e.target.value })}
                placeholder="z.B. MANDAT-2024-001"
              />
              <Formularfeld
                label="SEPA-Mandatsdatum"
                name="sepa_mandate_date"
                type="date"
                value={formDaten.sepa_mandate_date}
                onChange={(e) => setFormDaten({ ...formDaten, sepa_mandate_date: e.target.value })}
              />
            </div>
            <div className="p-3 sm:p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-2 sm:gap-3 mt-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-emerald-900">
                Mit IBAN werden Zahlungen automatisch zu 100% korrekt zugeordnet!
              </p>
            </div>
          </div>
          
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
            <Button 
              type="submit" 
              icon={bearbeitung ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              className="w-full sm:w-auto"
            >
              {bearbeitung ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
      )}

      {activeTab === "owners" && <Eigentuemer />}
      {activeTab === "providers" && <Dienstleister />}
    </div>
  );
}