import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { statsApi } from "../api/statsApi";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Building2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import Button from "../components/Button";
import { formatCurrency, formatDate } from "../utils/formatting";

export default function Berichte() {
  const { selectedClient, selectedFiscalYear } = useApp();
  const [reportType, setReportType] = useState("income_expense");
  const [dateRange, setDateRange] = useState({
    start: selectedFiscalYear
      ? `${selectedFiscalYear.year}-01-01`
      : `${new Date().getFullYear()}-01-01`,
    end: selectedFiscalYear
      ? `${selectedFiscalYear.year}-12-31`
      : `${new Date().getFullYear()}-12-31`,
  });

  // Lade Berichtsdaten für den gewählten Zeitraum
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      "reports",
      selectedClient?.id,
      selectedFiscalYear?.id,
      dateRange.start,
      dateRange.end,
    ],
    queryFn: async () => {
      const response = await statsApi.getReports({
        start_date: dateRange.start,
        end_date: dateRange.end,
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  // Lade auch Dashboard-Stats für zusätzliche Daten (Leerstand, offene Posten)
  const { data: statsData } = useQuery({
    queryKey: [
      "dashboard-stats",
      selectedClient?.id,
      selectedFiscalYear?.id,
    ],
    queryFn: async () => {
      const endDate = new Date(dateRange.end);
      const response = await statsApi.getDashboard({
        month: endDate.getMonth() + 1,
        year: endDate.getFullYear(),
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  const handleExportCSV = () => {
    // TODO: CSV-Export implementieren
    alert("CSV-Export wird implementiert");
  };

  const handleExportDatev = () => {
    // TODO: DATEV-Export implementieren
    alert("DATEV-Export wird implementiert");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Berichte & Exporte</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Übersichten, Auswertungen und Exporte
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="secondary">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
          <Button onClick={handleExportDatev} variant="secondary">
            <FileText className="w-4 h-4 mr-2" />
            DATEV Export
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Berichtstyp
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="income_expense">Einnahmen-Überschuss</option>
              <option value="vacancy">Leerstand</option>
              <option value="open_items">Rückstände</option>
              <option value="rent_roll">Mietspiegel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Von
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Berichte */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Lade Berichte...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Einnahmen-Überschuss */}
          {reportType === "income_expense" && reportData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Einnahmen-Überschuss-Rechnung
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Einnahmen */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Einnahmen
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Mieteinnahmen</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(reportData.income?.rent || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Nebenkosten</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(reportData.income?.prepayments || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border-t-2 border-emerald-500">
                        <span className="font-bold text-gray-900 dark:text-white">Gesamt</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                          {formatCurrency(reportData.income?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ausgaben */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      Ausgaben
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Betriebskosten</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(reportData.expenses?.operating_costs || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">Instandhaltung</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(reportData.expenses?.maintenance || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border-t-2 border-red-500">
                        <span className="font-bold text-gray-900 dark:text-white">Gesamt</span>
                        <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                          {formatCurrency(reportData.expenses?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Überschuss */}
                <div className="mt-6 p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border-2 border-primary-200 dark:border-primary-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Überschuss
                      </div>
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(reportData.surplus || 0)}
                      </div>
                    </div>
                    <DollarSign className="w-12 h-12 text-primary-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leerstand */}
          {reportType === "vacancy" && statsData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leerstand</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Übersicht über leere Einheiten
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Gesamt Einheiten
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsData.total_units || 0}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Leerstand</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {statsData.vacant_units || 0}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Leerstandsquote
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {statsData.total_units
                        ? ((statsData.vacant_units || 0) / statsData.total_units * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Detaillierte Leerstandsliste wird implementiert
                </div>
              </div>
            </div>
          )}

          {/* Rückstände */}
          {reportType === "open_items" && statsData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rückstände</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Übersicht über offene Forderungen
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Offene Posten
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsData.open_charges?.length || 0}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Gesamtbetrag
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(
                        statsData.open_charges?.reduce(
                          (sum, c) => sum + (c.offen || 0),
                          0
                        ) || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Überfällig
                    </div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {
                        statsData.open_charges?.filter((c) => c.status === "overdue").length || 0
                      }
                    </div>
                  </div>
                </div>
                {statsData.open_charges && statsData.open_charges.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {statsData.open_charges.slice(0, 10).map((charge) => (
                      <div
                        key={charge.charge_id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {charge.mieter}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {charge.objekt} - {charge.einheit}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Fällig: {formatDate(charge.faellig)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(charge.offen)}
                          </div>
                          {charge.status === "overdue" && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Überfällig
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mietspiegel */}
          {reportType === "rent_roll" && statsData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mietspiegel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Übersicht über alle Mietverhältnisse
                </p>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Detaillierte Mietspiegel-Liste wird implementiert
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

