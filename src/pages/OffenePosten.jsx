import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { statsApi } from "../api/statsApi";
import { Filter, Search, AlertCircle, Clock, Euro, User, Building2, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatting";
import Modal from "../components/Modal";

export default function OffenePosten() {
  const navigate = useNavigate();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, open, overdue, paid
  const [filterDays, setFilterDays] = useState("all"); // all, 30, 60, 90
  const [selectedCharge, setSelectedCharge] = useState(null);

  // Lade Offene Posten
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard", new Date().getMonth() + 1, new Date().getFullYear(), selectedClient?.id],
    queryFn: async () => {
      const response = await statsApi.getDashboard({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  const openCharges = dashboardData?.open_charges || [];

  // Filtere Offene Posten
  const filteredCharges = openCharges.filter((charge) => {
    // Status-Filter
    if (filterStatus === "overdue" && charge.status !== "overdue") return false;
    if (filterStatus === "open" && charge.status === "overdue") return false;
    if (filterStatus === "paid" && charge.offen > 0) return false;

    // Tage-Filter
    if (filterDays !== "all") {
      const daysDiff = Math.floor(
        (new Date() - new Date(charge.faellig)) / (1000 * 60 * 60 * 24)
      );
      if (filterDays === "30" && daysDiff < 30) return false;
      if (filterDays === "60" && daysDiff < 60) return false;
      if (filterDays === "90" && daysDiff < 90) return false;
    }

    // Suche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        charge.mieter?.toLowerCase().includes(query) ||
        charge.einheit?.toLowerCase().includes(query) ||
        charge.objekt?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Statistiken
  const stats = {
    total: filteredCharges.length,
    totalAmount: filteredCharges.reduce((sum, c) => sum + (c.offen || 0), 0),
    overdue: filteredCharges.filter((c) => c.status === "overdue").length,
    overdueAmount: filteredCharges
      .filter((c) => c.status === "overdue")
      .reduce((sum, c) => sum + (c.offen || 0), 0),
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offene Posten</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Übersicht über alle offenen Forderungen
          </p>
        </div>
        <button
          onClick={() => navigate("/finanzen")}
          className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Zur Finanzübersicht →
        </button>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gesamt offen</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatCurrency(stats.totalAmount)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 border-2 border-red-200 dark:border-red-900">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Überfällig
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.overdue}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatCurrency(stats.overdueAmount)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{'>'}30 Tage</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredCharges.filter((c) => {
              const daysDiff = Math.floor(
                (new Date() - new Date(c.faellig)) / (1000 * 60 * 60 * 24)
              );
              return daysDiff > 30;
            }).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{'>'}60 Tage</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredCharges.filter((c) => {
              const daysDiff = Math.floor(
                (new Date() - new Date(c.faellig)) / (1000 * 60 * 60 * 24)
              );
              return daysDiff > 60;
            }).length}
          </div>
        </div>
      </div>

      {/* Filter & Suche */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nach Mieter, Einheit oder Objekt suchen..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Alle Status</option>
          <option value="overdue">Nur überfällig</option>
          <option value="open">Nur offen</option>
          <option value="paid">Bezahlt</option>
        </select>
        <select
          value={filterDays}
          onChange={(e) => setFilterDays(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Alle Zeiträume</option>
          <option value="30">{'>'}30 Tage</option>
          <option value="60">{'>'}60 Tage</option>
          <option value="90">{'>'}90 Tage</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Lade offene Posten...</div>
        ) : filteredCharges.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Keine offenen Posten gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCharges.map((charge) => {
              const daysDiff = Math.floor(
                (new Date() - new Date(charge.faellig)) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={charge.charge_id}
                  onClick={() => setSelectedCharge(charge)}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {charge.mieter}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            charge.status === "overdue"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {charge.status === "overdue" ? "Überfällig" : "Offen"}
                        </span>
                        {daysDiff > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {daysDiff} Tage überfällig
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {charge.objekt} - {charge.einheit}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Fällig: {formatDate(charge.faellig)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4" />
                          Soll: {formatCurrency(charge.betrag)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCurrency(charge.offen)}
                      </div>
                      {charge.betrag !== charge.offen && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Teilzahlung: {formatCurrency(charge.betrag - charge.offen)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Detailansicht */}
      {selectedCharge && (
        <Modal
          isOpen={!!selectedCharge}
          titel={`Offene Posten: ${selectedCharge.mieter}`}
          onClose={() => setSelectedCharge(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mieter
                </label>
                <p className="text-gray-900 dark:text-white">{selectedCharge.mieter}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objekt / Einheit
                </label>
                <p className="text-gray-900 dark:text-white">
                  {selectedCharge.objekt} - {selectedCharge.einheit}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fälligkeitsdatum
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(selectedCharge.faellig)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCharge.status === "overdue"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {selectedCharge.status === "overdue" ? "Überfällig" : "Offen"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sollbetrag
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatCurrency(selectedCharge.betrag)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Offener Betrag
                </label>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedCharge.offen)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  navigate(`/personen/${selectedCharge.tenant_id}`);
                  setSelectedCharge(null);
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Zum Mieter →
              </button>
              <button
                onClick={() => {
                  navigate("/finanzen?tab=reminders");
                  setSelectedCharge(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Mahnung erstellen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

