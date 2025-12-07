import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Button from "../components/Button";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [nachricht, setNachricht] = useState("E-Mail wird verifiziert...");
  const [erfolg, setErfolg] = useState(null);

  useEffect(() => {
    if (token) {
      axiosInstance
        .get(`/auth/verify?token=${token}`)
        .then(() => {
          setNachricht("E-Mail erfolgreich verifiziert. Sie können sich jetzt anmelden.");
          setErfolg(true);
        })
        .catch(() => {
          setNachricht("Der Verifizierungslink ist ungültig oder abgelaufen.");
          setErfolg(false);
        });
    } else {
      setNachricht("Der Verifizierungslink ist ungültig.");
      setErfolg(false);
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img 
              src="/logo.png" 
              alt="Immpire" 
              className="h-20 sm:h-24 md:h-28 w-auto mx-auto transition-all duration-200 hover:scale-105 object-contain"
              style={{ imageRendering: 'high-quality' }}
            />
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 text-center animate-scale-in">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
              erfolg === null
                ? "bg-gray-100"
                : erfolg
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                : "bg-gradient-to-br from-red-500 to-red-600"
            }`}
          >
            {erfolg === null && (
              <Loader2 className="w-10 h-10 text-gray-600 animate-spin" />
            )}
            {erfolg === true && (
              <CheckCircle2 className="w-10 h-10 text-white" />
            )}
            {erfolg === false && (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">E-Mail-Verifizierung</h2>
          
          {erfolg === null && (
            <p className="text-gray-600 font-medium">{nachricht}</p>
          )}

          {erfolg === true && (
            <>
              <p className="text-emerald-700 bg-emerald-50 border-2 border-emerald-200 p-4 rounded-xl mb-6 font-medium">
                {nachricht}
              </p>
              <Link to="/login">
                <Button icon={<ArrowRight className="w-5 h-5" />}>
                  Zum Login
                </Button>
              </Link>
            </>
          )}

          {erfolg === false && (
            <p className="text-red-700 bg-red-50 border-2 border-red-200 p-4 rounded-xl font-medium">
              {nachricht}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
