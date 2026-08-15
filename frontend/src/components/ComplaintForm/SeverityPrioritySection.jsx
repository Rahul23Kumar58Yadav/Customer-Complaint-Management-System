import { useDispatch, useSelector } from "react-redux";
import FormField from "../common/FormField";
import { updateField } from "../../features/complaint/complaintSlice";

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SEVERITY_TO_PRIORITY = {
  critical: "high",
  major: "medium",
  minor: "low",
};

const SEVERITY_STYLES = {
  critical: "bg-gradient-to-r from-red-50 to-red-100/50 border-red-300 text-red-700",
  major: "bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-300 text-orange-700",
  minor: "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-700",
};

export default function SeverityPrioritySection() {
  const dispatch = useDispatch();
  const severity = useSelector((s) => s.complaint.form.initial_severity);
  const priority = useSelector((s) => s.complaint.form.priority);

  const suggestedPriority = SEVERITY_TO_PRIORITY[severity];
  const priorityDivergesFromSuggestion =
    suggestedPriority && priority && priority !== suggestedPriority;

  const handleSeverityChange = (e) => {
    const value = e.target.value;
    dispatch(updateField({ field: "initial_severity", value }));
    if (!priority && SEVERITY_TO_PRIORITY[value]) {
      dispatch(updateField({ field: "priority", value: SEVERITY_TO_PRIORITY[value] }));
    }
  };

  return (
    <section>
      <h3 className="section-title">4. Initial Assessment &amp; Priority</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Initial Severity</label>
          <select value={severity || ""} onChange={handleSeverityChange} className="form-input">
            <option value="">Awaiting AI extraction...</option>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FormField field="priority" label="Priority" options={PRIORITY_OPTIONS} />
          {priorityDivergesFromSuggestion && (
            <p className="text-[11px] text-blue-600 mt-1.5 font-medium">
              Note: "{severity}" severity typically maps to "{suggestedPriority}" priority.
            </p>
          )}
        </div>
      </div>

      {severity && (
        <div
          className={`mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3.5 py-1.5 shadow-sm ${SEVERITY_STYLES[severity]}`}
        >
          ● {severity.charAt(0).toUpperCase() + severity.slice(1)} severity selected
        </div>
      )}
    </section>
  );
}