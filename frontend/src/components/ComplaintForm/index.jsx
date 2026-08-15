import { useDispatch, useSelector } from "react-redux";
import OriginCustomerSection from "./OriginCustomerSection";
import ProductBatchSection from "./ProductBatchSection";
import ComplaintDetailsSection from "./ComplaintDetailsSection";
import SeverityPrioritySection from "./SeverityPrioritySection";
import StatusBadge from "../common/StatusBadge";
import { saveComplaint } from "../../features/complaint/complaintThunks";
import { showToast, openConfirmDialog } from "../../features/ui/uiSlice";

const REQUIRED_FIELDS = [
  "customer_name",
  "product_name",
  "batch_lot_number",
  "complaint_type",
  "detailed_description",
  "initial_severity",
];

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.complaint.status);
  const saveStatus = useSelector((s) => s.complaint.saveStatus);
  const form = useSelector((s) => s.complaint.form);
  const aiCompletenessScore = useSelector((s) => s.ai.completenessScore);

  const missingRequired = REQUIRED_FIELDS.filter((f) => !String(form[f] || "").trim());
  const canSave = missingRequired.length === 0;

  const handleReset = () => {
    dispatch(
      openConfirmDialog({
        title: "Reset complaint form?",
        message: "This clears all fields and AI results. This cannot be undone.",
        confirmLabel: "Reset",
        intent: "RESET_FORM",
      })
    );
  };

  const handleSave = async () => {
    if (!canSave) {
      dispatch(
        showToast({
          type: "error",
          message: `Complete required fields first: ${missingRequired
            .join(", ")
            .replace(/_/g, " ")}`,
        })
      );
      return;
    }
    const result = await dispatch(saveComplaint());
    if (saveComplaint.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Complaint saved successfully." }));
    } else {
      dispatch(showToast({ type: "error", message: result.payload || "Failed to save complaint." }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.06)] border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Log Customer Complaint</h1>
          <p className="text-sm text-gray-500 mt-0.5">API &amp; FDF Quality Assurance Module</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {aiCompletenessScore !== null && aiCompletenessScore !== undefined && (
        <div className="mb-4 flex items-center gap-2.5 text-xs text-gray-500 bg-gray-50/70 border border-gray-100 rounded-lg px-3 py-2">
          <div className="flex-1 h-1.5 bg-gray-200/70 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                aiCompletenessScore >= 80
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : aiCompletenessScore >= 50
                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                  : "bg-gradient-to-r from-red-400 to-red-500"
              }`}
              style={{ width: `${aiCompletenessScore}%` }}
            />
          </div>
          <span className="font-medium whitespace-nowrap">{aiCompletenessScore}% complete (AI-assessed)</span>
        </div>
      )}

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        <OriginCustomerSection />
        <hr className="border-gray-100" />
        <ProductBatchSection />
        <hr className="border-gray-100" />
        <ComplaintDetailsSection />
        <hr className="border-gray-100" />
        <SeverityPrioritySection />
      </div>

      <div className="pt-6 mt-2 border-t border-gray-100">
        {!canSave && (
          <p className="text-[11px] text-amber-600 mb-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            Missing required: {missingRequired.join(", ").replace(/_/g, " ")}
          </p>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors"
          >
            ↺ Reset Form
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === "loading"}
            title={!canSave ? "Complete required fields to save" : undefined}
            className={`text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-white transition-all active:scale-[0.98] ${
              canSave
                ? "bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-[0_1px_2px_rgba(37,99,235,0.3),0_2px_8px_rgba(37,99,235,0.25)] disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {saveStatus === "loading" ? "Saving..." : "💾 Save Complaint"}
          </button>
        </div>
      </div>
    </div>
  );
}