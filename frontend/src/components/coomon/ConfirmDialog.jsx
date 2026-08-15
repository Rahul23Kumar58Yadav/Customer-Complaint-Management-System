import { useDispatch, useSelector } from "react-redux";
import Modal from "./Modal";
import Button from "./Button";
import { closeConfirmDialog, showToast } from "../../features/ui/uiSlice";
import { resetForm } from "../../features/complaint/complaintSlice";
import { resetAiState } from "../../features/aiAssistant/aiSlice";
import { deleteComplaint as deleteComplaintApi } from "../../services/api";

const INTENT_HANDLERS = {
  RESET_FORM: (dispatch) => {
    dispatch(resetForm());
    dispatch(resetAiState());
    dispatch(showToast({ type: "info", message: "Form reset." }));
  },
  DELETE_COMPLAINT: async (dispatch, payload) => {
    try {
      await deleteComplaintApi(payload.complaintId);
      dispatch(resetForm());
      dispatch(resetAiState());
      dispatch(showToast({ type: "success", message: "Complaint deleted." }));
    } catch (err) {
      dispatch(
        showToast({
          type: "error",
          message: err.response?.data?.detail || "Failed to delete complaint.",
        })
      );
    }
  },
};

export default function ConfirmDialog() {
  const dispatch = useDispatch();
  const dialog = useSelector((s) => s.ui.confirmDialog);

  const handleConfirm = async () => {
    if (dialog?.intent && INTENT_HANDLERS[dialog.intent]) {
      await INTENT_HANDLERS[dialog.intent](dispatch, dialog.payload || {});
    }
    dispatch(closeConfirmDialog());
  };

  return (
    <Modal
      isOpen={Boolean(dialog)}
      onClose={() => dispatch(closeConfirmDialog())}
      title={dialog?.title || "Are you sure?"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => dispatch(closeConfirmDialog())}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {dialog?.confirmLabel || "Confirm"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{dialog?.message}</p>
    </Modal>
  );
}