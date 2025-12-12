import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { bankApi } from "../api/bankApi";
import {
  CreditCard,
  CheckCircle,
  X,
  Search,
  AlertCircle,
  TrendingUp,
  Euro,
  Calendar,
  User,
  Building2,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/formatting";

export default function Zahlungsabgleich() {
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [filterMatched, setFilterMatched] = useState(false);

  // Lade unzugeordnete Transaktionen
  const { data: unmatchedData, isLoading: loadingUnmatched } = useQuery({
    queryKey: ["unmatched-transactions", selectedClient?.id, filterMatched],
    queryFn: async () => {
      const response = await bankApi.getUnmatchedTransactions({
        page: 1,
        page_size: 50,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  // Lade Match-Vorschläge für ausgewählte Transaktion
  const { data: suggestionsData } = useQuery({
    queryKey: ["match-suggestions", selectedTransaction?.id],
    queryFn: async () => {
      const response = await bankApi.getMatchSuggestions(selectedTransaction.id);
      return response.data;
    },
    enabled: !!selectedTransaction && showMatchModal,
  });

  // Auto-Match Mutation
  const autoMatchMutation = useMutation({
    mutationFn: async () => {
      return await bankApi.triggerAutoMatchAll(null, 80);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unmatched-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      alert("Automatischer Abgleich gestartet");
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Manual Match Mutation
  const manualMatchMutation = useMutation({
    mutationFn: async ({ transactionId, chargeId, matchedAmount, note }) => {
      return await bankApi.manualMatch(transactionId, chargeId, matchedAmount, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unmatched-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["match-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowMatchModal(false);
      setSelectedTransaction(null);
      alert("Zahlung erfolgreich zugeordnet");
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  const handleMatchClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowMatchModal(true);
  };

  const handleManualMatch = (chargeId, matchedAmount, note) => {
    if (!selectedTransaction) return;
    manualMatchMutation.mutate({
      transactionId: selectedTransaction.id,
      chargeId,
      matchedAmount,
      note,
    });
  };

  if (!selectedClient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Bitte wählen Sie einen Mandanten aus.
      </div>
    );
  }

  const transactions = unmatchedData?.transactions || [];
  const suggestions = suggestionsData?.suggestions || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Zahlungsabgleich
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Transaktionen zuordnen und Zahlungen buchen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowManualPaymentModal(true)}
            variant="secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Manuelle Buchung
          </Button>
          <Button
            onClick={() => autoMatchMutation.mutate()}
            variant="primary"
            disabled={autoMatchMutation.isPending}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {autoMatchMutation.isPending ? "Läuft..." : "Auto-Abgleich"}
          </Button>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Unzugeordnet
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {transactions.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Gesamtbetrag
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(
              transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Vorschläge verfügbar
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {suggestions.length}
          </div>
        </div>
      </div>

      {/* Transaktionen-Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Unzugeordnete Transaktionen
          </h2>
        </div>
        {loadingUnmatched ? (
          <div className="p-12 text-center text-gray-500">Lade Transaktionen...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <p className="text-gray-600 dark:text-gray-400">
              Alle Transaktionen sind zugeordnet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {transaction.counterpart_name || "Unbekannt"}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.purpose || transaction.description || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(transaction.transaction_date)}
                      </div>
                      {transaction.counterpart_iban && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {transaction.counterpart_iban}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-xl font-bold ${
                          transaction.amount >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      {transaction.matched_amount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(transaction.matched_amount)} zugeordnet
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleMatchClick(transaction)}
                      variant="primary"
                      size="sm"
                    >
                      Zuordnen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match-Modal */}
      {showMatchModal && selectedTransaction && (
        <Modal
          isOpen={showMatchModal}
          titel={`Zahlung zuordnen: ${formatCurrency(Math.abs(selectedTransaction.amount))}`}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedTransaction(null);
          }}
          groesse="lg"
        >
          <div className="space-y-4">
            {/* Transaktions-Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Datum:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedTransaction.transaction_date)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Betrag:</span>
                  <span className="ml-2 font-bold text-gray-900 dark:text-white">
                    {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Verwendungszweck:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedTransaction.purpose || selectedTransaction.description || "—"}
                  </span>
                </div>
                {selectedTransaction.counterpart_name && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Von:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedTransaction.counterpart_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Match-Vorschläge */}
            {suggestions.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Vorschläge ({suggestions.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() =>
                        handleManualMatch(
                          suggestion.charge_id,
                          suggestion.matched_amount || Math.abs(selectedTransaction.amount),
                          `Auto-Match (${suggestion.confidence.toFixed(1)}% Übereinstimmung)`
                        )
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {suggestion.tenant_name || "Unbekannt"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                suggestion.confidence >= 80
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : suggestion.confidence >= 60
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {suggestion.confidence.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.unit_label || suggestion.property_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Fällig: {formatDate(suggestion.due_date)} | Offen:{" "}
                            {formatCurrency(suggestion.open_amount)}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(suggestion.matched_amount || Math.abs(selectedTransaction.amount))}
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 mt-1 mx-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Keine automatischen Vorschläge gefunden</p>
                <p className="text-sm mt-1">
                  Bitte verwenden Sie die manuelle Buchung
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Manuelle Buchung Modal */}
      {showManualPaymentModal && (
        <ManualPaymentModal
          isOpen={showManualPaymentModal}
          onClose={() => setShowManualPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["unmatched-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setShowManualPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}

// Manuelle Buchung Modal Component
function ManualPaymentModal({ isOpen, onClose, onSuccess }) {
  const { selectedClient } = useApp();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    tenant_id: "",
    charge_id: "",
    purpose: "",
    notes: "",
  });

  // Lade offene Posten für Auswahl
  const { data: openCharges } = useQuery({
    queryKey: ["open-charges", selectedClient?.id],
    queryFn: async () => {
      const response = await bankApi.listTransactions({ is_matched: false });
      // TODO: Lade offene Charges statt Transaktionen
      return { charges: [] };
    },
    enabled: !!selectedClient && isOpen,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      // Erstelle Transaktion und Match
      const transaction = await bankApi.createTransaction({
        bank_account_id: null, // Manuelle Buchung
        transaction_date: data.date,
        amount: parseFloat(data.amount),
        purpose: data.purpose,
        description: data.notes,
      });
      if (data.charge_id) {
        await bankApi.manualMatch(
          transaction.data.id,
          data.charge_id,
          parseFloat(data.amount),
          data.notes
        );
      }
      return transaction;
    },
    onSuccess: () => {
      onSuccess();
      alert("Zahlung erfolgreich gebucht");
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} titel="Manuelle Buchung" onClose={onClose} groesse="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPaymentMutation.mutate(formData);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Betrag (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Datum
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Verwendungszweck
          </label>
          <input
            type="text"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notizen
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" variant="primary" disabled={createPaymentMutation.isPending}>
            Buchen
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Modal>
  );
}

