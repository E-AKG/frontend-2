import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import Button from "../components/Button";
import { subscriptionApi } from "../api/subscriptionApi";

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate("/register");
      return;
    }

    setLoading(true);
    try {
      const frontendUrl = window.location.origin;
      const response = await subscriptionApi.createCheckout({
        plan_name: "Basic",
        price_per_month: 1000, // 10 EUR in cents
        success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/pricing`,
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Fehler beim Erstellen der Checkout-Session. Bitte versuchen Sie es erneut.");
      setLoading(false);
    }
  };

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
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
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
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/einstellungen")}
                  className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Einstellungen
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Anmelden
                  </button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-slate-900 hover:bg-slate-800 text-white border-0"
                  >
                    Registrieren
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Einfache, transparente Preise
          </h1>
          <p className="text-xl text-slate-600">
            Wählen Sie den Plan, der zu Ihnen passt. Alle Pläne können jederzeit gekündigt werden.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
            {/* Popular Badge */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-center py-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Empfohlener Plan</span>
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic Plan</h2>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">10€</span>
                <span className="text-slate-600">/Monat</span>
              </div>
              <p className="text-slate-600 mb-8">
                Perfekt für kleine bis mittlere Hausverwaltungen
              </p>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-slate-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                size="lg"
                className="w-full justify-center bg-slate-900 hover:bg-slate-800 text-white"
              >
                {loading ? (
                  "Wird geladen..."
                ) : isAuthenticated ? (
                  <>
                    Jetzt abonnieren
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Registrieren und abonnieren
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-slate-500 text-center mt-4">
                  Sie haben bereits ein Konto?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-slate-900 font-semibold hover:underline"
                  >
                    Anmelden
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-slate-50 rounded-xl p-8">
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
