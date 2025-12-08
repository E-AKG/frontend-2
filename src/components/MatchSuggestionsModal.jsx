import { useState, useEffect } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { bankApi } from "../api/bankApi";

export default function MatchSuggestionsModal({ transaction, isOpen, onClose, onMatch }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen && transaction) {
      loadSuggestions();
    }
  }, [isOpen, transaction]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await bankApi.getMatchSuggestions(transaction.id);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Fehler beim Laden der Vorschläge:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedSuggestion) return;

    try {
      await bankApi.manualMatch(
        transaction.id,
        selectedSuggestion.charge_id,
        selectedSuggestion.matched_amount,
        note || `Manuell zugeordnet (Score: ${selectedSuggestion.confidence_score}%)`
      );
      onMatch();
      onClose();
    } catch (error) {
      console.error("Fehler beim Zuordnen:", error);
      alert("Fehler beim Zuordnen: " + (error.response?.data?.detail || error.message));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-orange-600 bg-orange-50";
  };

  const getScoreBorderColor = (score) => {
    if (score >= 80) return "border-green-300";
    if (score >= 60) return "border-amber-300";
    return "border-orange-300";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} titel="Match-Vorschläge" size="lg">
      {transaction && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Transaktion</div>
              <div className="font-bold text-2xl text-green-600 mb-2">
                {parseFloat(transaction.amount).toFixed(2)} €
              </div>
              <div className="text-sm text-slate-700">
                {transaction.counterpart_name || "—"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(transaction.transaction_date).toLocaleDateString("de-DE")}
              </div>
              {transaction.purpose && (
                <div className="text-xs text-slate-600 mt-2 p-2 bg-white rounded border border-slate-100">
                  💬 {transaction.purpose}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Analysiere Vorschläge...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-600 text-lg font-medium mb-2">
            Keine passenden Vorschläge gefunden
          </p>
          <p className="text-sm text-slate-500">
            Es gibt keine offenen Sollbuchungen, die zu dieser Transaktion passen.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{suggestions.length}</span> passende
              Sollbuchung{suggestions.length !== 1 ? "en" : ""} gefunden
            </p>
            <div className="text-xs text-slate-500">Sortiert nach Confidence-Score</div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.charge_id}
                onClick={() => setSelectedSuggestion(suggestion)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedSuggestion?.charge_id === suggestion.charge_id
                    ? `${getScoreBorderColor(suggestion.confidence_score)} bg-blue-50`
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-slate-900">
                        {suggestion.tenant_name}
                      </span>
                      {suggestion.unit_label && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {suggestion.unit_label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      Fällig: {new Date(suggestion.due_date).toLocaleDateString("de-DE")}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Soll: {suggestion.charge_amount.toFixed(2)} € • Offen:{" "}
                      {suggestion.charge_remaining.toFixed(2)} €
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getScoreColor(
                      suggestion.confidence_score
                    )}`}
                  >
                    {suggestion.confidence_score}%
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-100">
                  {[
                    { key: "iban", label: "IBAN", icon: "🆔" },
                    { key: "name", label: "Name", icon: "👤" },
                    { key: "amount", label: "Betrag", icon: "💶" },
                    { key: "date", label: "Datum", icon: "📅" },
                    { key: "purpose", label: "Zweck", icon: "💬" },
                  ].map((item) => (
                    <div key={item.key} className="text-center">
                      <div className="text-xs text-slate-400 mb-1">{item.icon}</div>
                      <div
                        className={`text-xs font-medium ${
                          suggestion.score_breakdown[item.key] > 0
                            ? "text-green-600"
                            : "text-slate-300"
                        }`}
                      >
                        {suggestion.score_breakdown[item.key]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Details */}
                {suggestion.details && suggestion.details.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 space-y-1">
                      {suggestion.details.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notiz-Feld */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Optionale Notiz
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Teilzahlung für November"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Aktions-Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={handleMatch}
              disabled={!selectedSuggestion}
              className={
                !selectedSuggestion
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              Zuordnen
              {selectedSuggestion &&
                ` (${selectedSuggestion.matched_amount.toFixed(2)} €)`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

