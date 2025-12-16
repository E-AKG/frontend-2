import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { bankApi } from "../api/bankApi";
import {
  CreditCard,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/formatting";

export default function ManuelleBuchungen() {
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

  // Lade manuelle Buchungen
  const { data: manualData, isLoading: loadingManual } = useQuery({
    queryKey: ["manual-transactions", selectedClient?.id],
    queryFn: async () => {
      const response = await bankApi.getManualTransactions({
        page: 1,
        page_size: 50,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });


  // Delete Transaction Mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId) => {
      return await bankApi.deleteTransaction(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["unmatched-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      queryClient.invalidateQueries({ queryKey: ["billRuns"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      alert("Manuelle Buchung erfolgreich gelöscht");
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm("Möchten Sie diese manuelle Buchung wirklich löschen?")) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Bitte wählen Sie einen Mandanten aus.
      </div>
    );
  }

  const manualTransactions = manualData?.items || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header - Einheitlich mit anderen Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary-600" />
            Manuelle Buchungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manuell erfasste Transaktionen verwalten
          </p>
        </div>
        <Button
          onClick={() => setShowManualPaymentModal(true)}
          variant="primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Buchung
        </Button>
      </div>

      {/* Manuelle Buchungen - Einheitliches Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Übersicht
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Alle manuell erfassten Buchungen
            </p>
          </div>
          {loadingManual ? (
            <div className="p-12 text-center text-gray-500">Lade manuelle Buchungen...</div>
          ) : manualTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Noch keine manuellen Buchungen vorhanden
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {manualTransactions.map((transaction) => (
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
                        {transaction.is_matched && (
                          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                            Zugeordnet
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(transaction.transaction_date)}
                        </div>
                        {transaction.purpose && (
                          <div className="flex items-center gap-1">
                            <span>{transaction.purpose}</span>
                          </div>
                        )}
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
                        {transaction.is_matched && transaction.matched_amount > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(transaction.matched_amount)} zugeordnet
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manuelle Buchung Modal */}
      {showManualPaymentModal && (
        <ManualPaymentModal
          isOpen={showManualPaymentModal}
          onClose={() => setShowManualPaymentModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["manual-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["charges"] });
            queryClient.invalidateQueries({ queryKey: ["billRuns"] });
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
    purpose: "", // Verwendungszweck
    counterpart_name: "", // Name des Zahlers
    counterpart_iban: "", // IBAN des Zahlers
    notes: "", // Zusätzliche Notizen
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      // Erstelle manuelle Transaktion mit allen Feldern
      const transaction = await bankApi.createTransaction({
        bank_account_id: null, // Manuelle Buchung (wird im Backend zu Standard-Konto)
        transaction_date: data.date,
        amount: parseFloat(data.amount),
        purpose: data.purpose || undefined, // Verwendungszweck
        counterpart_name: data.counterpart_name || undefined, // Name
        counterpart_iban: data.counterpart_iban || undefined, // IBAN
        description: data.notes || undefined, // Notizen als description
      });
      return transaction;
    },
    onSuccess: () => {
      onSuccess();
      // Reset form
      setFormData({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        purpose: "",
        counterpart_name: "",
        counterpart_iban: "",
        notes: "",
      });
      alert("Manuelle Buchung erfolgreich erstellt");
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
            Name des Zahlers
          </label>
          <input
            type="text"
            value={formData.counterpart_name}
            onChange={(e) => setFormData({ ...formData, counterpart_name: e.target.value })}
            placeholder="z.B. Max Mustermann"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IBAN des Zahlers
          </label>
          <input
            type="text"
            value={formData.counterpart_iban}
            onChange={(e) => setFormData({ ...formData, counterpart_iban: e.target.value })}
            placeholder="DE89 3704 0044 0532 0130 00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Verwendungszweck <span className="text-gray-500">(wichtig für Abgleich!)</span>
          </label>
          <input
            type="text"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="z.B. Miete Oßmann, Miete Dezember 2024"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Der Verwendungszweck wird für den automatischen Abgleich mit Sollstellungen verwendet.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zusätzliche Notizen (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Interne Notizen zu dieser Buchung..."
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

