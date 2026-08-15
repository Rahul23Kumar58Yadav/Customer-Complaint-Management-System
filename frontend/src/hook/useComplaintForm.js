import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateField,
  resetForm,
  selectValidationErrors,
  selectIsFormValid,
  selectMissingRequiredFields,
} from "../features/complaint/complaintSlice";
import { resetAiState } from "../features/aiAssistant/aiSlice";
import { saveComplaint, updateExistingComplaint } from "../features/complaint/complaintThunks";
import { showToast } from "../features/ui/uiSlice";

/**
 * Encapsulates all complaint-form read/write logic behind a single hook so
 * form components don't need to know Redux slice/action names directly.
 *
 * Usage:
 *   const { form, errors, isValid, setField, save, reset, isSaving } = useComplaintForm();
 */
export function useComplaintForm() {
  const dispatch = useDispatch();

  const form = useSelector((s) => s.complaint.form);
  const status = useSelector((s) => s.complaint.status);
  const fieldConfidence = useSelector((s) => s.complaint.fieldConfidence);
  const touchedFields = useSelector((s) => s.complaint.touchedFields);
  const isDirty = useSelector((s) => s.complaint.isDirty);
  const savedComplaintId = useSelector((s) => s.complaint.savedComplaintId);
  const saveStatus = useSelector((s) => s.complaint.saveStatus);
  const saveError = useSelector((s) => s.complaint.saveError);

  const errors = useSelector(selectValidationErrors);
  const isValid = useSelector(selectIsFormValid);
  const missingFields = useSelector(selectMissingRequiredFields);

  const setField = useCallback(
    (field, value) => dispatch(updateField({ field, value })),
    [dispatch]
  );

  const isAiFilled = useCallback(
    (field) => fieldConfidence[field] !== undefined,
    [fieldConfidence]
  );

  const confidenceFor = useCallback((field) => fieldConfidence[field], [fieldConfidence]);

  const isTouched = useCallback((field) => Boolean(touchedFields[field]), [touchedFields]);

  const save = useCallback(async () => {
    if (!isValid) {
      dispatch(
        showToast({
          type: "error",
          message: `Complete required fields first: ${missingFields
            .join(", ")
            .replace(/_/g, " ")}`,
        })
      );
      return { ok: false };
    }

    const action = savedComplaintId ? updateExistingComplaint() : saveComplaint();
    const result = await dispatch(action);
    const thunk = savedComplaintId ? updateExistingComplaint : saveComplaint;

    if (thunk.fulfilled.match(result)) {
      dispatch(
        showToast({
          type: "success",
          message: savedComplaintId ? "Complaint updated." : "Complaint saved successfully.",
        })
      );
      return { ok: true, data: result.payload };
    }

    dispatch(showToast({ type: "error", message: result.payload || "Failed to save complaint." }));
    return { ok: false, error: result.payload };
  }, [dispatch, isValid, missingFields, savedComplaintId]);

  const reset = useCallback(() => {
    dispatch(resetForm());
    dispatch(resetAiState());
  }, [dispatch]);

  return useMemo(
    () => ({
      form,
      status,
      errors,
      isValid,
      missingFields,
      isDirty,
      savedComplaintId,
      isSaving: saveStatus === "loading",
      saveError,
      isAiFilled,
      confidenceFor,
      isTouched,
      setField,
      save,
      reset,
    }),
    [
      form,
      status,
      errors,
      isValid,
      missingFields,
      isDirty,
      savedComplaintId,
      saveStatus,
      saveError,
      isAiFilled,
      confidenceFor,
      isTouched,
      setField,
      save,
      reset,
    ]
  );
}

export default useComplaintForm;