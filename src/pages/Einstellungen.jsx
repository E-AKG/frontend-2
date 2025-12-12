import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import Auswahl from "../components/Auswahl";
import { Settings, User, FileText, Bell, Mail, Lock, CreditCard, CheckCircle, XCircle, AlertCircle, HelpCircle, ExternalLink, Building2, Upload, X, Euro, Calendar, Image } from "lucide-react";
import { subscriptionApi } from "../api/subscriptionApi";
import { clientSettingsApi } from "../api/clientSettingsApi";
import { useApp } from "../contexts";
import { bankApi } from "../api/bankApi";
import Benachrichtigung, { useBenachrichtigung } from "../components/Benachrichtigung";

export default function Einstellungen() {
  const navigate = useNavigate();
  const { selectedClient } = useApp();
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: "Benutzerkonto", icon: User },
    { id: "client", label: "Mandant", icon: Building2 },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "templates", label: "Textbausteine", icon: FileText },
    { id: "reminders", label: "Mahnregeln", icon: Bell },
    { id: "support", label: "Support & Hilfe", icon: HelpCircle },
  ];

  const queryClient = useQueryClient();

  // Fetch subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionApi.getMySubscription(),
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      alert("Ihr Abonnement wird am Ende der Abrechnungsperiode gekündigt.");
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: () => subscriptionApi.reactivateSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      alert("Ihr Abonnement wurde erfolgreich reaktiviert.");
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settingsForm);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const handleReminderFeeChange = (key, value) => {
    setSettingsForm({
      ...settingsForm,
      reminder_fees: {
        ...settingsForm.reminder_fees,
        [key]: parseFloat(value) || 0,
      },
    });
  };

  const handleReminderDaysChange = (key, value) => {
    setSettingsForm({
      ...settingsForm,
      reminder_days: {
        ...settingsForm.reminder_days,
        [key]: parseInt(value) || 0,
      },
    });
  };

  const handleReminderEnabledChange = (key, value) => {
    setSettingsForm({
      ...settingsForm,
      reminder_enabled: {
        ...settingsForm.reminder_enabled,
        [key]: value,
      },
    });
  };

  const handleTemplateChange = (key, value) => {
    setSettingsForm({
      ...settingsForm,
      text_templates: {
        ...settingsForm.text_templates,
        [key]: value,
      },
    });
  };

  return (
    <div className="animate-fade-in">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
          <Settings className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Einstellungen
        </h1>
        <p className="text-base sm:text-lg text-gray-600">Passen Sie Ihre Präferenzen an</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs - Mobile optimized with scroll */}
        <div className="border-b border-gray-200 px-2 sm:px-6 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-2 min-w-max sm:min-w-0" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 sm:py-4 px-4 sm:px-5 border-b-2 font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 sm:gap-2 whitespace-nowrap touch-manipulation ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600 bg-primary-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content - Mehr Platz auf Mobile */}
        <div className="p-5 sm:p-6 lg:p-8">
          {activeTab === "subscription" && (
            <div className="w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 flex-shrink-0" />
                Abonnement
              </h2>
              
              {subscriptionLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Lade Abonnement-Informationen...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {subscription?.data ? (
                    <>
                      {/* Subscription Status Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {subscription.data.plan_name} Plan
                            </h3>
                            <p className="text-2xl font-bold text-gray-900">
                              {(subscription.data.price_per_month / 100).toFixed(2)}€
                              <span className="text-sm font-normal text-gray-600">/Monat</span>
                            </p>
                          </div>
                          <div>
                            {subscription.data.status === "active" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                <CheckCircle className="w-4 h-4" />
                                Aktiv
                              </span>
                            ) : subscription.data.status === "cancelled" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                <XCircle className="w-4 h-4" />
                                Gekündigt
                              </span>
                            ) : subscription.data.status === "past_due" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                Überfällig
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                Testversion
                              </span>
                            )}
                          </div>
                        </div>

                        {subscription.data.current_period_end && (
                          <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              {subscription.data.cancel_at_period_end
                                ? "Läuft ab am: "
                                : "Nächste Zahlung: "}
                              <span className="font-semibold text-gray-900">
                                {new Date(subscription.data.current_period_end).toLocaleDateString("de-DE", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {subscription.data.status === "active" && !subscription.data.cancel_at_period_end && (
                        <div className="flex gap-4">
                          <Button
                            variant="danger"
                            onClick={() => {
                              if (confirm("Möchten Sie Ihr Abonnement wirklich kündigen? Es läuft bis zum Ende der Abrechnungsperiode weiter.")) {
                                cancelMutation.mutate();
                              }
                            }}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "Wird gekündigt..." : "Abonnement kündigen"}
                          </Button>
                        </div>
                      )}
                      {subscription.data.cancel_at_period_end && (
                        <div className="flex gap-4">
                          <Button
                            onClick={() => reactivateMutation.mutate()}
                            disabled={reactivateMutation.isPending}
                          >
                            {reactivateMutation.isPending ? "Wird reaktiviert..." : "Abonnement reaktivieren"}
                          </Button>
                        </div>
                      )}
                      {subscription.data.status !== "active" && !subscription.data.cancel_at_period_end && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-800 mb-3">
                            Sie nutzen derzeit die Testversion. Um alle Features freizuschalten, können Sie ein Abonnement abschließen.
                          </p>
                          <Button
                            onClick={() => navigate("/pricing")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Abonnement abschließen
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-8">
                      <div className="text-center mb-6">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Testversion</h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Sie nutzen derzeit die kostenlose Testversion. Alle Grundfunktionen stehen Ihnen zur Verfügung.
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 mb-3">
                          Möchten Sie alle Premium-Features freischalten?
                        </p>
                        <Button
                          onClick={() => navigate("/pricing")}
                          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                          Abonnement abschließen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "account" && (
            <div className="w-full space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 flex-shrink-0" />
                Benutzerkonto
              </h2>
              <div className="space-y-5 sm:space-y-6">
                <Formularfeld
                  label="E-Mail-Adresse"
                  type="email"
                  value={localStorage.getItem("user_email") || ""}
                  disabled
                  icon={<Mail className="w-6 h-6 sm:w-7 sm:h-7" />}
                />
                <Formularfeld
                  label="Neues Passwort"
                  type="password"
                  placeholder="Leer lassen, um nicht zu ändern"
                  icon={<Lock className="w-6 h-6 sm:w-7 sm:h-7" />}
                />
                <Formularfeld
                  label="Passwort bestätigen"
                  type="password"
                  placeholder="Neues Passwort wiederholen"
                  icon={<Lock className="w-6 h-6 sm:w-7 sm:h-7" />}
                />
              </div>
              <div className="pt-4 sm:pt-6">
                <Button className="w-full text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 font-bold">Änderungen speichern</Button>
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 flex-shrink-0" />
                Vorlagen
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-5 sm:mb-6">
                E-Mail-Vorlagen für Mahnungen und Benachrichtigungen
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-10 sm:p-12 lg:p-16 text-center">
                <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-5" />
                <p className="text-lg sm:text-xl text-gray-500 font-semibold">Bald verfügbar</p>
              </div>
            </div>
          )}

          {activeTab === "reminders" && selectedClient && (
            <div className="w-full space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 flex-shrink-0" />
                Mahnregeln
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-5 sm:mb-6">
                Automatische Mahnungen bei Zahlungsverzug
              </p>

              {settingsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Lade Mahnregeln...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { key: "payment_reminder", label: "Zahlungserinnerung", defaultDays: 14, defaultFee: 0 },
                    { key: "first_reminder", label: "1. Mahnung", defaultDays: 30, defaultFee: 5 },
                    { key: "second_reminder", label: "2. Mahnung", defaultDays: 60, defaultFee: 10 },
                    { key: "final_reminder", label: "Mahnung (letzte)", defaultDays: 90, defaultFee: 15 },
                  ].map((reminder) => (
                    <div key={reminder.key} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{reminder.label}</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.reminder_enabled?.[reminder.key] ?? true}
                            onChange={(e) =>
                              handleReminderEnabledChange(reminder.key, e.target.checked)
                            }
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Aktiviert</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Formularfeld
                          label="Tage nach Fälligkeit"
                          type="number"
                          icon={<Calendar className="w-5 h-5" />}
                          value={
                            settingsForm.reminder_days?.[reminder.key] ?? reminder.defaultDays
                          }
                          onChange={(e) =>
                            handleReminderDaysChange(reminder.key, e.target.value)
                          }
                        />
                        <Formularfeld
                          label="Mahngebühr (€)"
                          type="number"
                          step="0.01"
                          icon={<Euro className="w-5 h-5" />}
                          value={
                            settingsForm.reminder_fees?.[reminder.key] ?? reminder.defaultFee
                          }
                          onChange={(e) =>
                            handleReminderFeeChange(reminder.key, e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? "Speichere..." : "Speichern"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "support" && (
            <div className="w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 flex-shrink-0" />
                Support & Hilfe
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-5 sm:mb-6">
                Immpire wird von <strong className="text-gray-900">IZENIC</strong> entwickelt und betreut. 
                Für Support, Fragen oder weitere Informationen kontaktieren Sie uns bitte.
              </p>
              
              <div className="space-y-5 sm:space-y-6">
                {/* IZENIC Info Card */}
                <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl border-2 border-primary-200 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Über Immpire</h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Immpire ist ein Produkt von <strong className="text-gray-900">IZENIC</strong>, 
                        einem Unternehmen für innovative Softwarelösungen.
                      </p>
                    </div>
                  </div>
                  <a 
                    href="https://www.izenic.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm sm:text-base transition-colors touch-manipulation"
                  >
                    IZENIC Website besuchen
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </div>

                {/* Support Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <a 
                    href="mailto:kontakt@izenic.com" 
                    className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 hover:border-primary-300 hover:shadow-lg transition-all group touch-manipulation"
                  >
                    <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Support kontaktieren</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3">
                      Schreiben Sie uns eine E-Mail für technischen Support
                    </p>
                    <span className="text-sm sm:text-base font-semibold text-primary-600 group-hover:text-primary-700">
                      kontakt@izenic.com →
                    </span>
                  </a>

                  <a 
                    href="mailto:kontakt@izenic.com" 
                    className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 hover:border-primary-300 hover:shadow-lg transition-all group touch-manipulation"
                  >
                    <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Allgemeine Anfragen</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3">
                      Für allgemeine Fragen und Informationen
                    </p>
                    <span className="text-sm sm:text-base font-semibold text-primary-600 group-hover:text-primary-700">
                      kontakt@izenic.com →
                    </span>
                  </a>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Weitere Informationen</h4>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                    <li className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Immpire wird kontinuierlich von IZENIC weiterentwickelt</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Alle Daten werden sicher und DSGVO-konform gespeichert</span>
                    </li>
                    <li className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Support wird von IZENIC bereitgestellt</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

