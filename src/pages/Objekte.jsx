import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { propertyApi } from "../api/propertyApi";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import { 
  Search, 
  Plus, 
  Building2, 
  MapPin, 
  Calendar, 
  Ruler,
  FileText,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function Objekte() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [objekte, setObjekte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  const [formDaten, setFormDaten] = useState({
    name: "",
    address: "",
    year_built: "",
    size_sqm: "",
    notes: "",
  });

  useEffect(() => {
    ladeObjekte();
  }, [suche]);

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setBearbeitung(null);
      setFormDaten({
        name: "",
        address: "",
        year_built: "",
        size_sqm: "",
        notes: "",
      });
      setShowModal(true);
      // Entferne Query-Parameter aus URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const ladeObjekte = async () => {
    try {
      setLoading(true);
      const response = await propertyApi.list({ search: suche });
      setObjekte(response.data.items);
    } catch (error) {
      zeigeBenachrichtigung("Fehler beim Laden der Objekte", "fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const daten = {
        ...formDaten,
        year_built: formDaten.year_built ? parseInt(formDaten.year_built) : null,
        size_sqm: formDaten.size_sqm ? parseInt(formDaten.size_sqm) : null,
        features: {},
      };

      if (bearbeitung) {
        await propertyApi.update(bearbeitung.id, daten);
        zeigeBenachrichtigung("Objekt erfolgreich aktualisiert");
      } else {
        await propertyApi.create(daten);
        zeigeBenachrichtigung("Objekt erfolgreich erstellt");
      }

      setShowModal(false);
      setBearbeitung(null);
      formZuruecksetzen();
      ladeObjekte();
    } catch (error) {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Speichern",
        "fehler"
      );
    }
  };

  const handleBearbeiten = (objekt) => {
    setBearbeitung(objekt);
    setFormDaten({
      name: objekt.name,
      address: objekt.address,
      year_built: objekt.year_built || "",
      size_sqm: objekt.size_sqm || "",
      notes: objekt.notes || "",
    });
    setShowModal(true);
  };

  const handleLoeschen = async (objekt) => {
    if (!confirm(`Objekt "${objekt.name}" wirklich löschen?`)) return;

    try {
      await propertyApi.remove(objekt.id);
      zeigeBenachrichtigung("Objekt erfolgreich gelöscht");
      ladeObjekte();
    } catch (error) {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Löschen",
        "fehler"
      );
    }
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      name: "",
      address: "",
      year_built: "",
      size_sqm: "",
      notes: "",
    });
  };

  const spalten = [
    { key: "name", label: "Name" },
    { key: "address", label: "Adresse" },
    {
      key: "year_built",
      label: "Baujahr",
      render: (zeile) => zeile.year_built || "—",
    },
    {
      key: "size_sqm",
      label: "Fläche (m²)",
      render: (zeile) => (zeile.size_sqm ? `${zeile.size_sqm} m²` : "—"),
    },
    {
      key: "actions",
      label: "Aktionen",
      render: (zeile) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/objekte/${zeile.id}`);
            }}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Details anzeigen"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBearbeiten(zeile);
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

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
              Objekte
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Verwalten Sie Ihre Immobilien und Wohneinheiten
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5 lg:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Name oder Adresse..."
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
            icon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="w-full md:w-auto"
            size="sm"
          >
            <span className="hidden sm:inline">Neues Objekt</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <Tabelle
        spalten={spalten}
        daten={objekte}
        loading={loading}
        onZeileKlick={(zeile) => navigate(`/objekte/${zeile.id}`)}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setBearbeitung(null);
          formZuruecksetzen();
        }}
        titel={bearbeitung ? "Objekt bearbeiten" : "Neues Objekt anlegen"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Formularfeld
            label="Name des Objekts"
            name="name"
            value={formDaten.name}
            onChange={(e) => setFormDaten({ ...formDaten, name: e.target.value })}
            placeholder="z.B. Mehrfamilienhaus Musterstraße"
            required
            icon={<Building2 className="w-5 h-5" />}
          />
          <Formularfeld
            label="Adresse"
            name="address"
            value={formDaten.address}
            onChange={(e) => setFormDaten({ ...formDaten, address: e.target.value })}
            placeholder="Musterstraße 123, 12345 Musterstadt"
            required
            icon={<MapPin className="w-5 h-5" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Formularfeld
              label="Baujahr"
              name="year_built"
              type="number"
              value={formDaten.year_built}
              onChange={(e) => setFormDaten({ ...formDaten, year_built: e.target.value })}
              placeholder="z.B. 1995"
              icon={<Calendar className="w-5 h-5" />}
            />
            <Formularfeld
              label="Fläche (m²)"
              name="size_sqm"
              type="number"
              value={formDaten.size_sqm}
              onChange={(e) => setFormDaten({ ...formDaten, size_sqm: e.target.value })}
              placeholder="z.B. 450"
              icon={<Ruler className="w-5 h-5" />}
            />
          </div>
          <Formularfeld
            label="Notizen"
            name="notes"
            type="textarea"
            value={formDaten.notes}
            onChange={(e) => setFormDaten({ ...formDaten, notes: e.target.value })}
            placeholder="Zusätzliche Informationen..."
            icon={<FileText className="w-5 h-5" />}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setBearbeitung(null);
                formZuruecksetzen();
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit" icon={bearbeitung ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}>
              {bearbeitung ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

