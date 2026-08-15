const VARIANTS = {
  primary:
    "bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_1px_2px_rgba(37,99,235,0.3),0_2px_8px_rgba(37,99,235,0.25)] hover:shadow-[0_2px_10px_rgba(37,99,235,0.35)] disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none",
  secondary:
    "bg-white border border-gray-200 text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50",
  danger:
    "bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_1px_2px_rgba(220,38,38,0.3),0_2px_8px_rgba(220,38,38,0.25)] disabled:from-red-300 disabled:to-red-300 disabled:shadow-none",
  ghost:
    "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50",
  success:
    "bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-[0_1px_2px_rgba(22,163,74,0.3),0_2px_8px_rgba(22,163,74,0.25)] disabled:from-green-300 disabled:to-green-300 disabled:shadow-none",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-5 py-3 gap-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed
        disabled:active:scale-100 focus:outline-none focus:ring-4 focus:ring-blue-500/15
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${fullWidth ? "w-full" : ""}
        ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}