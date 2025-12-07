import { useNavigate } from "react-router-dom";
import { X, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Button from "./Button";

export default function UpgradeModal({ isOpen, onClose, limitType = "general" }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const limitMessages = {
    unit: {
      title: "Einheiten-Limit erreicht",
      message: "Sie haben das Limit von 1 Einheit erreicht. Upgraden Sie auf ein Abonnement, um unbegrenzt Einheiten anzulegen.",
      feature: "Einheiten"
    },
    csv: {
      title: "CSV-Upload-Limit erreicht",
      message: "Sie haben das Limit von 1 CSV-Datei erreicht. Upgraden Sie auf ein Abonnement, um unbegrenzt CSV-Dateien hochzuladen.",
      feature: "CSV-Dateien"
    },
    match: {
      title: "Abgleich-Limit erreicht",
      message: "Sie haben das Limit von 1 Abgleich erreicht. Upgraden Sie auf ein Abonnement, um unbegrenzt Abgleiche durchzuführen.",
      feature: "Abgleiche"
    },
    general: {
      title: "Upgrade erforderlich",
      message: "Um diese Funktion zu nutzen, benötigen Sie ein Abonnement.",
      feature: "Premium-Features"
    }
  };

  const limitInfo = limitMessages[limitType] || limitMessages.general;

  const features = [
    "Unbegrenzte Einheiten",
    "Unbegrenzte CSV-Dateien",
    "Unbegrenzte Abgleiche",
    "KI-Funktionen",
    "Alle Premium-Features"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">{limitInfo.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-600 mb-6">{limitInfo.message}</p>

          {/* Pricing Card */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-slate-900">10€</span>
              <span className="text-slate-600">/Monat</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Plan</h3>
            
            <ul className="space-y-2 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                navigate("/pricing");
                onClose();
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Jetzt upgraden
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Kündigen Sie jederzeit ohne Gebühren.
          </p>
        </div>
      </div>
    </div>
  );
}

