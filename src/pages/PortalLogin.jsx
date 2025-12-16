import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import { Mail, Lock, LogIn, Building2, UserPlus } from "lucide-react";

/**
 * Portal-Login für Mieter
 * Separate Login-Seite für Mieterportal (nicht Admin)
 */
export default function PortalLogin() {
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("portal_access_token");
    if (token) {
      navigate("/portal/dashboard", { replace: true });
    }
  }, [navigate]);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formDaten, setFormDaten] = useState({ email: "", password: "", confirmPassword: "" });
  const [fehler, setFehler] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFehler("");
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Registrierung
        if (formDaten.password !== formDaten.confirmPassword) {
          setFehler("Die Passwörter stimmen nicht überein.");
          setLoading(false);
          return;
        }

        if (formDaten.password.length < 8) {
          setFehler("Das Passwort muss mindestens 8 Zeichen lang sein.");
          setLoading(false);
          return;
        }

        const response = await axiosInstance.post("/auth/portal/register", {
          email: formDaten.email,
          password: formDaten.password,
        });

        // Registrierung erfolgreich - jetzt einloggen
        setFehler("");
        setIsRegisterMode(false);
        alert("Registrierung erfolgreich! Sie können sich jetzt einloggen.");
        setFormDaten({ email: formDaten.email, password: "", confirmPassword: "" });
        setLoading(false);
      } else {
        // Login
        const response = await axiosInstance.post("/auth/portal/login", {
          email: formDaten.email,
          password: formDaten.password,
        });
        
        const accessToken = response.data?.access_token || 
                          response.data?.accessToken || 
                          null;
        
        if (!accessToken) {
          throw new Error("Kein Zugriffstoken erhalten");
        }
        
        // Speichere Portal-Token separat
        localStorage.setItem("portal_access_token", accessToken);
        localStorage.setItem("portal_user_email", formDaten.email);
        
        // Navigate to portal dashboard
        navigate("/portal/dashboard");
      }
      
    } catch (error) {
      console.error(`❌ Portal-${isRegisterMode ? 'Registrierung' : 'Login'}-Fehler:`, error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          `${isRegisterMode ? 'Registrierung' : 'Anmeldung'} fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.`;
      setFehler(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mieterportal</h1>
          <p className="text-slate-600">Betriebskostenabrechnungen einsehen</p>
        </div>

        {/* Toggle zwischen Login und Registrierung */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setFehler("");
              setFormDaten({ email: formDaten.email, password: "", confirmPassword: "" });
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !isRegisterMode
                ? "bg-cyan-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setFehler("");
              setFormDaten({ email: formDaten.email, password: "", confirmPassword: "" });
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRegisterMode
                ? "bg-cyan-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Login/Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {fehler && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {fehler}
              </div>
            )}

            {isRegisterMode && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold mb-1">Hinweis zur Registrierung:</p>
                <p>Ihre E-Mail-Adresse muss bereits im System als Mieter registriert sein. Falls Sie keine E-Mail von Ihrem Vermieter erhalten haben, kontaktieren Sie bitte Ihren Vermieter.</p>
              </div>
            )}

            <Formularfeld
              label="E-Mail-Adresse"
              type="email"
              name="email"
              value={formDaten.email}
              onChange={(e) => setFormDaten({ ...formDaten, email: e.target.value })}
              required
              icon={<Mail className="w-5 h-5 text-slate-400" />}
            />

            <Formularfeld
              label="Passwort"
              type="password"
              name="password"
              value={formDaten.password}
              onChange={(e) => setFormDaten({ ...formDaten, password: e.target.value })}
              required
              icon={<Lock className="w-5 h-5 text-slate-400" />}
              helpText={isRegisterMode ? "Mindestens 8 Zeichen" : undefined}
            />

            {isRegisterMode && (
              <Formularfeld
                label="Passwort bestätigen"
                type="password"
                name="confirmPassword"
                value={formDaten.confirmPassword}
                onChange={(e) => setFormDaten({ ...formDaten, confirmPassword: e.target.value })}
                required
                icon={<Lock className="w-5 h-5 text-slate-400" />}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isRegisterMode ? "Registrierung läuft..." : "Anmeldung läuft..."}
                </>
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Registrieren
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Anmelden
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Probleme beim Anmelden?{" "}
              <a href="mailto:support@immpire.com" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Kontaktieren Sie uns
              </a>
            </p>
          </div>
        </div>

        {/* Back to Admin Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Zur Admin-Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}

