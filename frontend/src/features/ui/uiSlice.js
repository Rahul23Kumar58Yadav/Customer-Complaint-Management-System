import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  toasts: [],          // [{ id, type: 'success'|'error'|'info', message }]
  confirmDialog: null,  // { title, message, confirmLabel, intent, payload? } - see ConfirmDialog.jsx
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ type = "info", message }) {
        return { payload: { id: nanoid(), type, message } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    openConfirmDialog(state, action) {
      state.confirmDialog = action.payload;
    },
    closeConfirmDialog(state) {
      state.confirmDialog = null;
    },
  },
});

export const {
  showToast,
  dismissToast,
  clearToasts,
  openConfirmDialog,
  closeConfirmDialog,
} = uiSlice.actions;

export default uiSlice.reducer;