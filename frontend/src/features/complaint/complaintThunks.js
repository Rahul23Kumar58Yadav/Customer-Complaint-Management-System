import { createAsyncThunk } from "@reduxjs/toolkit";
import { createComplaint, getComplaint, updateComplaint, listComplaints } from "../../services/api";

/** Normalizes the form (string dates/numbers) into the API payload shape. */
function toPayload(form) {
  return {
    ...form,
    quantity_affected: form.quantity_affected ? Number(form.quantity_affected) : null,
    manufacturing_date: form.manufacturing_date || null,
    expiry_date: form.expiry_date || null,
    complaint_date: form.complaint_date || null,
  };
}

function extractErrorMessage(err) {
  return err.response?.data?.detail || err.message || "Something went wrong.";
}

export const saveComplaint = createAsyncThunk(
  "complaint/save",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { form } = getState().complaint;
      const { data } = await createComplaint(toPayload(form));
      return data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const updateExistingComplaint = createAsyncThunk(
  "complaint/update",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { form, savedComplaintId } = getState().complaint;
      if (!savedComplaintId) {
        throw new Error("No saved complaint to update - save it first.");
      }
      const { data } = await updateComplaint(savedComplaintId, toPayload(form));
      return data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchComplaint = createAsyncThunk(
  "complaint/fetch",
  async (complaintId, { rejectWithValue }) => {
    try {
      const { data } = await getComplaint(complaintId);
      return data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchRecentComplaints = createAsyncThunk(
  "complaint/fetchRecent",
  async ({ skip = 0, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await listComplaints({ skip, limit });
      return data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);