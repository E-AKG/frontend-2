import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import { Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);
  const [formDaten, setFormDaten] = useState({ email: "", password: "" });
  const [fehler, setFehler] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFehler("");
    setLoading(true);

    try {
      console.log("🔐 Login-Versuch für:", formDaten.email);
      console.log("📡 API URL:", import.meta.env.VITE_API_URL || "http://localhost:8000");
      console.log("📤 Sende Request an:", `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/login`);
      
      const response = await axiosInstance.post("/auth/login", formDaten);
      
      console.log("✅ Login erfolgreich - Response Status:", response.status);
      console.log("✅ Response Headers:", response.headers);
      console.log("✅ Response Data:", response.data);
      console.log("✅ Response Data Type:", typeof response.data);
      console.log("✅ Response Data Keys:", response.data ? Object.keys(response.data) : "null");
      
      // Prüfe verschiedene mögliche Response-Strukturen
      const accessToken = response.data?.access_token || 
                        response.data?.accessToken || 
                        response.access_token ||
                        null;
      
      console.log("🔑 Access Token erhalten:", accessToken ? "Ja" : "Nein");
      console.log("🔑 Access Token Wert:", accessToken ? accessToken.substring(0, 20) + "..." : "null");
      
      // Prüfe ob access_token vorhanden ist
      if (!accessToken) {
        console.error("❌ Kein access_token in Response gefunden");
        console.error("❌ Response.data:", JSON.stringify(response.data, null, 2));
        throw new Error("Kein Zugriffstoken erhalten. Response: " + JSON.stringify(response.data));
      }
      
      // Speichere Token
      console.log("💾 Speichere Token in localStorage...");
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("user_email", formDaten.email);
      
      // Verifiziere dass Token gespeichert wurde
      const savedToken = localStorage.getItem("access_token");
      console.log("✅ Token gespeichert:", savedToken ? savedToken.substring(0, 20) + "..." : "FEHLER");
      
      if (!savedToken) {
        throw new Error("Token konnte nicht in localStorage gespeichert werden");
      }
      
      console.log("✅ Token gespeichert, navigiere zu Dashboard");
      
      // Verwende setTimeout für Navigation, falls React Router Probleme hat
      setTimeout(() => {
        console.log("🚀 Navigiere zu /dashboard");
        navigate("/dashboard");
      }, 100);
      
    } catch (error) {
      console.error("❌ Login-Fehler:", error);
      console.error("❌ Error Type:", error.constructor.name);
      console.error("❌ Error Message:", error.message);
      console.error("❌ Error Stack:", error.stack);
      console.error("❌ Error Response:", error.response);
      console.error("❌ Error Response Data:", error.response?.data);
      console.error("❌ Error Response Status:", error.response?.status);
      console.error("❌ Error Response Headers:", error.response?.headers);
      
      // Prüfe ob es ein Netzwerk-Fehler ist
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setFehler("Netzwerkfehler: Kann Backend nicht erreichen. Prüfe ob Backend läuft.");
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.message || 
                            "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.";
        setFehler(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-6">
            <img 
              src="/logo.png" 
              alt="Immpire" 
              className="h-20 sm:h-24 md:h-28 w-auto mx-auto transition-all duration-200 hover:scale-105 object-contain"
              style={{ imageRendering: 'high-quality' }}
            />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Willkommen zurück</h1>
          <p className="text-sm text-slate-600">
            Professionelle Hausverwaltung
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Anmelden</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {fehler && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-fade-in">
                <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {fehler}
                </p>
              </div>
            )}

            <Formularfeld
              label="E-Mail-Adresse"
              type="email"
              name="email"
              value={formDaten.email}
              onChange={(e) => setFormDaten({ ...formDaten, email: e.target.value })}
              placeholder="ihre.email@beispiel.de"
              required
              icon={<Mail className="w-5 h-5" />}
              error={fehler && fehler.includes("E-Mail") ? fehler : null}
            />

            <Formularfeld
              label="Passwort"
              type="password"
              name="password"
              value={formDaten.password}
              onChange={(e) => setFormDaten({ ...formDaten, password: e.target.value })}
              placeholder="Ihr Passwort"
              required
              icon={<Lock className="w-5 h-5" />}
            />

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={loading}
              icon={!loading && <LogIn className="w-5 h-5" />}
            >
              {loading ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Noch kein Konto?{" "}
              <Link to="/register" className="text-slate-900 font-semibold hover:text-slate-700 hover:underline transition-colors">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          © 2025 Immpire. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}
