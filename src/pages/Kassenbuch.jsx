import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { cashbookApi } from "../api/cashbookApi";
import { tenantApi } from "../api/tenantApi";
import { Plus, Euro, TrendingUp, TrendingDown, Calendar, FileText, Trash2, Wallet } from "lucide-react";
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
    tenant_id: "", // Optional: Mieter zuordnen für besseren Abgleich
  });

  // Lade Mieter für Dropdown
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", selectedClient?.id],
    queryFn: async () => {
      const response = await tenantApi.list({ page_size: 100 });
      return response.data.items || [];
    },
    enabled: !!selectedClient,
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
        tenant_id: "",
      });
    },
  });

  // Mutation: Eintrag löschen
  const deleteMutation = useMutation({
    mutationFn: async (entryId) => {
      return cashbookApi.delete(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["cashbook"]);
      queryClient.invalidateQueries(["cashbookBalance"]);
      queryClient.invalidateQueries(["billRuns"]); // Aktualisiere auch Sollstellungen falls Charge betroffen
      queryClient.invalidateQueries(["charges"]);
    },
    onError: (error) => {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen des Eintrags");
    },
  });

  const handleDelete = (entryId) => {
    if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      deleteMutation.mutate(entryId);
    }
  };

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
    <div className="p-6 space-y-6">
      {/* Header - Einheitlich mit anderen Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary-600" />
            Kassenbuch
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Verwaltung von Barzahlungen
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neue Buchung
        </Button>
      </div>

      {/* Kassenstand-Karten - Einheitliches Design */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Einträge-Tabelle - Einheitliches Design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Übersicht
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Alle Kassenbuch-Einträge
          </p>
        </div>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Lade...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Löschen"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Löschen
                      </button>
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
                Mieter (optional)
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Keine Zuordnung</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Tipp: Mieter zuordnen verbessert den automatischen Abgleich mit Sollbuchungen
              </p>
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
                placeholder="z.B. Miete Mai 2025 oder Miete Max Mustermann Wohnung 1a"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💡 Tipp: Geben Sie den Mieter-Namen oder die Einheit an, um die Zuordnung zu erleichtern
              </p>
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

