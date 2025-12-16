import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../contexts/AppContext';
import axiosInstance from '../api/axiosInstance';
import { bankApi } from '../api/bankApi';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Tabelle from '../components/Tabelle';
import { formatCurrency, formatDate } from '../utils/formatting';
import { Sparkles, CheckCircle, Plus, AlertTriangle } from 'lucide-react';

const Sollstellungen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [reconcileWarnings, setReconcileWarnings] = useState([]);
  const [selectedChargeWarning, setSelectedChargeWarning] = useState(null);
  const [selectedBillRun, setSelectedBillRun] = useState(null);
  const [reconcileSources, setReconcileSources] = useState({
    csv: true,
    cashbook: true,
    manual: true
  });
  
  // Filter und Pagination
  const [filters, setFilters] = useState({
    status: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // Formulardaten für neue Sollstellung
  const [generateForm, setGenerateForm] = useState({
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    description: ''
  });

  // React Query: Fetch Bill Runs
  const { data: billRunsData, isLoading: billRunsLoading, refetch: refetchBillRuns } = useQuery({
    queryKey: ['billRuns', filters, pagination.page, pagination.pageSize, selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!selectedClient) {
        return [];
      }
      const params = new URLSearchParams({
        page: pagination.page,
        page_size: pagination.pageSize,
        ...(filters.status && { status: filters.status }),
        ...(filters.year && { period_year: filters.year }),
        ...(filters.month && { period_month: filters.month }),
        ...(selectedClient?.id && { client_id: selectedClient.id }),
        ...(selectedFiscalYear?.id && { fiscal_year_id: selectedFiscalYear.id })
      });
      const response = await axiosInstance.get(`/api/bill-runs?${params}`);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
      return response.data.items || [];
    },
    enabled: !!selectedClient,
    staleTime: 10000, // Data is fresh for 10 seconds
  });

  // React Query: Fetch Charges
  const { data: charges = [], refetch: refetchCharges } = useQuery({
    queryKey: ['charges', selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!selectedClient) {
        return [];
      }
      const response = await axiosInstance.get('/api/charges', {
        params: {
          page: 1,
          page_size: 200,
          ...(selectedClient?.id && { client_id: selectedClient.id }),
          ...(selectedFiscalYear?.id && { fiscal_year_id: selectedFiscalYear.id })
        }
      });
      return response.data.items || [];
    },
    enabled: !!selectedClient,
    staleTime: 10000,
  });

  // React Query: Fetch Bill Run Details
  const { data: billRunDetails, isLoading: detailsLoading, refetch: refetchBillRunDetails } = useQuery({
    queryKey: ['billRunDetails', selectedBillRun?.id],
    queryFn: async () => {
      if (!selectedBillRun?.id) return null;
      const response = await axiosInstance.get(`/api/bill-runs/${selectedBillRun.id}`);
      return response.data;
    },
    enabled: !!selectedBillRun?.id,
    staleTime: 10000,
  });

  // Handler für Aktualisieren-Button
  const handleRefresh = async () => {
    // Invalidate alle Queries
    queryClient.invalidateQueries({ queryKey: ['billRuns'] });
    queryClient.invalidateQueries({ queryKey: ['charges'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['billRunDetails'] });
    
    // Refetch alle aktiven Queries sofort
    await Promise.all([
      refetchBillRuns(),
      refetchCharges(),
      refetchStats(),
      selectedBillRun?.id && refetchBillRunDetails()
    ]);
  };

  // React Query: Fetch Stats
  const { data: stats = {
    total_expected: 0,
    total_paid: 0,
    total_outstanding: 0,
    payment_rate: 0
  }, refetch: refetchStats } = useQuery({
    queryKey: ['stats', filters.month, filters.year, selectedClient?.id, selectedFiscalYear?.id],
    queryFn: async () => {
      if (!selectedClient) {
        return {
          total_expected: 0,
          total_paid: 0,
          total_outstanding: 0,
          payment_rate: 0
        };
      }
      const response = await axiosInstance.get('/api/stats/dashboard', {
        params: {
          month: filters.month,
          year: filters.year,
          ...(selectedClient?.id && { client_id: selectedClient.id }),
          ...(selectedFiscalYear?.id && { fiscal_year_id: selectedFiscalYear.id })
        }
      });
      return response.data;
    },
    enabled: !!selectedClient,
    staleTime: 10000,
  });

  const billRuns = billRunsData || [];
  const loading = billRunsLoading;

  // Mutation: Generate Bill Run
  const generateMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axiosInstance.post('/api/bill-runs/generate', formData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowGenerateModal(false);
    },
    onError: (error) => {
      console.error('Fehler beim Generieren der Sollstellung:', error);
      alert('Fehler beim Generieren der Sollstellung');
    }
  });

  // Mutation: Delete Bill Run
  const deleteMutation = useMutation({
    mutationFn: async (billRunId) => {
      await axiosInstance.delete(`/api/bill-runs/${billRunId}`);
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error) => {
      console.error('Fehler beim Löschen der Sollstellung:', error);
      alert('Fehler beim Löschen der Sollstellung');
    }
  });

  // Mutation: Universeller Abgleich
  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const selectedSources = Object.entries(reconcileSources)
        .filter(([_, selected]) => selected)
        .map(([source, _]) => source);
      
      const sourcesParam = selectedSources.length > 0 ? selectedSources.join(',') : null;
      
      return await bankApi.universalReconcile(
        selectedClient?.id,
        selectedFiscalYear?.id,
        0.4, // Niedrigere Confidence-Schwelle für flexibleres Matching (40% statt 60%)
        sourcesParam
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billRuns'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
      queryClient.invalidateQueries({ queryKey: ['unmatched-transactions'] });
      
      setShowReconcileModal(false);
      
      const sources = data.data?.sources || {};
      const matched = data.data?.matched || 0;
      const processed = data.data?.processed || 0;
      const details = data.data?.details || [];
      
      // Sammle alle Warnungen aus den Details
      const warnings = [];
      details.forEach(detail => {
        if (detail.warnings && detail.warnings.length > 0) {
          warnings.push({
            source: detail.source,
            charge_id: detail.charge_id,
            amount: detail.amount,
            warnings: detail.warnings,
            note: detail.note
          });
        }
      });
      
      // Zeige Warnungen an, falls vorhanden
      if (warnings.length > 0) {
        setReconcileWarnings(warnings);
        setShowWarningsModal(true);
      }
      
      alert(
        `✅ Abgleich abgeschlossen!\n\n` +
        `📊 ${matched} von ${processed} Zahlungen zugeordnet\n\n` +
        `Quellen:\n` +
        `• CSV/Bank: ${sources.csv?.matched || 0} von ${sources.csv?.processed || 0}\n` +
        `• Kassenbuch: ${sources.cashbook?.matched || 0} von ${sources.cashbook?.processed || 0}\n` +
        `• Manuell: ${sources.manual?.matched || 0} von ${sources.manual?.processed || 0}` +
        (warnings.length > 0 ? `\n\n⚠️ ${warnings.length} Warnung(en) gefunden - Details werden angezeigt` : '')
      );
    },
    onError: (error) => {
      alert(`Fehler: ${error.response?.data?.detail || "Unbekannter Fehler"}`);
    },
  });

  const handleGenerateBillRun = () => {
    if (!selectedClient) {
      alert("Bitte wählen Sie einen Mandanten aus");
      return;
    }
    generateMutation.mutate({
      ...generateForm,
      client_id: selectedClient.id,
      fiscal_year_id: selectedFiscalYear?.id,
    });
  };

  const handleDeleteBillRun = (billRunId) => {
    if (!window.confirm('Sollstellung wirklich löschen?')) return;
    deleteMutation.mutate(billRunId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Entwurf', className: 'bg-slate-100 text-slate-700' },
      finalized: { label: 'Finalisiert', className: 'bg-blue-100 text-blue-700' },
      sent: { label: 'Versendet', className: 'bg-amber-100 text-amber-700' },
      closed: { label: 'Abgeschlossen', className: 'bg-emerald-100 text-emerald-700' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getChargeStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Offen', className: 'bg-amber-100 text-amber-700' },
      paid: { label: 'Bezahlt', className: 'bg-emerald-100 text-emerald-700' },
      partially_paid: { label: 'Teilweise bezahlt', className: 'bg-blue-100 text-blue-700' },
      overdue: { label: 'Überfällig', className: 'bg-red-100 text-red-700' },
      cancelled: { label: 'Storniert', className: 'bg-slate-100 text-slate-600' }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const billRunColumns = [
    {
      key: 'period',
      label: 'Zeitraum',
      render: (item) => (
        <div className="font-medium">
          {new Date(item.period_year, item.period_month - 1).toLocaleDateString('de-DE', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => getStatusBadge(item.status)
    },
    {
      key: 'total_amount',
      label: 'Gesamtbetrag',
      render: (item) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(item.total_amount || 0)}
        </div>
      )
    },
    {
      key: 'paid_amount',
      label: 'Bezahlt',
      render: (item) => (
        <div className="text-green-600 font-medium">
          {formatCurrency(item.paid_amount || 0)}
        </div>
      )
    },
    {
      key: 'outstanding',
      label: 'Ausstehend',
      render: (item) => {
        const outstanding = (item.total_amount || 0) - (item.paid_amount || 0);
        return (
          <div className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {formatCurrency(outstanding)}
          </div>
        );
      }
    },
    {
      key: 'run_date',
      label: 'Erstellt',
      render: (item) => formatDate(item.run_date)
    },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (item) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedBillRun(item)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Details
          </button>
          <button
            onClick={() => handleDeleteBillRun(item.id)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Löschen
          </button>
        </div>
      )
    }
  ];

  const chargeColumns = [
    {
      key: 'lease',
      label: 'Mieter / Objekt',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="font-medium">{item.lease?.tenant?.first_name} {item.lease?.tenant?.last_name}</div>
            <div className="text-sm text-gray-500">{item.lease?.unit?.property?.name} - {item.lease?.unit?.unit_label}</div>
          </div>
          {item.warnings && item.warnings.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedChargeWarning(item);
              }}
              className="flex-shrink-0 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors group"
              title="Warnung anzeigen"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Sollbetrag',
      render: (item) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(item.amount)}
        </div>
      )
    },
    {
      key: 'paid_amount',
      label: 'Bezahlt',
      render: (item) => (
        <div className="font-medium">
          <div className="text-green-600 dark:text-green-400">
            {formatCurrency(item.paid_amount || 0)}
          </div>
          {item.overpayment && item.overpayment > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ +{formatCurrency(item.overpayment)} zu viel
            </div>
          )}
          {item.underpayment && item.underpayment > 0 && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              ⚠️ -{formatCurrency(item.underpayment)} fehlt
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => getChargeStatusBadge(item.status)
    },
    {
      key: 'due_date',
      label: 'Fälligkeitsdatum',
      render: (item) => formatDate(item.due_date)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Kompakter Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sollstellungen</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Mieteinnahmen verwalten & Zahlungen abgleichen</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowReconcileModal(true)}
            variant="primary"
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Abgleich starten
          </Button>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
          <Button
            onClick={() => setShowGenerateModal(true)}
            variant="secondary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Sollstellung
          </Button>
        </div>
      </div>

      <div>
        {/* Auto-Sync Info Banner */}
        {(generateMutation.isPending || deleteMutation.isPending || loading) && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Daten werden aktualisiert...
              </p>
            </div>
          </div>
        )}

        {/* Kompakte Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Erwartet</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total_expected)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bezahlt</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.total_paid)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ausstehend</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.total_outstanding)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Zahlungsrate</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.payment_rate.toFixed(1)}%</div>
          </div>
        </div>

        {/* Kompakte Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="finalized">Finalisiert</option>
              <option value="sent">Versendet</option>
              <option value="closed">Abgeschlossen</option>
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
            <button
              onClick={() => setFilters({ status: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 })}
              className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        {/* Sollstellungen Tabelle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sollstellungen</h3>
          </div>
          <Tabelle
            spalten={billRunColumns}
            daten={billRuns}
            loading={loading}
          />
        </div>

        {/* Offene Sollbuchungen */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Offene Sollbuchungen</h3>
          </div>
          <Tabelle
            spalten={chargeColumns}
            daten={charges}
            loading={loading}
          />
        </div>
      </div>

      {/* Modal: Sollstellung Details */}
      <Modal
        isOpen={!!selectedBillRun}
        onClose={() => setSelectedBillRun(null)}
        titel={`Sollstellung Details - ${selectedBillRun ? new Date(selectedBillRun.period_year, selectedBillRun.period_month - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : ''}`}
      >
        {detailsLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : billRunDetails ? (
          <div className="space-y-6">
            {/* Übersicht */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">Gesamtbetrag</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(billRunDetails.total_amount || 0)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-sm text-emerald-600 mb-1">Bezahlt</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(billRunDetails.paid_amount || 0)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-600 mb-1">Ausstehend</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency((billRunDetails.total_amount || 0) - (billRunDetails.paid_amount || 0))}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-600 mb-1">Status</p>
                <div className="mt-1">{getStatusBadge(billRunDetails.status)}</div>
              </div>
            </div>

            {/* Sollbuchungen */}
            {billRunDetails.charges && billRunDetails.charges.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Sollbuchungen ({billRunDetails.charges.length})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Mieter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Objekt</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Betrag</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Bezahlt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Fällig</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {billRunDetails.charges.map((charge) => (
                        <tr key={charge.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {charge.lease?.tenant?.first_name} {charge.lease?.tenant?.last_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {charge.lease?.unit?.property?.name} - {charge.lease?.unit?.unit_label}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                            {formatCurrency(charge.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-emerald-600">
                            {formatCurrency(charge.paid_amount || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getChargeStatusBadge(charge.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(charge.due_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Keine Sollbuchungen vorhanden
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal: Abgleich starten */}
      {showReconcileModal && (
        <Modal
          isOpen={showReconcileModal}
                titel="Abgleich starten"
          onClose={() => setShowReconcileModal(false)}
        >
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Wählen Sie die Zahlungsquellen aus, die mit den offenen Sollbuchungen abgeglichen werden sollen:
            </p>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={reconcileSources.csv}
                  onChange={(e) => setReconcileSources(prev => ({ ...prev, csv: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">CSV / Bank-Transaktionen</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Hochgeladene CSV-Dateien und Bank-Transaktionen
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={reconcileSources.cashbook}
                  onChange={(e) => setReconcileSources(prev => ({ ...prev, cashbook: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Kassenbuch</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Manuell eingetragene Kassenbuch-Einträge
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={reconcileSources.manual}
                  onChange={(e) => setReconcileSources(prev => ({ ...prev, manual: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Manuelle Transaktionen</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Manuell erstellte Bank-Transaktionen
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowReconcileModal(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => reconcileMutation.mutate()}
                disabled={reconcileMutation.isPending || Object.values(reconcileSources).every(v => !v)}
                className="flex-1"
              >
                {reconcileMutation.isPending ? "Läuft..." : "Abgleich starten"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Neue Sollstellung generieren */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        titel="Neue Sollstellung generieren"
      >
        <div className="space-y-3 sm:space-y-4 pb-2">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">Monat</label>
            <select
              value={generateForm.period_month}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, period_month: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">Jahr</label>
            <input
              type="number"
              value={generateForm.period_year}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, period_year: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">Beschreibung (optional)</label>
            <input
              type="text"
              value={generateForm.description}
              onChange={(e) => setGenerateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="z.B. Oktober 2025 - Mieteinnahmen"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="w-full sm:w-auto px-5 py-3 text-base font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-colors touch-manipulation"
            >
              Abbrechen
            </button>
            <button
              onClick={handleGenerateBillRun}
              disabled={generateMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {generateMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generiere...
                </>
              ) : (
                'Sollstellung generieren'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Warnungen anzeigen */}
      {showWarningsModal && (
        <Modal
          isOpen={showWarningsModal}
          titel="⚠️ Abgleich-Warnungen"
          onClose={() => setShowWarningsModal(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Es wurden {reconcileWarnings.length} Zahlung(en) mit Warnungen zugeordnet:
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reconcileWarnings.map((warning, index) => (
                <div
                  key={index}
                  className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                        {warning.source === 'cashbook' ? 'Kassenbuch' : 
                         warning.source === 'csv' ? 'CSV/Bank' : 
                         warning.source === 'bank_transaction' ? 'Bank-Transaktion' : 
                         'Manuell'}
                      </div>
                      <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                        {warning.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                      {warning.amount && (
                        <div className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                          Betrag: {formatCurrency(warning.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowWarningsModal(false)}
                variant="primary"
              >
                Verstanden
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Charge-Warnung Details */}
      {selectedChargeWarning && (
        <Modal
          isOpen={!!selectedChargeWarning}
          titel={`⚠️ Warnung: ${selectedChargeWarning.lease?.tenant?.first_name} ${selectedChargeWarning.lease?.tenant?.last_name}`}
          onClose={() => setSelectedChargeWarning(null)}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Sollbetrag</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedChargeWarning.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Bezahlt</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedChargeWarning.paid_amount || 0)}
                  </div>
                </div>
                {selectedChargeWarning.overpayment && (
                  <div className="col-span-2">
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">
                      ⚠️ Überzahlung: {formatCurrency(selectedChargeWarning.overpayment)}
                    </div>
                  </div>
                )}
                {selectedChargeWarning.underpayment && (
                  <div className="col-span-2">
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">
                      ⚠️ Unterzahlung: {formatCurrency(selectedChargeWarning.underpayment)} noch ausstehend
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Warnungen:</h4>
              <div className="space-y-2">
                {selectedChargeWarning.warnings?.map((warning, index) => (
                  <div
                    key={index}
                    className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-300">
                        {warning}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setSelectedChargeWarning(null)}
                variant="primary"
              >
                Verstanden
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sollstellungen;