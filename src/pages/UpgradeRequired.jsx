import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Sparkles, Lock } from "lucide-react";
import Button from "../components/Button";

export default function UpgradeRequired() {
  const navigate = useNavigate();

  const features = [
    "Unbegrenzte Objekte und Einheiten",
    "Unbegrenzte Mieter",
    "Vertragsverwaltung",
    "Automatische Sollstellungen",
    "Bank-Integration",
    "E-Mail Support",
    "DSGVO-konform",
    "Regelmäßige Updates",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center group">
              <img 
                src="/logo.png" 
                alt="Immpire" 
                className="h-20 sm:h-24 md:h-28 w-auto transition-all duration-200 group-hover:scale-105 object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            </Link>
            <button
              onClick={() => navigate("/einstellungen")}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Einstellungen
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Icon & Title */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Abonnement erforderlich
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Um auf alle Funktionen von Immpire zugreifen zu können, benötigen Sie ein aktives Abonnement.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden mb-12">
            {/* Badge */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-center py-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Empfohlener Plan</span>
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Basic Plan</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">10€</span>
                    <span className="text-slate-600">/Monat</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button
                    onClick={() => navigate("/pricing")}
                    size="lg"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 text-lg font-semibold"
                  >
                    Jetzt abonnieren
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Im Preis enthalten:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <p className="text-slate-600 mb-2">
              <strong className="text-slate-900">Keine versteckten Kosten.</strong> Kündigen Sie jederzeit ohne Gebühren.
            </p>
            <p className="text-sm text-slate-500">
              Alle Zahlungen werden sicher über Stripe verarbeitet. Wir akzeptieren Kreditkarten und PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

