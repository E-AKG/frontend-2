import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import { Mail, Lock, UserPlus, CheckCircle2, ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formDaten, setFormDaten] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [fehler, setFehler] = useState("");
  const [erfolg, setErfolg] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFehler("");

    if (formDaten.password !== formDaten.passwordConfirm) {
      setFehler("Passwörter stimmen nicht überein");
      return;
    }

    if (formDaten.password.length < 8) {
      setFehler("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    // Check password length in bytes (bcrypt limit is 72 bytes)
    const passwordBytes = new TextEncoder().encode(formDaten.password).length;
    if (passwordBytes > 72) {
      setFehler("Passwort ist zu lang. Bitte verwenden Sie maximal 72 Zeichen.");
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/auth/register", {
        email: formDaten.email,
        password: formDaten.password,
      });
      setErfolg(true);
    } catch (error) {
      setFehler(
        error.response?.data?.detail ||
          "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  if (erfolg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Registrierung erfolgreich!
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wir haben Ihnen eine E-Mail mit einem Bestätigungslink gesendet. Bitte
              überprüfen Sie Ihren Posteingang.
            </p>
            <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Wichtig:</strong> Falls Sie die E-Mail nicht finden, überprüfen Sie bitte auch Ihren <strong>Spam-Ordner</strong>.
                </span>
              </p>
            </div>
            <Button 
              onClick={() => navigate("/login")} 
              className="w-full"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Zum Login
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Nach der Anmeldung können Sie die Testversion kostenlos nutzen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Konto erstellen</h1>
          <p className="text-sm text-gray-500">
            Starten Sie Ihre kostenlose Testversion
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrierung</h2>
          
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
            />

            <Formularfeld
              label="Passwort"
              type="password"
              name="password"
              value={formDaten.password}
              onChange={(e) => setFormDaten({ ...formDaten, password: e.target.value })}
              placeholder="Mindestens 8 Zeichen, maximal 72 Zeichen"
              required
              maxLength={72}
              icon={<Lock className="w-5 h-5" />}
            />

            <Formularfeld
              label="Passwort bestätigen"
              type="password"
              name="passwordConfirm"
              value={formDaten.passwordConfirm}
              onChange={(e) =>
                setFormDaten({ ...formDaten, passwordConfirm: e.target.value })
              }
              placeholder="Passwort wiederholen"
              required
              icon={<Lock className="w-5 h-5" />}
            />

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={loading}
              icon={!loading && <UserPlus className="w-5 h-5" />}
            >
              {loading ? "Registrierung läuft..." : "Konto erstellen"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Bereits ein Konto?{" "}
              <Link to="/login" className="text-slate-900 font-bold hover:text-primary-600 hover:underline transition-colors">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2025 Immpire. Alle Rechte vorbehalten.
        </p>
      </div>
    </div>
  );
}
