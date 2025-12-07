import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unitApi";
import { propertyApi } from "../api/propertyApi";
import { leaseApi } from "../api/leaseApi";
import { tenantApi } from "../api/tenantApi";
import { subscriptionApi } from "../api/subscriptionApi";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";
import UpgradeModal from "../components/UpgradeModal";
import { 
  DoorOpen, 
  Search, 
  Plus, 
  Building2, 
  Ruler, 
  Calendar,
  Users,
  Edit,
  Trash2,
  Home
} from "lucide-react";

export default function Einheiten() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [einheiten, setEinheiten] = useState([]);
  const [objekte, setObjekte] = useState([]);
  const [vertraege, setVertraege] = useState([]);
  const [mieter, setMieter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

  // Get user limits
  const { data: limits } = useQuery({
    queryKey: ["limits"],
    queryFn: () => subscriptionApi.getLimits(),
  });

  const unitLimit = limits?.data?.units;
  const isLimitReached = unitLimit && !unitLimit.unlimited && unitLimit.used >= unitLimit.limit;

  const [formDaten, setFormDaten] = useState({
    property_id: "",
    unit_label: "",
    floor: "",
    size_sqm: "",
    status: "vacant",
  });

  useEffect(() => {
    ladeAlles();
  }, []);

  // Prüfe Query-Parameter für automatisches Öffnen des Modals
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      const limitReached = unitLimit && !unitLimit.unlimited && unitLimit.used >= unitLimit.limit;
      if (limitReached) {
        setShowUpgradeModal(true);
      } else {
        setBearbeitung(null);
        formZuruecksetzen();
        setShowModal(true);
      }
      // Entferne Query-Parameter aus URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, unitLimit]);

  const ladeAlles = async () => {
    try {
      setLoading(true);
      const [einheitenRes, objekteRes, vertraegeRes, mieterRes] = await Promise.all([
        unitApi.list({ page_size: 1000 }),
        propertyApi.list({ page_size: 1000 }),
        leaseApi.list({ page_size: 1000, status: "active" }),
        tenantApi.list({ page_size: 1000 }),
      ]);
      
      console.log("📊 Geladene Daten:");
      console.log("Objekte:", objekteRes.data.items);
      console.log("Einheiten:", einheitenRes.data.items);
      console.log("Verträge:", vertraegeRes.data.items);
      console.log("Mieter:", mieterRes.data.items);
      
      setEinheiten(einheitenRes.data.items || []);
      setObjekte(objekteRes.data.items || []);
      setVertraege(vertraegeRes.data.items || []);
      setMieter(mieterRes.data.items || []);
    } catch (error) {
      console.error("❌ Fehler beim Laden:", error);
      zeigeBenachrichtigung("Fehler beim Laden der Daten", "fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const daten = {
        property_id: formDaten.property_id,
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
      ladeAlles();
    } catch (error) {
      // Check if it's a limit error
      const errorDetail = error.response?.data?.detail;
      if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'unit_limit_reached') {
        setShowUpgradeModal(true);
      } else {
        zeigeBenachrichtigung(
          typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || "Fehler beim Speichern",
          "fehler"
        );
      }
    }
  };

  const handleLoeschen = async (einheit) => {
    if (!confirm(`Einheit "${einheit.unit_label}" wirklich löschen?`)) return;

    try {
      await unitApi.remove(einheit.id);
      zeigeBenachrichtigung("Einheit erfolgreich gelöscht");
      ladeAlles();
    } catch (error) {
      zeigeBenachrichtigung(
        error.response?.data?.detail || "Fehler beim Löschen",
        "fehler"
      );
    }
  };

  const formZuruecksetzen = () => {
    setFormDaten({
      property_id: "",
      unit_label: "",
      floor: "",
      size_sqm: "",
      status: "vacant",
    });
  };

  const getObjektName = (propertyId) => {
    const objekt = objekte.find((o) => o.id === propertyId);
    return objekt ? objekt.name : "—";
  };

  const getAktuellerMieter = (unitId) => {
    // Finde aktiven Vertrag für diese Einheit
    const vertrag = vertraege.find(
      (v) => v.unit_id === unitId && v.status === "active"
    );
    
    if (!vertrag) return "—";
    
    // Finde Mieter
    const mieterObj = mieter.find((m) => m.id === vertrag.tenant_id);
    return mieterObj ? `${mieterObj.first_name} ${mieterObj.last_name}` : "—";
  };

  // Filtere Einheiten nach Suche
  const gefilterteEinheiten = einheiten.filter((einheit) => {
    if (!suche) return true;
    const sucheLower = suche.toLowerCase();
    const objektName = getObjektName(einheit.property_id).toLowerCase();
    return (
      einheit.unit_label.toLowerCase().includes(sucheLower) ||
      objektName.includes(sucheLower)
    );
  });

  const spalten = [
    {
      key: "property",
      label: "Objekt",
      render: (zeile) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/objekte/${zeile.property_id}`);
          }}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {getObjektName(zeile.property_id)}
        </button>
      ),
    },
    { key: "unit_label", label: "Bezeichnung" },
    { key: "floor", label: "Etage", render: (zeile) => zeile.floor || "—" },
    {
      key: "size_sqm",
      label: "Größe (m²)",
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
      key: "tenant",
      label: "Aktueller Mieter",
      render: (zeile) => getAktuellerMieter(zeile.id),
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
                  property_id: zeile.property_id,
                  unit_label: zeile.unit_label,
                  floor: zeile.floor || "",
                  size_sqm: zeile.size_sqm || "",
                  status: zeile.status,
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

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <DoorOpen className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Einheiten
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Übersicht aller Wohneinheiten in Ihren Objekten
        </p>
      </div>

      {/* Statistik-Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-5 lg:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 p-4 sm:p-5 lg:p-6 card-hover">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-500 mb-1">Gesamt Einheiten</div>
              <div className="text-3xl font-bold text-gray-900">{einheiten.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DoorOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-700 mb-1">Frei</div>
              <div className="text-3xl font-bold text-emerald-700">
                {einheiten.filter((e) => e.status === "vacant").length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-700 mb-1">Vermietet</div>
              <div className="text-3xl font-bold text-red-700">
                {einheiten.filter((e) => e.status === "occupied").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suche nach Objekt oder Einheit..."
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white hover:border-gray-300"
            />
          </div>
          <div className="flex items-center gap-4">
            {unitLimit && !unitLimit.unlimited && (
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{unitLimit.used}</span>
                <span className="text-slate-500">/{unitLimit.limit} Einheiten</span>
                {isLimitReached && (
                  <span className="ml-2 text-amber-600 font-medium">(Limit erreicht)</span>
                )}
              </div>
            )}
            <Button
              onClick={() => {
                if (isLimitReached) {
                  setShowUpgradeModal(true);
                  return;
                }
                setBearbeitung(null);
                formZuruecksetzen();
                setShowModal(true);
              }}
              disabled={isLimitReached}
              icon={<Plus className="w-5 h-5" />}
            >
              Neue Einheit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabelle */}
      <Tabelle
        spalten={spalten}
        daten={gefilterteEinheiten}
        loading={loading}
      />

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
          <Auswahl
            label="Objekt"
            name="property_id"
            value={formDaten.property_id}
            onChange={(e) => setFormDaten({ ...formDaten, property_id: e.target.value })}
            optionen={objekte.map((o) => ({
              value: o.id,
              label: `${o.name} (${o.address})`,
            }))}
            required
          />
          <Formularfeld
            label="Bezeichnung"
            name="unit_label"
            value={formDaten.unit_label}
            onChange={(e) => setFormDaten({ ...formDaten, unit_label: e.target.value })}
            placeholder="z.B. Wohnung 1A"
            required
            className="mt-4"
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
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
          <div className="flex justify-end space-x-3 mt-6">
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
            <Button type="submit">
              {bearbeitung ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </form>
      </Modal>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="unit"
      />

      {benachrichtigung && <Benachrichtigung {...benachrichtigung} />}
    </div>
  );
}

