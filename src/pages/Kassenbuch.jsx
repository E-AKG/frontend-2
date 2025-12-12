import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { cashbookApi } from "../api/cashbookApi";
import { Plus, Euro, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/formatting";

export default function Kassenbuch() {
  const queryClient = useQueryClient();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    entry_type: "income",
    amount: "",
    purpose: "",
  });

  // Lade Kassenbuch-Einträge
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["cashbook", selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      const response = await cashbookApi.list({
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data || [];
    },
    enabled: !!selectedClient,
  });

  // Lade Kassenstand
  const { data: balance } = useQuery({
    queryKey: ["cashbookBalance", selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      const response = await cashbookApi.getBalance({
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  // Mutation: Neuer Eintrag
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return cashbookApi.create(data, {
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["cashbook"]);
      queryClient.invalidateQueries(["cashbookBalance"]);
      setShowAddModal(false);
      setFormData({
        entry_date: new Date().toISOString().split("T")[0],
        entry_type: "income",
        amount: "",
        purpose: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!selectedClient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Bitte wählen Sie einen Mandanten aus.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kassenbuch</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Verwaltung von Barzahlungen
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Neue Buchung
        </Button>
      </div>

      {/* Kassenstand-Karten */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Anfangsbestand</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(balance.opening_balance)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Einzahlungen
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(balance.total_income)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Auszahlungen
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(balance.total_expenses)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 border-2 border-primary-500">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kassenstand</div>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(balance.current_balance)}
            </div>
          </div>
        </div>
      )}

      {/* Einträge-Tabelle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Art
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verwendungszweck
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Lade...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Keine Einträge vorhanden
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.entry_type === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {entry.entry_type === "income" ? "Einzahlung" : "Auszahlung"}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        entry.entry_type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {entry.entry_type === "income" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.purpose || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Neuer Eintrag */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          titel="Neue Kassenbuch-Buchung"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Datum
              </label>
              <input
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Art
              </label>
              <select
                value={formData.entry_type}
                onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="income">Einzahlung</option>
                <option value="expense">Auszahlung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Betrag
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verwendungszweck
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                rows="3"
                placeholder="z.B. Miete Mai 2025"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? "Speichere..." : "Speichern"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

