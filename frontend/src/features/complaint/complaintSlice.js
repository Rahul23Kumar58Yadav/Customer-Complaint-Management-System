import { createSlice } from "@reduxjs/toolkit";
import { saveComplaint, fetchComplaint, updateExistingComplaint } from "./complaintThunks";

const initialFormState = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength_grade: "",
  batch_lot_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity_affected: "",
  quantity_unit: "kg",
  complaint_type: "",
  complaint_date: "",
  detailed_description: "",
  initial_severity: "",
  priority: "",
};

const REQUIRED_FIELDS = [
  "customer_name",
  "product_name",
  "batch_lot_number",
  "complaint_type",
  "detailed_description",
  "initial_severity",
];

const initialState = {
  form: initialFormState,
  status: "pending_triage", // pending_triage | under_review | investigating | capa_assigned | closed
  fieldConfidence: {},       // { field_name: 0.0-1.0 } from AI extraction, drives "AI-filled" badges
  touchedFields: {},         // { field_name: true } - fields the reviewer has manually edited
  isDirty: false,            // true once any field differs from last saved/loaded state
  savedComplaintId: null,
  saveStatus: "idle",        // idle | loading | succeeded | failed
  saveError: null,
  loadStatus: "idle",        // idle | loading | succeeded | failed
  loadError: null,
};

function validate(form) {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (!String(form[field] || "").trim()) errors[field] = "Required";
  });
  if (
    form.manufacturing_date &&
    form.expiry_date &&
    new Date(form.manufacturing_date) >= new Date(form.expiry_date)
  ) {
    errors.expiry_date = "Must be after manufacturing date";
  }
  return errors;
}

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    updateField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
      state.touchedFields[field] = true;
      state.isDirty = true;
      // manual edits invalidate the "AI-filled" badge for that field
      delete state.fieldConfidence[field];
    },
    populateFromExtraction(state, action) {
      const { extracted_fields, extraction_confidence } = action.payload;
      Object.entries(extracted_fields || {}).forEach(([key, value]) => {
        // Don't clobber a field the reviewer has already manually edited.
        if (key in state.form && value !== null && value !== undefined && !state.touchedFields[key]) {
          state.form[key] = value;
        }
      });
      state.fieldConfidence = { ...state.fieldConfidence, ...(extraction_confidence || {}) };
      state.isDirty = true;
    },
    resetForm(state) {
      state.form = initialFormState;
      state.fieldConfidence = {};
      state.touchedFields = {};
      state.isDirty = false;
      state.savedComplaintId = null;
      state.saveStatus = "idle";
      state.loadStatus = "idle";
    },
    setStatus(state, action) {
      state.status = action.payload;
      state.isDirty = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveComplaint.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(saveComplaint.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.savedComplaintId = action.payload.id;
        state.status = action.payload.status;
        state.isDirty = false;
      })
      .addCase(saveComplaint.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload || action.error.message;
      })
      .addCase(updateExistingComplaint.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(updateExistingComplaint.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.status = action.payload.status;
        state.isDirty = false;
      })
      .addCase(updateExistingComplaint.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.payload || action.error.message;
      })
      .addCase(fetchComplaint.pending, (state) => {
        state.loadStatus = "loading";
        state.loadError = null;
      })
      .addCase(fetchComplaint.fulfilled, (state, action) => {
        state.loadStatus = "succeeded";
        const data = action.payload;
        Object.keys(state.form).forEach((key) => {
          if (data[key] !== undefined && data[key] !== null) state.form[key] = data[key];
        });
        state.status = data.status;
        state.savedComplaintId = data.id;
        state.touchedFields = {};
        state.isDirty = false;
      })
      .addCase(fetchComplaint.rejected, (state, action) => {
        state.loadStatus = "failed";
        state.loadError = action.payload || action.error.message;
      });
  },
});

export const { updateField, populateFromExtraction, resetForm, setStatus } = complaintSlice.actions;

// --- Selectors ---
export const selectValidationErrors = (state) => validate(state.complaint.form);
export const selectIsFormValid = (state) =>
  Object.keys(validate(state.complaint.form)).length === 0;
export const selectMissingRequiredFields = (state) =>
  Object.keys(validate(state.complaint.form));

export default complaintSlice.reducer;