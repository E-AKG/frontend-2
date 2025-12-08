export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon,
  iconPosition = "left",
}) {
  const baseStyles = "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none inline-flex items-center justify-center gap-2 touch-manipulation active:scale-95";

  const variants = {
    primary: "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500 shadow-lg",
    secondary: "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-gray-300 shadow-sm",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-emerald-500 shadow-md",
    danger: "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-rose-500 shadow-md",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300",
    outline: "bg-transparent text-primary-700 border-2 border-primary-600 hover:bg-primary-600 hover:text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500",
    white: "bg-white text-primary-700 border-2 border-white hover:bg-gray-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-300 shadow-md",
  };

  const sizes = {
    sm: "px-3 sm:px-4 py-2 text-xs sm:text-sm h-[36px] sm:h-[40px]",
    md: "px-4 sm:px-5 py-2.5 text-sm sm:text-[15px] h-[40px] sm:h-[44px]",
    lg: "px-5 sm:px-6 py-3 text-base h-[44px] sm:h-[48px]",
  };

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-5 h-5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && iconPosition === "left" && <span className={iconSize[size]}>{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className={iconSize[size]}>{icon}</span>}
    </button>
  );
}

