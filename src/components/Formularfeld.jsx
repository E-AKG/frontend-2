export default function Formularfeld({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = "",
  disabled = false,
  icon,
}) {
  const inputClasses = `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl text-sm sm:text-[15px] transition-all duration-200 min-h-[44px] sm:min-h-[48px]
    ${error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
      : "border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-200 active:border-gray-300"
    }
    ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200" : "text-gray-900"}
    ${icon ? "pl-10 sm:pl-11" : ""}
    focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-400`;

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={4}
            className={`${inputClasses} resize-none`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={inputClasses}
          />
        )}
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

