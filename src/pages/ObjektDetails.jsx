import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { propertyApi } from "../api/propertyApi";
import { unitApi } from "../api/unitApi";
import Tabelle from "../components/Tabelle";
import Modal from "../components/Modal";
import Formularfeld from "../components/Formularfeld";
import Auswahl from "../components/Auswahl";
import Button from "../components/Button";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";

export default function ObjektDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [objekt, setObjekt] = useState(null);
  const [einheiten, setEinheiten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bearbeitung, setBearbeitung] = useState(null);
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();

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
        className="flex items-center text-slate-600 hover:text-slate-900 mb-6 text-[15px]"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zurück zu Objekte
      </button>

      {/* Objekt-Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{objekt.name}</h1>
        <p className="text-slate-600 text-[15px] mb-6">{objekt.address}</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">Baujahr</p>
            <p className="text-lg font-semibold text-slate-900">
              {objekt.year_built || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Fläche</p>
            <p className="text-lg font-semibold text-slate-900">
              {objekt.size_sqm ? `${objekt.size_sqm} m²` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Einheiten</p>
            <p className="text-lg font-semibold text-slate-900">{einheiten.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Vermietet</p>
            <p className="text-lg font-semibold text-slate-900">
              {einheiten.filter((e) => e.status === "occupied").length}
            </p>
          </div>
        </div>

        {objekt.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-slate-500 mb-1">Notizen</p>
            <p className="text-[15px] text-slate-700">{objekt.notes}</p>
          </div>
        )}
      </div>

      {/* Einheiten */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Wohneinheiten</h2>
          <Button
            onClick={() => {
              setBearbeitung(null);
              formZuruecksetzen();
              setShowModal(true);
            }}
          >
            + Neue Einheit
          </Button>
        </div>

        <Tabelle spalten={spalten} daten={einheiten} loading={loading} />
      </div>

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
    </div>
  );
}

