export default function Modal({ isOpen, onClose, titel, children, groesse = "md", kompakt = false }) {
  if (!isOpen) return null;

  const groessenKlassen = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  // Höhe: kompakt = kürzer, normal = mittlere Höhe
  const hoeheKlasse = kompakt 
    ? "max-h-[85vh] sm:max-h-[70vh]"
    : "max-h-[90vh] sm:max-h-[85vh]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop - Verwischter Hintergrund */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal - Kompakt und zentriert */}
      <div
        className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl ${groessenKlassen[groesse]} w-full ${hoeheKlasse} flex flex-col overflow-hidden border border-gray-200/50 animate-scale-in`}
      >
        {/* Header - Fixed mit größerem X-Button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2">{titel}</h2>
          <button
            onClick={onClose}
            className="p-2.5 sm:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Schließen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - Scrollbar */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
