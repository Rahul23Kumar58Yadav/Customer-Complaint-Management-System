import { useDispatch, useSelector } from "react-redux";
import { updateField } from "../../features/complaint/complaintSlice";

/**
 * Generic bound form field. Shows a small "AI" badge with confidence %
 * when the current value was populated by the extraction pipeline and
 * hasn't been manually edited since (see complaintSlice.updateField, which
 * deletes the confidence entry for a field the moment the user types in it).
 */
export default function FormField({
  field,
  label,
  type = "text",
  placeholder = "Awaiting AI extraction...",
  suffix,
  options, // for select fields: [{ value, label }]
  className = "",
}) {
  const dispatch = useDispatch();
  const value = useSelector((s) => s.complaint.form[field]);
  const confidence = useSelector((s) => s.complaint.fieldConfidence[field]);

  const handleChange = (e) => dispatch(updateField({ field, value: e.target.value }));

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="form-label !mb-0">{label}</label>
        {confidence !== undefined && confidence !== null && (
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            AI · {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      <div className="relative">
        {options ? (
          <select value={value || ""} onChange={handleChange} className="form-input">
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            rows={4}
            className="form-input resize-y"
          />
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={handleChange}
            placeholder={placeholder}
            className="form-input"
          />
        )}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}