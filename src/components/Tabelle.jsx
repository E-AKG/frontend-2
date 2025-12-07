export default function Tabelle({ spalten, daten, onZeileKlick, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <span className="mt-6 text-gray-600 font-medium">Daten werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {spalten.map((spalte, idx) => (
                <th
                  key={idx}
                  className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  {spalte.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {daten.length === 0 ? (
              <tr>
                <td
                  colSpan={spalten.length}
                  className="px-6 py-12 sm:py-16 lg:py-20 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-inner">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-semibold text-base sm:text-lg mb-1">Keine Daten vorhanden</p>
                    <p className="text-xs sm:text-sm text-gray-500 px-4">Es wurden noch keine Einträge erstellt</p>
                  </div>
                </td>
              </tr>
            ) : (
              daten.map((zeile, zeilenIdx) => (
                <tr
                  key={zeilenIdx}
                  onClick={() => onZeileKlick && onZeileKlick(zeile)}
                  className={`${
                    onZeileKlick
                      ? "cursor-pointer hover:bg-gray-50 transition-all duration-150 group"
                      : "hover:bg-gray-50/50 transition-colors"
                  }`}
                >
                  {spalten.map((spalte, spaltenIdx) => (
                    <td
                      key={spaltenIdx}
                      className={`px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm text-gray-900 ${
                        onZeileKlick ? "group-hover:text-gray-700" : ""
                      }`}
                    >
                      {spalte.render ? spalte.render(zeile) : zeile[spalte.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {daten.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold text-base mb-1">Keine Daten vorhanden</p>
              <p className="text-xs text-gray-500">Es wurden noch keine Einträge erstellt</p>
            </div>
          </div>
        ) : (
          daten.map((zeile, zeilenIdx) => (
            <div
              key={zeilenIdx}
              onClick={() => onZeileKlick && onZeileKlick(zeile)}
              className={`p-4 ${
                onZeileKlick
                  ? "cursor-pointer active:bg-gray-50 transition-colors"
                  : ""
              }`}
            >
              <div className="space-y-2">
                {spalten
                  .filter(spalte => spalte.key !== 'actions')
                  .map((spalte, spaltenIdx) => (
                    <div key={spaltenIdx} className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide min-w-[100px]">
                        {spalte.label}:
                      </span>
                      <span className="text-sm text-gray-900 font-medium text-right flex-1">
                        {spalte.render ? spalte.render(zeile) : zeile[spalte.key]}
                      </span>
                    </div>
                  ))}
                {spalten.find(sp => sp.key === 'actions') && (
                  <div className="pt-2 border-t border-gray-200">
                    {spalten.find(sp => sp.key === 'actions').render(zeile)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

