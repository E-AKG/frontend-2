import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Button from './Button';
import { TrendingUp, Loader2, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

export default function PaymentMatchingButton({ onMatchComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axiosInstance.post('/api/charges/match');
      setResult(response.data);
      
      if (onMatchComplete) {
        onMatchComplete(response.data);
      }
    } catch (err) {
      console.error('Fehler beim Matching:', err);
      setError(err.response?.data?.detail || 'Fehler beim Abgleich');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleMatch}
        disabled={loading}
        className="w-full px-5 py-3 rounded-xl border-2 border-purple-600 bg-transparent text-purple-700 font-semibold transition-all duration-200 hover:bg-purple-50 hover:text-gray-900 hover:border-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin group-hover:text-gray-900" />
            <span>Führe Abgleich durch...</span>
          </>
        ) : (
          <>
            <TrendingUp className="w-5 h-5 group-hover:text-gray-900 transition-colors" />
            <span className="group-hover:text-gray-900 transition-colors">Abgleich starten</span>
          </>
        )}
      </button>

      {result && (
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-5">
          <div className="flex items-start mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 mb-3 text-base">Abgleich erfolgreich</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  <span className="text-sm font-semibold text-emerald-900">{result.stats.matched} Zahlungen zugeordnet</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-amber-900">{result.stats.open} Zahlungen offen</span>
                </div>
                {result.stats.overdue > 0 && (
                  <div className="flex items-center gap-2.5 p-2 bg-white/60 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-red-900">{result.stats.overdue} Zahlungen überfällig</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-emerald-300">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Verarbeitet: {result.stats.total_charges} Sollstellungen • {result.stats.total_transactions} Transaktionen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}