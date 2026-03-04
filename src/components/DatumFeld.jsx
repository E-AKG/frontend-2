import { useState, useEffect, useRef } from "react";

/**
 * Formatiert YYYY-MM-DD zu DD.MM.YYYY
 */
function toDisplayFormat(value) {
  if (!value || typeof value !== "string") return "";
  const parts = value.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  return `${d || ""}.${m || ""}.${y || ""}`.replace(/\.$/, "");
}

/**
 * Formatiert DD.MM.YYYY zu YYYY-MM-DD (oder leer wenn unvollständig)
 */
function toValueFormat(display) {
  const digits = display.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

/**
 * Verarbeitet Zifferneingabe: fügt automatisch Punkte nach Tag und Monat ein
 */
function formatDisplayInput(digits) {
  if (digits.length > 8) digits = digits.slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "." + digits.slice(2);
  return digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4);
}

export default function DatumFeld({
  label,
  name,
  value,
  onChange,
  placeholder = "TT.MM.JJJJ",
  required = false,
  error,
  className = "",
  disabled = false,
  icon,
}) {
  const [displayValue, setDisplayValue] = useState(() => toDisplayFormat(value));
  const lastSentValue = useRef(value);

  // Sync von außen nur wenn sich value extern geändert hat (z.B. Form-Reset)
  useEffect(() => {
    if (value === lastSentValue.current) return;
    lastSentValue.current = value;
    setDisplayValue(toDisplayFormat(value));
  }, [value]);

  const applyDisplay = (newDisplay) => {
    setDisplayValue(newDisplay);
    const val = toValueFormat(newDisplay);
    lastSentValue.current = val;
    onChange({ target: { name, value: val || "" } });
  };

  const inputClasses = `w-full px-4 sm:px-5 py-3.5 sm:py-4 border-2 rounded-xl text-base sm:text-lg transition-all duration-200 min-h-[52px] sm:min-h-[56px]
    ${error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
      : "border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-200 active:border-gray-300"
    }
    ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200" : "text-gray-900"}
    ${icon ? "pl-12 sm:pl-14" : ""}
    focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-400`;

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const newDisplay = formatDisplayInput(raw);
    applyDisplay(newDisplay);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && displayValue.length > 0) {
      e.preventDefault();
      const digits = displayValue.replace(/\D/g, "");
      const newDigits = digits.slice(0, -1);
      const newDisplay = formatDisplayInput(newDigits);
      applyDisplay(newDisplay);
    }
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData?.getData("text") || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(pasted)) {
      e.preventDefault();
      const display = toDisplayFormat(pasted);
      applyDisplay(display);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm sm:text-base lg:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          name={name}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={10}
          className={inputClasses}
        />
      </div>
      {error && (
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
