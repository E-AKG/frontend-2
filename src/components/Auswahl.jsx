export default function Auswahl({
  label,
  name,
  value,
  onChange,
  optionen,
  required = false,
  error,
  className = "",
  disabled = false,
}) {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg text-[15px] transition-all
          ${error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-slate-900 focus:ring-slate-900"
          }
          ${disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
          focus:outline-none focus:ring-2 focus:ring-offset-0`}
      >
        <option value="">-- Auswählen --</option>
        {optionen.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

