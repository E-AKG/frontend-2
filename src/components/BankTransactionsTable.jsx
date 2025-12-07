import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { RefreshCw, ChevronLeft, ChevronRight, Calendar, Euro, User, FileText, CheckCircle2, Clock } from 'lucide-react';
import Button from './Button';

export default function BankTransactionsTable() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/api/bank/transactions');
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('Fehler beim Laden der Transaktionen:', err);
      setError('Fehler beim Laden der Transaktionen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    
    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(() => {
      loadTransactions();
    }, 30000);
    
    // Höre auf CSV-Upload-Events
    const handleTransactionsUpdated = () => {
      loadTransactions();
    };
    window.addEventListener('transactions-updated', handleTransactionsUpdated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('transactions-updated', handleTransactionsUpdated);
    };
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-16">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <span className="mt-6 text-gray-600 font-medium">Transaktionen werden geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6">
        <div className="flex items-start p-5 bg-red-50 border-2 border-red-200 rounded-xl">
          <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-16">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">Keine Transaktionen gefunden</p>
          <p className="text-sm text-gray-500 mb-6">Synchronisieren Sie Transaktionen, um sie hier anzuzeigen</p>
          <Button onClick={loadTransactions} icon={<RefreshCw className="w-5 h-5" />}>
            Aktualisieren
          </Button>
        </div>
      </div>
    );
  }

  // Berechne Paginierung
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-5 border-b-2 border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Euro className="w-6 h-6 text-primary-600" />
            Transaktionen
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {transactions.length.toLocaleString('de-DE')} Transaktionen insgesamt
          </p>
        </div>
        <Button
          onClick={loadTransactions}
          disabled={loading}
          variant="secondary"
          icon={loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        >
          {loading ? "Aktualisiert..." : "Aktualisieren"}
        </Button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datum
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Betrag
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Empfänger
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Verwendungszweck
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-all duration-150 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(transaction.transaction_date).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-base font-bold flex items-center gap-1.5 ${
                    parseFloat(transaction.amount) > 0 
                      ? 'text-emerald-700' 
                      : 'text-gray-900'
                  }`}>
                    {parseFloat(transaction.amount) > 0 ? (
                      <>
                        <span className="text-emerald-500">+</span>
                        <span>{parseFloat(transaction.amount).toFixed(2).replace('.', ',')} €</span>
                      </>
                    ) : (
                      <span>{parseFloat(transaction.amount).toFixed(2).replace('.', ',')} €</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.counterpart_name || (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 max-w-md truncate group-hover:max-w-none group-hover:whitespace-normal">
                    {transaction.purpose || (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.is_matched ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border-2 border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Zugeordnet
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border-2 border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      Offen
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginierung */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-5 border-t-2 border-gray-200 bg-gray-50/50">
          <div className="text-sm font-semibold text-gray-600">
            Seite <span className="text-gray-900">{currentPage}</span> von <span className="text-gray-900">{totalPages}</span> • 
            Zeige <span className="text-gray-900">{startIndex + 1}</span>-<span className="text-gray-900">{Math.min(endIndex, transactions.length)}</span> von <span className="text-gray-900">{transactions.length.toLocaleString('de-DE')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Zurück
            </Button>
            
            {/* Seiten-Nummern */}
            <div className="flex gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                const pageNum = idx + 1;
                if (totalPages <= 5) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {totalPages > 5 && (
                <>
                  {currentPage > 3 && <span className="px-2 py-2 text-gray-400">...</span>}
                  {currentPage > 3 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => setCurrentPage(currentPage)}
                      className="min-w-[40px] px-3 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-md"
                    >
                      {currentPage}
                    </button>
                  )}
                  {currentPage < totalPages - 2 && <span className="px-2 py-2 text-gray-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}