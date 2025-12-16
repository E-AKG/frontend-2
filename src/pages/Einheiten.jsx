import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { unitApi } from "../api/unitApi";
import { propertyApi } from "../api/propertyApi";
import { leaseApi } from "../api/leaseApi";
import { tenantApi } from "../api/tenantApi";
import { subscriptionApi } from "../api/subscriptionApi";
import { documentApi } from "../api/documentApi";
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
  Home,
  Image as ImageIcon,
  Upload,
  X,
  Eye
} from "lucide-react";

export default function Einheiten() {
  const { selectedClient } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [einheiten, setEinheiten] = useState([]);
  const [objekte, setObjekte] = useState([]);
  const [vertraege, setVertraege] = useState([]);
  const [mieter, setMieter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bearbeitung, setBearbeitung] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
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
    if (!selectedClient) {
      setEinheiten([]);
      setObjekte([]);
      setVertraege([]);
      setMieter([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [einheitenRes, objekteRes, vertraegeRes, mieterRes] = await Promise.all([
        unitApi.list({ page_size: 1000, client_id: selectedClient.id }),
        propertyApi.list({ page_size: 1000, client_id: selectedClient.id }),
        leaseApi.list({ page_size: 1000, status: "active", client_id: selectedClient.id }),
        tenantApi.list({ page_size: 1000, client_id: selectedClient.id }),
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

  // Lade Bilder für eine Einheit
  const { data: unitImages = [] } = useQuery({
    queryKey: ["unit-images", bearbeitung?.id],
    queryFn: async () => {
      if (!bearbeitung?.id || !selectedClient?.id) return [];
      try {
        const response = await documentApi.list({
          client_id: selectedClient.id,
          unit_id: bearbeitung.id,
          document_type: "other", // Bilder werden als "other" gespeichert
        });
        // Filtere nur Bild-Dateien (jpg, jpeg, png, gif, webp)
        const images = (response.data?.items || response.data || []).filter(doc => {
          const mimeType = doc.mime_type?.toLowerCase() || "";
          const filename = doc.filename?.toLowerCase() || "";
          return mimeType.startsWith("image/") || 
                 filename.endsWith(".jpg") || 
                 filename.endsWith(".jpeg") || 
                 filename.endsWith(".png") || 
                 filename.endsWith(".gif") || 
                 filename.endsWith(".webp");
        });
        return images;
      } catch (error) {
        console.error("Fehler beim Laden der Bilder:", error);
        return [];
      }
    },
    enabled: !!bearbeitung?.id && !!selectedClient?.id,
  });

  // Bild-Upload Mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, unitId }) => {
      if (!selectedClient?.id) throw new Error("Kein Mandant ausgewählt");
      
      return await documentApi.upload(file, {
        client_id: selectedClient.id,
        document_type: "other",
        unit_id: unitId,
        title: file.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-images", bearbeitung?.id] });
      zeigeBenachrichtigung("Bild erfolgreich hochgeladen");
    },
    onError: (error) => {
      zeigeBenachrichtigung("Fehler beim Hochladen des Bildes", "fehler");
      console.error("Upload-Fehler:", error);
    },
  });

  // Bild-Löschen Mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId) => {
      return await documentApi.delete(imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-images", bearbeitung?.id] });
      zeigeBenachrichtigung("Bild erfolgreich gelöscht");
    },
    onError: (error) => {
      zeigeBenachrichtigung("Fehler beim Löschen des Bildes", "fehler");
      console.error("Delete-Fehler:", error);
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Prüfe ob Einheit bereits existiert
    const unitId = bearbeitung?.id;
    if (!unitId) {
      // Wenn noch keine Einheit existiert, speichere die Bilder für später
      setPendingImages([...pendingImages, ...files]);
      zeigeBenachrichtigung(`${files.length} Bild(er) werden nach dem Speichern der Einheit hochgeladen`);
      return;
    }

    // Lade Bilder sofort hoch
    for (const file of files) {
      uploadImageMutation.mutate({ file, unitId });
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!confirm("Möchten Sie dieses Bild wirklich löschen?")) return;
    deleteImageMutation.mutate(imageId);
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

      let unitId;
      if (bearbeitung) {
        await unitApi.update(bearbeitung.id, daten);
        unitId = bearbeitung.id;
        zeigeBenachrichtigung("Einheit erfolgreich aktualisiert");
      } else {
        if (!selectedClient) {
          zeigeBenachrichtigung("Bitte wählen Sie zuerst einen Mandanten aus", "fehler");
          return;
        }
        const response = await unitApi.create(daten, selectedClient.id);
        unitId = response.data.id;
        zeigeBenachrichtigung("Einheit erfolgreich erstellt");
      }

      // Lade ausstehende Bilder hoch (wenn neue Einheit erstellt wurde)
      if (pendingImages.length > 0 && unitId) {
        for (const file of pendingImages) {
          uploadImageMutation.mutate({ file, unitId });
        }
        setPendingImages([]);
      }

      setShowModal(false);
      setBearbeitung(null);
      setUploadedImages([]);
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
                setPendingImages([]);
                setShowModal(true);
              }}
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200"
              title="Bearbeiten"
            >
              <Edit className="w-4 h-4" />
            </button>
            {/* Bilder-Button */}
            {zeile.id && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const response = await documentApi.list({
                      client_id: selectedClient?.id,
                      unit_id: zeile.id,
                      document_type: "other",
                    });
                    const images = (response.data?.items || response.data || []).filter(doc => {
                      const mimeType = doc.mime_type?.toLowerCase() || "";
                      const filename = doc.filename?.toLowerCase() || "";
                      return mimeType.startsWith("image/") || 
                             filename.endsWith(".jpg") || 
                             filename.endsWith(".jpeg") || 
                             filename.endsWith(".png") || 
                             filename.endsWith(".gif") || 
                             filename.endsWith(".webp");
                    });
                    if (images.length > 0) {
                      setSelectedImages(images);
                      setSelectedImageIndex(0);
                      setShowImageModal(true);
                    } else {
                      zeigeBenachrichtigung("Keine Bilder für diese Einheit vorhanden", "info");
                    }
                  } catch (error) {
                    console.error("Fehler beim Laden der Bilder:", error);
                    zeigeBenachrichtigung("Fehler beim Laden der Bilder", "fehler");
                  }
                }}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Bilder ansehen"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
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
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-2">
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
          />

          {/* Bilder - IMMER SICHTBAR */}
          <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4 mt-4">
            <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Bilder der Einheit
            </h3>
            
            {/* Bild-Upload */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Bilder hochladen
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-3 border-2 border-blue-400 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              />
              <p className="text-xs text-blue-700 mt-2 font-medium">
                Sie können mehrere Bilder gleichzeitig auswählen (JPG, PNG, GIF, WebP)
              </p>
            </div>

            {/* Ausstehende Bilder (wenn Einheit noch nicht gespeichert) */}
            {pendingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Ausstehende Bilder ({pendingImages.length})
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {pendingImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(pendingImages.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hochgeladene Bilder */}
            {bearbeitung && unitImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Hochgeladene Bilder ({unitImages.length})
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {unitImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={`/api/documents/${image.id}/download`}
                        alt={image.title || image.filename}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => {
                          setSelectedImages(unitImages);
                          setSelectedImageIndex(unitImages.findIndex(img => img.id === image.id));
                          setShowImageModal(true);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(image.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bearbeitung && unitImages.length === 0 && pendingImages.length === 0 && (
              <p className="text-sm text-gray-500 italic">Noch keine Bilder hochgeladen</p>
            )}
          </div>

          {/* Basisdaten */}
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basisdaten</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Flächen & Anteile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
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
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ausstattung</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
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

      {/* Bild-Galerie Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImages([]);
          setSelectedImageIndex(0);
        }}
        titel="Bildergalerie"
        groesse="lg"
      >
        {selectedImages.length > 0 && (
          <div className="space-y-4">
            {/* Hauptbild */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
              <img
                src={`/api/documents/${selectedImages[selectedImageIndex]?.id}/download`}
                alt={selectedImages[selectedImageIndex]?.title || selectedImages[selectedImageIndex]?.filename}
                className="w-full h-auto object-contain"
              />
              {/* Navigation */}
              {selectedImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {selectedImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {selectedImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      index === selectedImageIndex
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={`/api/documents/${image.id}/download`}
                      alt={image.title || image.filename}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Bild-Info */}
            <div className="text-sm text-gray-600">
              <p className="font-medium">{selectedImages[selectedImageIndex]?.title || selectedImages[selectedImageIndex]?.filename}</p>
              {selectedImages.length > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Bild {selectedImageIndex + 1} von {selectedImages.length}
                </p>
              )}
            </div>
          </div>
        )}
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

