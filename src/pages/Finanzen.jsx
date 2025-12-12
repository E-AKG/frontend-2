import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { reminderApi } from "../api/reminderApi";
import { statsApi } from "../api/statsApi";
import {
  AlertCircle,
  FileText,
  Send,
  Plus,
  Filter,
  Download,
  Euro,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Eye,
} from "lucide-react";
import Button from "../components/Button";

export default function Finanzen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient } = useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Lade Dashboard-Daten für Offene Posten
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard", new Date().getMonth() + 1, new Date().getFullYear(), selectedClient?.id],
    queryFn: async () => {
      const response = await statsApi.getDashboard({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        client_id: selectedClient?.id,
      });
      return response.data;
    },
    enabled: !!selectedClient,
  });

  // Lade Mahnungen
  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders", selectedClient?.id],
    queryFn: async () => {
      const response = await reminderApi.list({
        client_id: selectedClient?.id,
      });
      return response.data || [];
    },
    enabled: !!selectedClient,
  });

  const openCharges = dashboardData?.open_charges || [];

  // Bulk Reminder Mutation
  const bulkReminderMutation = useMutation({
    mutationFn: async (data) => {
      return await reminderApi.bulkCreate(
        data.reminder_type,
        selectedClient.id,
        {
          days_overdue: data.days_overdue,
          reminder_fee: data.reminder_fee,
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      alert(`Mahnlauf gestartet: ${data.data.created} Mahnungen erstellt`);
      setShowBulkReminderModal(false);
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Generate PDF Mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (reminderId) => {
      return await reminderApi.generatePdf(reminderId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      alert("PDF wurde generiert");
      // TODO: PDF Download implementieren
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Mark Sent Mutation
  const markSentMutation = useMutation({
    mutationFn: async (reminderId) => {
      return await reminderApi.markSent(reminderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      alert("Mahnung als versendet markiert");
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const getReminderTypeLabel = (type) => {
    const labels = {
      payment_reminder: "Zahlungserinnerung",
      first_reminder: "1. Mahnung",
      second_reminder: "2. Mahnung",
      final_reminder: "Letzte Mahnung",
      legal_action: "Rechtsweg",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "paid":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "cancelled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bitte wählen Sie einen Mandanten aus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finanzen</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Zahlungsabgleich, Offene Posten & Mahnwesen</p>
          <div className="mt-4">
            <Button onClick={() => navigate("/zahlungsabgleich")} variant="secondary" size="sm">
              Zum Zahlungsabgleich →
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/bank")}
            variant="secondary"
          >
            CSV-Import
          </Button>
          <Button
            onClick={() => navigate("/kassenbuch")}
            variant="secondary"
          >
            Kassenbuch
          </Button>
          <Button
            onClick={() => setShowBulkReminderModal(true)}
            variant="primary"
          >
            <Send className="w-4 h-4 mr-2" />
            Mahnlauf starten
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: "Übersicht" },
            { id: "charges", label: "Offene Posten" },
            { id: "reminders", label: "Mahnungen" },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Offene Posten</h3>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {openCharges.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(
                  openCharges.reduce((sum, c) => sum + (c.offen || 0), 0)
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Mahnungen</h3>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {reminders.filter((r) => r.status === "sent").length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {reminders.filter((r) => r.status === "draft").length} Entwürfe
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Zahlungsrate</h3>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {dashboardData?.rent_overview?.prozent || 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(dashboardData?.rent_overview?.bezahlt || 0)} bezahlt
              </div>
            </div>
          </div>
        )}

        {/* Charges Tab */}
        {activeTab === "charges" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {openCharges.length} offene Posten gefunden
              </p>
              <button
                onClick={() => navigate("/offene-posten")}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Detaillierte Ansicht →
              </button>
            </div>
            {openCharges.length > 0 ? (
              <>
                {openCharges.slice(0, 10).map((charge) => (
                  <div
                    key={charge.charge_id}
                    onClick={() => navigate("/offene-posten")}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          {charge.mieter} - {charge.einheit}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {charge.objekt}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Fällig: {formatDate(charge.faellig)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              charge.status === "overdue"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {charge.status === "overdue" ? "Überfällig" : "Offen"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(charge.offen)}
                        </div>
                        {charge.betrag !== charge.offen && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            von {formatCurrency(charge.betrag)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {openCharges.length > 10 && (
                  <div className="text-center py-4">
                    <button
                      onClick={() => navigate("/offene-posten")}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                    >
                      {openCharges.length - 10} weitere anzeigen →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Keine offenen Posten
              </div>
            )}
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === "reminders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mahnungen</h2>
              <Button onClick={() => setShowBulkReminderModal(true)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Mahnlauf starten
              </Button>
            </div>
            {reminders.length > 0 ? (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getReminderTypeLabel(reminder.reminder_type)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(reminder.status)}`}>
                          {reminder.status === "sent" ? "Versendet" : reminder.status === "paid" ? "Bezahlt" : "Entwurf"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Datum: {formatDate(reminder.reminder_date)}
                        {reminder.due_date && ` | Neue Fälligkeit: ${formatDate(reminder.due_date)}`}
                      </div>
                      {reminder.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">{reminder.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(reminder.amount)}
                        </div>
                        {reminder.reminder_fee > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            + {formatCurrency(reminder.reminder_fee)} Gebühr
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {reminder.status === "draft" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReminder(reminder);
                                setShowReminderModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                              title="Details anzeigen"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {!reminder.document_path && (
                              <button
                                onClick={() => generatePdfMutation.mutate(reminder.id)}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="PDF generieren"
                                disabled={generatePdfMutation.isPending}
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            )}
                            {reminder.document_path && (
                              <button
                                onClick={() => {
                                  // TODO: PDF Download
                                  alert("PDF-Download wird implementiert");
                                }}
                                className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                title="PDF herunterladen"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm("Mahnung als versendet markieren?")) {
                                  markSentMutation.mutate(reminder.id);
                                }
                              }}
                              className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              title="Als versendet markieren"
                              disabled={markSentMutation.isPending}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {reminder.status === "sent" && reminder.document_path && (
                          <button
                            onClick={() => {
                              // TODO: PDF Download
                              alert("PDF-Download wird implementiert");
                            }}
                            className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                            title="PDF herunterladen"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Keine Mahnungen
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Reminder Modal */}
      {showBulkReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mahnlauf starten</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                bulkReminderMutation.mutate({
                  reminder_type: formData.get("reminder_type"),
                  days_overdue: parseInt(formData.get("days_overdue")),
                  reminder_fee: parseFloat(formData.get("reminder_fee")) || 0,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mahnstufe
                </label>
                <select
                  name="reminder_type"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="payment_reminder">Zahlungserinnerung</option>
                  <option value="first_reminder">1. Mahnung</option>
                  <option value="second_reminder">2. Mahnung</option>
                  <option value="final_reminder">Letzte Mahnung</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mindestens X Tage überfällig
                </label>
                <input
                  type="number"
                  name="days_overdue"
                  defaultValue={14}
                  min={1}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mahngebühr (€)
                </label>
                <input
                  type="number"
                  name="reminder_fee"
                  defaultValue={0}
                  min={0}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" variant="primary" disabled={bulkReminderMutation.isPending}>
                  {bulkReminderMutation.isPending ? "Wird erstellt..." : "Mahnlauf starten"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBulkReminderModal(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Detail Modal */}
      {showReminderModal && selectedReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Mahnung: {getReminderTypeLabel(selectedReminder.reminder_type)}
              </h2>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setSelectedReminder(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(selectedReminder.status)}`}>
                    {selectedReminder.status === "sent" ? "Versendet" : selectedReminder.status === "paid" ? "Bezahlt" : "Entwurf"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mahndatum
                  </label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedReminder.reminder_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mahnbetrag
                  </label>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(selectedReminder.amount)}
                  </p>
                </div>
                {selectedReminder.reminder_fee > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mahngebühr
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatCurrency(selectedReminder.reminder_fee)}
                    </p>
                  </div>
                )}
                {selectedReminder.due_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Neue Fälligkeit
                    </label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedReminder.due_date)}</p>
                  </div>
                )}
                {selectedReminder.document_path && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PDF generiert
                    </label>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Verfügbar</p>
                  </div>
                )}
              </div>
              {selectedReminder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notizen
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedReminder.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedReminder.status === "draft" && (
                  <>
                    {!selectedReminder.document_path && (
                      <Button
                        onClick={() => {
                          generatePdfMutation.mutate(selectedReminder.id);
                        }}
                        variant="primary"
                        disabled={generatePdfMutation.isPending}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        PDF generieren
                      </Button>
                    )}
                    {selectedReminder.document_path && (
                      <Button
                        onClick={() => {
                          // TODO: PDF Download
                          alert("PDF-Download wird implementiert");
                        }}
                        variant="primary"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF herunterladen
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (confirm("Mahnung als versendet markieren?")) {
                          markSentMutation.mutate(selectedReminder.id);
                          setShowReminderModal(false);
                        }
                      }}
                      variant="secondary"
                      disabled={markSentMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Als versendet markieren
                    </Button>
                  </>
                )}
                {selectedReminder.status === "sent" && selectedReminder.document_path && (
                  <Button
                    onClick={() => {
                      // TODO: PDF Download
                      alert("PDF-Download wird implementiert");
                    }}
                    variant="primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF herunterladen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

