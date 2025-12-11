import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { statsApi } from "../api/statsApi";
import { searchApi } from "../api/searchApi";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Euro,
  Building2,
  Users,
  FileText,
  DoorOpen,
  ArrowRight,
  Bell,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function DashboardPro() {
  const navigate = useNavigate();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Lade Dashboard-Daten
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard", selectedMonth.getMonth() + 1, selectedMonth.getFullYear(), selectedClient?.id],
    queryFn: async () => {
      const response = await statsApi.getDashboard({
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  // Lade Quick Stats
  const { data: quickStats } = useQuery({
    queryKey: ["quickStats", selectedClient?.id],
    queryFn: async () => {
      const response = await searchApi.quickStats({
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  const kpis = dashboardData?.kpis || {};
  const todos = dashboardData?.todos || [];
  const activities = dashboardData?.activities || [];
  const rentData = dashboardData?.rent_overview || {
    erwartet: 0,
    bezahlt: 0,
    offen: 0,
    prozent: 0,
  };

  const formatMonthYear = (date) => {
    const months = [
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ok":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "warning":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
      case "error":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bitte wählen Sie einen Mandanten aus</p>
          <button
            onClick={() => navigate("/clients/new")}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Neuen Mandanten erstellen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Willkommen zurück! Hier ist Ihr Action-Center für {formatMonthYear(selectedMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedMonth(newDate);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ←
          </button>
          <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium">
            {formatMonthYear(selectedMonth)}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedMonth(newDate);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            →
          </button>
        </div>
      </div>

      {/* KPI-Ampel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Offene Posten */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Offene Posten</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kpis.open_charges?.status || "ok")}`}>
              {kpis.open_charges?.status === "warning" ? "⚠️" : "✓"}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {kpis.open_charges?.count || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {kpis.open_charges?.amount?.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) || "0,00 €"}
          </div>
          {kpis.open_charges?.overdue > 0 && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              {kpis.open_charges.overdue} überfällig
            </div>
          )}
        </div>

        {/* Leerstand */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Leerstand</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kpis.vacancy?.status || "ok")}`}>
              {kpis.vacancy?.status === "warning" ? "⚠️" : "✓"}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {kpis.vacancy?.rate || 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {kpis.vacancy?.count || 0} von {kpis.vacancy?.total || 0} Einheiten
          </div>
        </div>

        {/* Mieteinnahmen */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Mieteinnahmen</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {rentData.prozent}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {rentData.bezahlt.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} von{" "}
            {rentData.erwartet.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* To-Do-Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              To-Dos
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{todos.length} Aufgaben</span>
          </div>
          {todos.length > 0 ? (
            <div className="space-y-3">
              {todos.map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => navigate(todo.action_url)}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(todo.priority)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{todo.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{todo.description}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              <p>Keine offenen Aufgaben</p>
            </div>
          )}
        </div>

        {/* Aktivitäts-Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Aktivitäten
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Letzte Vorgänge</span>
          </div>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="mt-0.5 p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</div>
                    {activity.timestamp && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString("de-DE")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Keine Aktivitäten</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/verwaltung")}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Objekte</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.properties || 0}</div>
          </div>
          <div
            onClick={() => navigate("/personen")}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mieter</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.tenants || 0}</div>
          </div>
          <div
            onClick={() => navigate("/vertraege")}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Verträge</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.active_leases || 0}</div>
          </div>
          <div
            onClick={() => navigate("/verwaltung?filter=vacant")}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Einheiten</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{quickStats.units || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}

