import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Formularfeld from "../components/Formularfeld";
import Button from "../components/Button";
import { Settings, User, Link2, FileText, Bell, Mail, Lock, CreditCard, CheckCircle, XCircle, AlertCircle, HelpCircle, ExternalLink } from "lucide-react";
import { subscriptionApi } from "../api/subscriptionApi";

export default function Einstellungen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: "Benutzerkonto", icon: User },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "finapi", label: "FinAPI-Verknüpfung", icon: Link2 },
    { id: "templates", label: "Vorlagen", icon: FileText },
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

  return (
    <div className="animate-fade-in">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-600" />
          Einstellungen
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">Passen Sie Ihre Präferenzen an</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-600 bg-primary-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {activeTab === "subscription" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
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
            <div className="max-w-2xl space-y-5">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Benutzerkonto
              </h2>
              <Formularfeld
                label="E-Mail-Adresse"
                type="email"
                value={localStorage.getItem("user_email") || ""}
                disabled
                icon={<Mail className="w-5 h-5" />}
              />
              <Formularfeld
                label="Neues Passwort"
                type="password"
                placeholder="Leer lassen, um nicht zu ändern"
                icon={<Lock className="w-5 h-5" />}
              />
              <Formularfeld
                label="Passwort bestätigen"
                type="password"
                placeholder="Neues Passwort wiederholen"
                icon={<Lock className="w-5 h-5" />}
              />
              <div className="pt-4">
                <Button>Änderungen speichern</Button>
              </div>
            </div>
          )}

          {activeTab === "finapi" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary-600" />
                FinAPI-Verknüpfung
              </h2>
              <p className="text-gray-600 mb-6">
                Verbinden Sie Ihr Bankkonto, um automatisch Transaktionen zu
                synchronisieren.
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Link2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-6">Noch kein Konto verknüpft</p>
                <Button icon={<Link2 className="w-5 h-5" />}>Jetzt verknüpfen</Button>
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Vorlagen
              </h2>
              <p className="text-gray-600 mb-6">
                E-Mail-Vorlagen für Mahnungen und Benachrichtigungen
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Bald verfügbar</p>
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                Mahnregeln
              </h2>
              <p className="text-gray-600 mb-6">
                Automatische Mahnungen bei Zahlungsverzug
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-12 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Bald verfügbar</p>
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-600" />
                Support & Hilfe
              </h2>
              <p className="text-gray-600 mb-6">
                Immpire wird von <strong className="text-gray-900">IZENIC</strong> entwickelt und betreut. 
                Für Support, Fragen oder weitere Informationen kontaktieren Sie uns bitte.
              </p>
              
              <div className="space-y-4">
                {/* IZENIC Info Card */}
                <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl border-2 border-primary-200 p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Über Immpire</h3>
                      <p className="text-sm text-gray-600">
                        Immpire ist ein Produkt von <strong className="text-gray-900">IZENIC</strong>, 
                        einem Unternehmen für innovative Softwarelösungen.
                      </p>
                    </div>
                  </div>
                  <a 
                    href="https://www.izenic.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                  >
                    IZENIC Website besuchen
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Support Options */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <a 
                    href="mailto:support@izenic.com" 
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all group"
                  >
                    <Mail className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-gray-900 mb-2">Support kontaktieren</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Schreiben Sie uns eine E-Mail für technischen Support
                    </p>
                    <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                      support@izenic.com →
                    </span>
                  </a>

                  <a 
                    href="mailto:info@izenic.com" 
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all group"
                  >
                    <Mail className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-gray-900 mb-2">Allgemeine Anfragen</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Für allgemeine Fragen und Informationen
                    </p>
                    <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                      info@izenic.com →
                    </span>
                  </a>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h4 className="font-bold text-gray-900 mb-3">Weitere Informationen</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Immpire wird kontinuierlich von IZENIC weiterentwickelt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Alle Daten werden sicher und DSGVO-konform gespeichert</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
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

