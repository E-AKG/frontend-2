import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "../api/tenantApi";
import { useApp } from "../contexts/AppContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Building2,
  DoorOpen,
  TrendingUp,
  History,
} from "lucide-react";
import RiskBadge from "../components/RiskBadge";

export default function PersonenCRM() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedClient } = useApp();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: crmData, isLoading, error } = useQuery({
    queryKey: ["tenantCrm", id],
    queryFn: () => tenantApi.getCrm(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Daten...</div>
      </div>
    );
  }

  if (error || !crmData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Fehler beim Laden der Daten</div>
      </div>
    );
  }

  const { tenant, leases, open_charges, payments, timeline } = crmData.data;

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getTimelineIcon = (type) => {
    switch (type) {
      case "lease":
        return FileText;
      case "payment":
        return CheckCircle;
      default:
        return History;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/personen")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {tenant.first_name} {tenant.last_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">CRM-Ansicht</p>
          </div>
        </div>
        {tenant.risk_level && (
          <RiskBadge riskLevel={tenant.risk_level} riskScore={tenant.risk_score} />
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: "Übersicht" },
            { id: "leases", label: "Verträge" },
            { id: "charges", label: "Offene Posten" },
            { id: "payments", label: "Zahlungen" },
            { id: "timeline", label: "Timeline" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kontaktdaten */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Kontaktdaten</h2>
              <div className="space-y-3">
                {tenant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{tenant.email}</span>
                  </div>
                )}
                {tenant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{tenant.phone}</span>
                  </div>
                )}
                {tenant.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{tenant.address}</span>
                  </div>
                )}
                {tenant.iban && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-mono text-sm">{tenant.iban}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Übersicht</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Aktive Verträge</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {leases.filter((l) => l.status === "active").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Offene Posten</span>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(open_charges.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Zahlungen (gesamt)</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(payments.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leases Tab */}
        {activeTab === "leases" && (
          <div className="space-y-4">
            {leases.length > 0 ? (
              leases.map((lease) => (
                <div
                  key={lease.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {lease.unit?.property?.name || "Unbekannt"}
                        </span>
                        <span className="text-gray-500">-</span>
                        <DoorOpen className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {lease.unit?.label || "Unbekannt"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Von: {formatDate(lease.start_date)}</span>
                        </div>
                        {lease.end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Bis: {formatDate(lease.end_date)}</span>
                          </div>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            lease.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {lease.status === "active" ? "Aktiv" : "Beendet"}
                        </span>
                      </div>
                      {lease.components && lease.components.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mietbestandteile:
                          </div>
                          <div className="space-y-1">
                            {lease.components.map((comp, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{comp.description || comp.type}</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(comp.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/vertraege/${lease.id}`)}
                      className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Keine Verträge gefunden
              </div>
            )}
          </div>
        )}

        {/* Charges Tab */}
        {activeTab === "charges" && (
          <div className="space-y-4">
            {open_charges.items.length > 0 ? (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-red-800 dark:text-red-400">
                        Gesamt offen
                      </div>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-300">
                        {formatCurrency(open_charges.total)}
                      </div>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                {open_charges.items.map((charge) => (
                  <div
                    key={charge.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          {charge.description || "Offene Posten"}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Fällig: {formatDate(charge.due_date)}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              charge.status === "overdue"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : charge.status === "partially_paid"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {charge.status === "overdue"
                              ? "Überfällig"
                              : charge.status === "partially_paid"
                              ? "Teilweise bezahlt"
                              : "Offen"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(charge.open)}
                        </div>
                        {charge.paid > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(charge.paid)} bezahlt
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                <p>Keine offenen Posten</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {payments.items.length > 0 ? (
              <>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                        Gesamt erhalten
                      </div>
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                        {formatCurrency(payments.total)}
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>
                {payments.items.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </span>
                          {payment.is_automatic && (
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-xs">
                              Auto
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(payment.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Keine Zahlungen gefunden
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {timeline.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-6">
                  {timeline.map((item) => {
                    const Icon = getTimelineIcon(item.type);
                    return (
                      <div key={item.id} className="relative flex items-start gap-4">
                        <div className="relative z-10 p-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              {formatDate(item.date)}
                            </div>
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Keine Timeline-Einträge</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

