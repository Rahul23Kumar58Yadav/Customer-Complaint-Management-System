import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ComplaintForm from "../components/ComplaintForm";
import AICopilot from "../components/AICopilot";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { saveComplaint, updateExistingComplaint } from "../features/complaint/complaintThunks";
import { showToast, openConfirmDialog } from "../features/ui/uiSlice";

export default function ComplaintIntakePage() {
  const dispatch = useDispatch();
  const isDirty = useSelector((s) => s.complaint.isDirty);
  const savedComplaintId = useSelector((s) => s.complaint.savedComplaintId);
  const isValid = useSelector((s) => {
    const REQUIRED = [
      "customer_name",
      "product_name",
      "batch_lot_number",
      "complaint_type",
      "detailed_description",
      "initial_severity",
    ];
    return REQUIRED.every((f) => String(s.complaint.form[f] || "").trim());
  });

  // Warn before closing/refreshing the tab with unsaved changes -
  // matters here since AI extraction can populate a lot of field data quickly.
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Keyboard shortcuts: Ctrl/Cmd+S to save, Ctrl/Cmd+Shift+R to reset (with confirmation).
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!isValid) {
          dispatch(showToast({ type: "error", message: "Complete required fields before saving." }));
          return;
        }
        const action = savedComplaintId ? updateExistingComplaint() : saveComplaint();
        dispatch(action).then((result) => {
          const fulfilled = savedComplaintId
            ? updateExistingComplaint.fulfilled.match(result)
            : saveComplaint.fulfilled.match(result);
          dispatch(
            showToast({
              type: fulfilled ? "success" : "error",
              message: fulfilled ? "Saved via Ctrl+S." : result.payload || "Save failed.",
            })
          );
        });
      }
      if (isMeta && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        dispatch(
          openConfirmDialog({
            title: "Reset complaint form?",
            message: "This clears all fields and AI results. This cannot be undone.",
            confirmLabel: "Reset",
            intent: "RESET_FORM",
          })
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, isValid, savedComplaintId]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-8 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">
              Tip: <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">Ctrl</kbd>+
              <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">S</kbd> to save
            </p>
          </div>
          {isDirty && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1">
              ● Unsaved changes
            </span>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="h-[75vh] lg:h-[calc(100vh-6rem)]">
            <ComplaintForm />
          </div>
          <div className="h-[75vh] lg:h-[calc(100vh-6rem)]">
            <AICopilot />
          </div>
        </div>
      </div>
      <Toast />
      <ConfirmDialog />
    </div>
  );
}