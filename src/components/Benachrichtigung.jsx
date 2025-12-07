import { useState, useEffect } from "react";

let benachrichtigungCallback = null;

export function useBenachrichtigung() {
  const [benachrichtigung, setBenachrichtigung] = useState(null);

  useEffect(() => {
    benachrichtigungCallback = (nachricht, typ = "erfolg") => {
      setBenachrichtigung({ nachricht, typ });
      setTimeout(() => setBenachrichtigung(null), 3000);
    };
  }, []);

  const zeigeBenachrichtigung = (nachricht, typ = "erfolg") => {
    setBenachrichtigung({ nachricht, typ });
    setTimeout(() => setBenachrichtigung(null), 3000);
  };

  return { benachrichtigung, zeigeBenachrichtigung };
}

export function zeigeBenachrichtigung(nachricht, typ = "erfolg") {
  if (benachrichtigungCallback) {
    benachrichtigungCallback(nachricht, typ);
  }
}

export default function Benachrichtigung({ benachrichtigung, onClose }) {
  if (!benachrichtigung) return null;

  const { nachricht, typ } = benachrichtigung;

  const typStile = {
    erfolg: "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700 shadow-lg shadow-emerald-500/30",
    fehler: "bg-gradient-to-r from-rose-500 to-rose-600 border-rose-700 shadow-lg shadow-rose-500/30",
    info: "bg-gradient-to-r from-primary-500 to-primary-600 border-primary-700 shadow-lg shadow-primary-500/30",
    warnung: "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-700 shadow-lg shadow-amber-500/30",
  };

  const icons = {
    erfolg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    fehler: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warnung: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-slide-up max-w-sm w-[calc(100%-2rem)] sm:w-auto">
      <div
        className={`${typStile[typ]} text-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl border-2 flex items-center space-x-3 min-w-0 animate-scale-in backdrop-blur-sm`}
      >
        <div className="flex-shrink-0 w-6 h-6">{icons[typ]}</div>
        <span className="flex-1 text-[15px] font-semibold leading-relaxed">{nachricht}</span>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          aria-label="Schließen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

