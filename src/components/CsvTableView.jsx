import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { bankApi } from '../api/bankApi';
import Button from './Button';
import Benachrichtigung, { useBenachrichtigung } from './Benachrichtigung';

export default function CsvTableView({ csvFileId, onClose }) {
  const { benachrichtigung, zeigeBenachrichtigung } = useBenachrichtigung();
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    if (csvFileId) {
      loadCsvData();
    }
  }, [csvFileId, currentPage]);

  const loadCsvData = async () => {
    try {
      setLoading(true);
      const response = await bankApi.getCsvFile(csvFileId, currentPage, pageSize);
      setCsvData(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der CSV-Daten:', error);
      zeigeBenachrichtigung('Fehler beim Laden der CSV-Daten', 'fehler');
    } finally {
      setLoading(false);
    }
  };

  if (!csvFileId) {
    return null;
  }

  if (loading && !csvData) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600"></div>
          <span className="ml-4 text-gray-600">Lade CSV-Daten...</span>
        </div>
      </div>
    );
  }

  if (!csvData) {
    return null;
  }

  const { data, page, total_pages, total_rows, column_mapping } = csvData;
  
  // Extrahiere Spalten-Header (entweder aus column_mapping.headers oder aus der ersten Zeile)
  const headers = column_mapping?.headers || (data.length > 0 && data[0].raw_data ? Object.keys(data[0].raw_data) : []);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      <Benachrichtigung benachrichtigung={benachrichtigung} onClose={() => {}} />
      
      {/* Header */}
      <div className="px-6 py-5 border-b-2 border-gray-200 bg-gray-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">CSV-Daten</h3>
          <p className="text-sm text-gray-600 mt-1">
            Zeige {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total_rows)} von {total_rows.toLocaleString('de-DE')} Zeilen
            {headers.length > 0 && ` • ${headers.length} Spalten`}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {headers.length > 0 ? (
                headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-300 sticky top-0 bg-gray-100 z-10"
                  >
                    {header || `Spalte ${idx + 1}`}
                  </th>
                ))
              ) : (
                <>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-300">
                    Spalte 1
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-300">
                    Spalte 2
                  </th>
                </>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-300 sticky top-0 bg-gray-100 z-10">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${
                    row.error ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {headers.length > 0 ? (
                    headers.map((header, idx) => {
                      const cellValue = row.raw_data && row.raw_data[header] !== undefined 
                        ? String(row.raw_data[header]) 
                        : (row[header] !== undefined ? String(row[header]) : '—');
                      
                      return (
                        <td 
                          key={idx} 
                          className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap"
                          title={cellValue.length > 50 ? cellValue : undefined}
                        >
                          <div className="max-w-xs truncate">
                            {cellValue || '—'}
                          </div>
                        </td>
                      );
                    })
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        {row.error || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                        —
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                    {row.imported ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border-2 border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Importiert
                      </span>
                    ) : row.error ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border-2 border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {row.error.substring(0, 20)}...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border-2 border-gray-200">
                        Gespeichert
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length + 1} className="px-6 py-8 text-center text-gray-500">
                  Keine Daten verfügbar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginierung */}
      {total_pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-5 border-t-2 border-gray-200 bg-gray-50/50">
          <div className="text-sm font-semibold text-gray-600">
            Seite <span className="text-gray-900">{page}</span> von <span className="text-gray-900">{total_pages}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="secondary"
              size="sm"
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Zurück
            </Button>
            
            {/* Seiten-Nummern */}
            <div className="flex gap-1">
              {[...Array(Math.min(5, total_pages))].map((_, idx) => {
                const pageNum = idx + 1;
                if (total_pages <= 5) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                        page === pageNum
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
              
              {total_pages > 5 && (
                <>
                  {page > 3 && <span className="px-2 py-2 text-gray-400">...</span>}
                  {page > 3 && page < total_pages - 2 && (
                    <button
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px] px-3 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-md"
                    >
                      {page}
                    </button>
                  )}
                  {page < total_pages - 2 && <span className="px-2 py-2 text-gray-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(total_pages)}
                    className={`min-w-[40px] px-3 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                      page === total_pages
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {total_pages}
                  </button>
                </>
              )}
            </div>
            
            <Button
              onClick={() => setCurrentPage(Math.min(total_pages, page + 1))}
              disabled={page === total_pages}
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

