import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '../contexts/AppContext';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Tabelle from '../components/Tabelle';
import { formatCurrency, formatDate } from '../utils/formatting';

const Sollstellungen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedClient, selectedFiscalYear } = useApp();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedBillRun, setSelectedBillRun] = useState(null);
  
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
    queryKey: ['billRuns', filters, pagination.page, pagination.pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page,
        page_size: pagination.pageSize,
        ...(filters.status && { status: filters.status }),
        ...(filters.year && { period_year: filters.year }),
        ...(filters.month && { period_month: filters.month })
      });
      const response = await axiosInstance.get(`/api/bill-runs?${params}`);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
      return response.data.items || [];
    },
    staleTime: 10000, // Data is fresh for 10 seconds
  });

  // React Query: Fetch Charges
  const { data: charges = [], refetch: refetchCharges } = useQuery({
    queryKey: ['charges'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/charges', {
        params: {
          page: 1,
          page_size: 200
        }
      });
      return response.data.items || [];
    },
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
    queryKey: ['stats', filters.month, filters.year],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/stats/dashboard', {
        params: {
          month: filters.month,
          year: filters.year
        }
      });
      return response.data;
    },
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
        <div>
          <div className="font-medium">{item.lease?.tenant?.first_name} {item.lease?.tenant?.last_name}</div>
          <div className="text-sm text-gray-500">{item.lease?.unit?.property?.name} - {item.lease?.unit?.unit_label}</div>
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
        <div className="text-green-600 font-medium">
          {formatCurrency(item.paid_amount || 0)}
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              <svg className="w-7 h-7 sm:w-9 sm:h-9 lg:w-12 lg:h-12 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">Sollstellungen</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Verwalten Sie Mieteinnahmen und Zahlungseingänge
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Daten aktualisieren"
            >
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 sm:mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>
            <Button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-5 sm:px-7 py-3 sm:py-4 text-sm sm:text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Neue Sollstellung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>
        </div>
      </div>

      <div>
        {/* Auto-Sync Info Banner */}
        {(generateMutation.isPending || deleteMutation.isPending || loading) && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center">
              <svg className="animate-spin h-6 w-6 sm:h-7 sm:w-7 text-blue-600 mr-3 sm:mr-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="text-base sm:text-lg font-semibold text-blue-900">
                  Daten werden aktualisiert...
                </p>
                <p className="text-sm sm:text-base text-blue-700 mt-0.5">
                  Sollstellungen und Statistiken werden automatisch neu geladen
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard-Karten - Größer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-primary-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2 sm:mb-3">Erwartete Einnahmen</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{formatCurrency(stats.total_expected)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2 sm:mb-3">Bereits bezahlt</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">{formatCurrency(stats.total_paid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-red-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2 sm:mb-3">Ausstehend</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">{formatCurrency(stats.total_outstanding)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 p-5 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 sm:mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="w-full">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2 sm:mb-3">Zahlungsrate</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600">{stats.payment_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-center mb-4 sm:mb-5">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5">
            <div>
              <label className="block text-base sm:text-lg font-semibold text-slate-700 mb-2 sm:mb-3">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base sm:text-lg"
              >
                <option value="">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="finalized">Finalisiert</option>
                <option value="sent">Versendet</option>
                <option value="closed">Abgeschlossen</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-semibold text-slate-700 mb-2 sm:mb-3">Jahr</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base sm:text-lg"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-semibold text-slate-700 mb-2 sm:mb-3">Monat</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 text-base sm:text-lg"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('de-DE', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 })}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors inline-flex items-center justify-center border-2 border-slate-200"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Sollstellungen Tabelle */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 mb-6 sm:mb-8 lg:mb-10 overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b-2 border-gray-200">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Sollstellungen</h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 mt-1 sm:mt-2">Übersicht aller generierten Sollstellungen</p>
          </div>
          <Tabelle
            spalten={billRunColumns}
            daten={billRuns}
            loading={loading}
          />
        </div>

        {/* Offene Sollbuchungen */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b-2 border-gray-200">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Offene Sollbuchungen</h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-500 mt-1 sm:mt-2">Alle noch nicht zugeordneten Sollbuchungen</p>
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
    </div>
  );
};

export default Sollstellungen;