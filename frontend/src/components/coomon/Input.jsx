export default function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  icon,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value, e)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${icon ? "pl-9" : ""} ${
            error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : ""
          }`}
          {...rest}
        />
      </div>
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      {!error && hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 4,
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value, e)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-input resize-y ${error ? "border-red-400 focus:ring-red-400" : ""}`}
        {...rest}
      />
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      {!error && hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}