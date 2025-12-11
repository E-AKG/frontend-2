import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../contexts/AppContext";
import { accountingApi } from "../api/accountingApi";
import {
  FileText,
  Plus,
  Calculator,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Button from "../components/Button";

export default function Abrechnung() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [wizardStep, setWizardStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [accountingData, setAccountingData] = useState({
    accounting_type: "operating_costs",
    period_start: "",
    period_end: "",
    notes: "",
  });
  const [allocationMethod, setAllocationMethod] = useState("area");
  const [currentAccountingId, setCurrentAccountingId] = useState(null);

  // Lade Abrechnungen
  const { data: accountings = [], refetch: refetchAccountings } = useQuery({
    queryKey: ["accountings", selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      const response = await accountingApi.list({
        client_id: selectedClient?.id,
        fiscal_year_id: selectedFiscalYear?.id,
      });
      return response.data || [];
    },
    enabled: !!selectedClient,
  });

  // Lade aktuelle Abrechnung (wenn im Wizard)
  const { data: currentAccounting } = useQuery({
    queryKey: ["accounting", currentAccountingId],
    queryFn: async () => {
      const response = await accountingApi.get(currentAccountingId);
      return response.data;
    },
    enabled: !!currentAccountingId,
  });

  // Lade Kostenposten
  const { data: items = [] } = useQuery({
    queryKey: ["accountingItems", currentAccountingId],
    queryFn: async () => {
      const response = await accountingApi.getItems(currentAccountingId);
      return response.data || [];
    },
    enabled: !!currentAccountingId,
  });

  // Lade Einzelabrechnungen
  const { data: settlements = [] } = useQuery({
    queryKey: ["settlements", currentAccountingId],
    queryFn: async () => {
      const response = await accountingApi.getSettlements(currentAccountingId);
      return response.data || [];
    },
    enabled: !!currentAccountingId && wizardStep >= 3,
  });

  // Create Accounting Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await accountingApi.create(
        data,
        selectedClient.id,
        selectedFiscalYear?.id
      );
    },
    onSuccess: (response) => {
      setCurrentAccountingId(response.data.id);
      setWizardStep(1);
      queryClient.invalidateQueries({ queryKey: ["accountings"] });
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Calculate Mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      return await accountingApi.calculate(currentAccountingId, allocationMethod);
    },
    onSuccess: () => {
      setWizardStep(3);
      queryClient.invalidateQueries({ queryKey: ["settlements", currentAccountingId] });
      queryClient.invalidateQueries({ queryKey: ["accounting", currentAccountingId] });
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return await accountingApi.generate(currentAccountingId);
    },
    onSuccess: () => {
      setWizardStep(4);
      queryClient.invalidateQueries({ queryKey: ["accounting", currentAccountingId] });
      queryClient.invalidateQueries({ queryKey: ["accountings"] });
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
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const handleStartWizard = () => {
    setShowWizard(true);
    setWizardStep(0);
    setCurrentAccountingId(null);
    setAccountingData({
      accounting_type: "operating_costs",
      period_start: selectedFiscalYear
        ? `${selectedFiscalYear.year}-01-01`
        : `${new Date().getFullYear()}-01-01`,
      period_end: selectedFiscalYear
        ? `${selectedFiscalYear.year}-12-31`
        : `${new Date().getFullYear()}-12-31`,
      notes: "",
    });
  };

  const handleWizardNext = () => {
    if (wizardStep === 0) {
      createMutation.mutate(accountingData);
    } else if (wizardStep === 1) {
      setWizardStep(2);
    } else if (wizardStep === 2) {
      calculateMutation.mutate();
    } else if (wizardStep === 3) {
      generateMutation.mutate();
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setWizardStep(0);
    setCurrentAccountingId(null);
    refetchAccountings();
  };

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Bitte wählen Sie einen Mandanten aus
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Abrechnung</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Betriebskosten- und Hausgeldabrechnung
          </p>
        </div>
        <Button onClick={handleStartWizard} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Neue Abrechnung
        </Button>
      </div>

      {/* Abrechnungsliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountings.map((accounting) => (
          <div
            key={accounting.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setCurrentAccountingId(accounting.id);
              setShowWizard(true);
              setWizardStep(3);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {accounting.accounting_type === "operating_costs"
                    ? "Betriebskosten"
                    : "Hausgeld"}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  accounting.status === "generated" || accounting.status === "sent"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : accounting.status === "calculated"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {accounting.status === "draft"
                  ? "Entwurf"
                  : accounting.status === "calculated"
                  ? "Berechnet"
                  : accounting.status === "generated"
                  ? "Generiert"
                  : accounting.status === "sent"
                  ? "Versendet"
                  : "Abgeschlossen"}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {formatDate(accounting.period_start)} - {formatDate(accounting.period_end)}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(accounting.total_settlement)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Gesamtkosten: {formatCurrency(accounting.total_costs)}
            </div>
          </div>
        ))}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Wizard Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Abrechnung erstellen
                </h2>
                <button
                  onClick={handleCloseWizard}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              {/* Progress Steps */}
              <div className="flex items-center gap-2 mt-4">
                {[
                  "Grunddaten",
                  "Kostenposten",
                  "Berechnung",
                  "Ergebnis",
                  "Fertig",
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded-full ${
                      idx <= wizardStep
                        ? "bg-primary-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Wizard Content */}
            <div className="p-6">
              {/* Step 0: Grunddaten */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Schritt 1: Grunddaten
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Abrechnungstyp
                    </label>
                    <select
                      value={accountingData.accounting_type}
                      onChange={(e) =>
                        setAccountingData({
                          ...accountingData,
                          accounting_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="operating_costs">Betriebskostenabrechnung</option>
                      <option value="housing_fund">Hausgeldabrechnung</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Von
                      </label>
                      <input
                        type="date"
                        value={accountingData.period_start}
                        onChange={(e) =>
                          setAccountingData({
                            ...accountingData,
                            period_start: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bis
                      </label>
                      <input
                        type="date"
                        value={accountingData.period_end}
                        onChange={(e) =>
                          setAccountingData({
                            ...accountingData,
                            period_end: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Kostenposten */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Schritt 2: Kostenposten
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Fügen Sie alle Kosten hinzu, die umgelegt werden sollen.
                  </div>
                  {/* TODO: Kostenposten hinzufügen UI */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Kostenposten-Verwaltung wird implementiert. Für jetzt können Sie mit der
                      Berechnung fortfahren.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Berechnung */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Schritt 3: Berechnung
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Umlageschlüssel
                    </label>
                    <select
                      value={allocationMethod}
                      onChange={(e) => setAllocationMethod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="area">Nach Fläche (m²)</option>
                      <option value="units">Nach Einheiten</option>
                      <option value="persons">Nach Personen</option>
                    </select>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-900 dark:text-blue-300">
                        Bereit zur Berechnung
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Die Kosten werden auf alle aktiven Verträge im Zeitraum verteilt.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Ergebnis */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Schritt 4: Ergebnis
                  </h3>
                  {currentAccounting && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Gesamtkosten
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(currentAccounting.total_costs)}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Vorauszahlungen
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(currentAccounting.total_advance_payments)}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Nachzahlung/Guthaben
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            currentAccounting.total_settlement >= 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatCurrency(currentAccounting.total_settlement)}
                        </div>
                      </div>
                    </div>
                  )}
                  {settlements.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {settlements.map((settlement) => (
                        <div
                          key={settlement.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {settlement.tenant_name || "Unbekannt"}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {settlement.unit_label}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold ${
                                settlement.settlement_amount >= 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {formatCurrency(settlement.settlement_amount)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              von {formatCurrency(settlement.allocated_costs)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Fertig */}
              {wizardStep === 4 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Abrechnung erstellt!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Die Abrechnung wurde erfolgreich generiert.
                  </p>
                  {currentAccounting?.document_path && (
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
              )}
            </div>

            {/* Wizard Footer */}
            {wizardStep < 4 && (
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <Button
                  onClick={handleWizardBack}
                  variant="secondary"
                  disabled={wizardStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <Button
                  onClick={handleWizardNext}
                  variant="primary"
                  disabled={
                    (wizardStep === 0 &&
                      (!accountingData.period_start || !accountingData.period_end)) ||
                    createMutation.isPending ||
                    calculateMutation.isPending ||
                    generateMutation.isPending
                  }
                >
                  {wizardStep === 0
                    ? "Erstellen"
                    : wizardStep === 2
                    ? "Berechnen"
                    : wizardStep === 3
                    ? "PDF generieren"
                    : "Weiter"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

