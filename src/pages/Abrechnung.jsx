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
  Trash2,
  Edit,
  X,
  Gauge,
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
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    cost_type: "",
    description: "",
    amount: "",
    is_allocable: true,
    notes: "",
  });

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

  // Lade Zählerprüfung
  const { data: meterCheck } = useQuery({
    queryKey: ["meterCheck", currentAccountingId],
    queryFn: async () => {
      const response = await accountingApi.checkMeters(currentAccountingId);
      return response.data;
    },
    enabled: !!currentAccountingId && wizardStep === 1.5,
  });

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: async (data) => {
      return await accountingApi.addItem(currentAccountingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountingItems", currentAccountingId] });
      queryClient.invalidateQueries({ queryKey: ["accounting", currentAccountingId] });
      setShowItemForm(false);
      setItemFormData({
        cost_type: "",
        description: "",
        amount: "",
        is_allocable: true,
        notes: "",
      });
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Delete Item Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      return await accountingApi.deleteItem(currentAccountingId, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountingItems", currentAccountingId] });
      queryClient.invalidateQueries({ queryKey: ["accounting", currentAccountingId] });
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  // Delete Accounting Mutation
  const deleteAccountingMutation = useMutation({
    mutationFn: async (accountingId) => {
      return await accountingApi.delete(accountingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountings"] });
      alert("Abrechnung erfolgreich gelöscht");
    },
    onError: (error) => {
      alert(`Fehler beim Löschen: ${error.response?.data?.detail || error.message}`);
    },
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
      // Prüfe Zählerstände vor Berechnung
      setWizardStep(1.5);
    } else if (wizardStep === 1.5) {
      setWizardStep(2);
    } else if (wizardStep === 2) {
      calculateMutation.mutate();
    } else if (wizardStep === 3) {
      generateMutation.mutate();
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemFormData({
      cost_type: "",
      description: "",
      amount: "",
      is_allocable: true,
      notes: "",
    });
    setShowItemForm(true);
  };

  const handleSaveItem = () => {
    addItemMutation.mutate({
      ...itemFormData,
      amount: parseFloat(itemFormData.amount),
    });
  };

  const handleDeleteItem = (itemId) => {
    if (confirm("Möchten Sie diesen Kostenposten wirklich löschen?")) {
      deleteItemMutation.mutate(itemId);
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
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow relative"
            onClick={() => {
              setCurrentAccountingId(accounting.id);
              setShowWizard(true);
              setWizardStep(3);
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-1">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {accounting.accounting_type === "operating_costs"
                    ? "Betriebskosten"
                    : "Hausgeld"}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
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
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Möchten Sie diese Abrechnung wirklich löschen?")) {
                      deleteAccountingMutation.mutate(accounting.id);
                    }
                  }}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  title="Abrechnung löschen"
                  disabled={deleteAccountingMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Schritt 2: Kostenposten
                    </h3>
                    <Button onClick={handleAddItem} variant="primary" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Kostenposten hinzufügen
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Fügen Sie alle Kosten hinzu, die umgelegt werden sollen.
                  </div>

                  {/* Kostenposten-Formular */}
                  {showItemForm && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {editingItem ? "Kostenposten bearbeiten" : "Neuer Kostenposten"}
                        </h4>
                        <button
                          onClick={() => setShowItemForm(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kostentyp
                          </label>
                          <input
                            type="text"
                            value={itemFormData.cost_type}
                            onChange={(e) =>
                              setItemFormData({ ...itemFormData, cost_type: e.target.value })
                            }
                            placeholder="z.B. Heizung, Wasser, Müll"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Betrag (€)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={itemFormData.amount}
                            onChange={(e) =>
                              setItemFormData({ ...itemFormData, amount: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Beschreibung
                        </label>
                        <input
                          type="text"
                          value={itemFormData.description}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, description: e.target.value })
                          }
                          placeholder="Kurze Beschreibung"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={itemFormData.is_allocable}
                            onChange={(e) =>
                              setItemFormData({ ...itemFormData, is_allocable: e.target.checked })
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Umlagefähig
                          </span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveItem} variant="primary" size="sm">
                          Speichern
                        </Button>
                        <Button
                          onClick={() => setShowItemForm(false)}
                          variant="secondary"
                          size="sm"
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Kostenposten-Liste */}
                  {items.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        Noch keine Kostenposten hinzugefügt
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.cost_type}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {item.description}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(item.amount)}
                              </div>
                              {!item.is_allocable && (
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  Nicht umlagefähig
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Gesamtkosten:
                          </span>
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(
                              items.reduce((sum, item) => sum + (item.amount || 0), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1.5: Zählerstände-Prüfung */}
              {wizardStep === 1.5 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Schritt 2.5: Zählerstände prüfen
                  </h3>
                  {meterCheck ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Gesamt Zähler
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {meterCheck.total_meters}
                          </div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Mit Ablesung
                          </div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {meterCheck.meters_with_readings}
                          </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Fehlend
                          </div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {meterCheck.meters_needing_readings}
                          </div>
                        </div>
                      </div>

                      {meterCheck.meters.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
                          <p className="text-gray-600 dark:text-gray-400">
                            Keine Zähler für diesen Zeitraum gefunden
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {meterCheck.meters.map((meter) => (
                            <div
                              key={meter.meter_id}
                              className={`p-4 rounded-lg border ${
                                meter.needs_reading
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Gauge className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {meter.meter_number} ({meter.meter_type})
                                    </span>
                                    {meter.needs_reading && (
                                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                                        Ablesung fehlt
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {meter.property_name}
                                    {meter.unit_label && ` - ${meter.unit_label}`}
                                    {meter.location && ` (${meter.location})`}
                                  </div>
                                  {meter.has_reading && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      Ablesung: {meter.reading_value} am{" "}
                                      {formatDate(meter.reading_date)}
                                    </div>
                                  )}
                                  {meter.previous_reading_value && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      Vorher: {meter.previous_reading_value} am{" "}
                                      {formatDate(meter.previous_reading_date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {meterCheck.meters_needing_readings > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-900 dark:text-amber-300">
                                {meterCheck.meters_needing_readings} Zähler benötigen Ablesungen
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Bitte erfassen Sie die fehlenden Zählerstände, bevor Sie mit der
                                Berechnung fortfahren.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">Lade Zählerstände...</p>
                    </div>
                  )}
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
                  {settlements.length > 0 && (() => {
                    // Gruppiere Settlements nach Einheit
                    const settlementsByUnit = {};
                    settlements.forEach(settlement => {
                      const unitKey = settlement.unit_label || 'Unbekannt';
                      if (!settlementsByUnit[unitKey]) {
                        settlementsByUnit[unitKey] = [];
                      }
                      settlementsByUnit[unitKey].push(settlement);
                    });

                    return (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {Object.entries(settlementsByUnit).map(([unitLabel, unitSettlements]) => {
                          // Berechne Gesamtkosten für diese Einheit
                          const unitTotalCosts = unitSettlements.reduce((sum, s) => sum + (s.allocated_costs || 0), 0);
                          const unitTenantCosts = unitSettlements
                            .filter(s => !s.is_vacancy)
                            .reduce((sum, s) => sum + (s.allocated_costs || 0), 0);
                          const unitOwnerCosts = unitSettlements
                            .filter(s => s.is_vacancy)
                            .reduce((sum, s) => sum + (s.allocated_costs || 0), 0);

                          return (
                            <div key={unitLabel} className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
                              {/* Einheit-Header mit Gesamtkosten */}
                              <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                  Einheit {unitLabel}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Kostenanteil Einheit gesamt: <span className="font-medium">{formatCurrency(unitTotalCosts)}</span>
                                  {unitTenantCosts > 0 && unitOwnerCosts > 0 && (
                                    <span className="ml-2">
                                      (davon Mieter: {formatCurrency(unitTenantCosts)} / Eigentümer: {formatCurrency(unitOwnerCosts)})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Settlements für diese Einheit */}
                              <div className="space-y-2">
                                {unitSettlements.map((settlement) => {
                                  const isVacancy = settlement.is_vacancy || !settlement.lease_id;
                                  const hasPeriod = settlement.lease_period_start && settlement.lease_period_end;
                                  const days = settlement.days_occupied || 0;

                                  return (
                                    <div
                                      key={settlement.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        isVacancy
                                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                      }`}
                                    >
                                      <div className="flex-1">
                                        {/* Label: Mieteranteil oder Eigentümeranteil */}
                                        <div className={`font-medium text-sm ${
                                          isVacancy
                                            ? "text-amber-900 dark:text-amber-300"
                                            : "text-blue-900 dark:text-blue-300"
                                        }`}>
                                          {isVacancy ? (
                                            <>Eigentümeranteil (Leerstand)</>
                                          ) : (
                                            <>Mieteranteil – {settlement.tenant_name || "Unbekannt"}</>
                                          )}
                                        </div>
                                        
                                        {/* Einheit und Zeitraum */}
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          Einheit {settlement.unit_label}
                                          {hasPeriod && (
                                            <span className="ml-2">
                                              – {formatDate(settlement.lease_period_start)}–{formatDate(settlement.lease_period_end)}
                                              {days > 0 && (
                                                <span className="ml-1 text-gray-500">
                                                  ({days} {days === 1 ? 'Tag' : 'Tage'})
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right ml-4">
                                        <div
                                          className={`font-bold text-sm ${
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
                                        {settlement.advance_payments > 0 && (
                                          <div className="text-xs text-gray-500 dark:text-gray-500">
                                            Vorauszahlung: {formatCurrency(settlement.advance_payments)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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
                  {currentAccounting?.status === "generated" && currentAccounting?.document_path ? (
                    <Button
                      onClick={async () => {
                        try {
                          await accountingApi.downloadPdf(currentAccountingId);
                        } catch (error) {
                          const errorMessage = error.response?.data?.detail || error.message || "Unbekannter Fehler";
                          alert(`Fehler beim Herunterladen: ${errorMessage}\n\nBitte generieren Sie die PDF erneut.`);
                        }
                      }}
                      variant="primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF herunterladen
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentAccounting?.status === "calculated" 
                        ? "Bitte generieren Sie zuerst die PDF."
                        : "PDF noch nicht verfügbar."}
                    </p>
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
                    (wizardStep === 1 && items.length === 0) ||
                    createMutation.isPending ||
                    calculateMutation.isPending ||
                    generateMutation.isPending ||
                    addItemMutation.isPending
                  }
                >
                  {wizardStep === 0
                    ? "Erstellen"
                    : wizardStep === 1
                    ? "Zählerstände prüfen"
                    : wizardStep === 1.5
                    ? "Weiter zur Berechnung"
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

