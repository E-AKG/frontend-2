export default function Modal({ isOpen, onClose, titel, children, groesse = "md" }) {
  if (!isOpen) return null;

  const groessenKlassen = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-4 pb-4 px-2 sm:px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl ${groessenKlassen[groesse]} w-full max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-hidden border border-gray-200/50 animate-scale-in custom-scrollbar`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2">{titel}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(100vh-8rem)] sm:max-h-[calc(90vh-80px)] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}
