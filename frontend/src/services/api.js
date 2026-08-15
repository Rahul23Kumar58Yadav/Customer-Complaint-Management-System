import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const REQUEST_TIMEOUT_MS = 30000; // extraction calls hit multiple LLM calls server-side; give it room

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

// --- Request interceptor ---
// Placeholder for auth token injection if/when this API sits behind auth.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response interceptor ---
// Normalizes errors into a consistent shape so thunks don't each re-implement this.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ isCancelled: true, message: "Request cancelled" });
    }
    if (!error.response) {
      error.userMessage = "Network error — check your connection and that the backend is running.";
    } else if (error.response.status === 413) {
      error.userMessage = "File is too large (max 10MB).";
    } else if (error.response.status === 422) {
      error.userMessage = error.response.data?.detail || "Could not process the submitted data.";
    } else if (error.response.status >= 500) {
      error.userMessage = "Server error — the AI service may be temporarily unavailable.";
    } else {
      error.userMessage = error.response.data?.detail || "Something went wrong.";
    }
    return Promise.reject(error);
  }
);

/** Creates an AbortController-backed axios config, so callers can cancel in-flight requests
 *  (e.g. if the user uploads a second file before the first extraction finishes). */
export function makeCancelable() {
  const controller = new AbortController();
  return { signal: controller.signal, cancel: () => controller.abort() };
}

// --- AI endpoints ---
export const extractFromFile = (file, onUploadProgress, signal) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/ai/extract/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
    signal,
  });
};

export const extractFromText = (text, signal) =>
  api.post("/ai/extract/text", { text }, { signal });

export const chatWithAssistant = (message, formContext, complaintId, signal) =>
  api.post(
    "/ai/chat",
    { message, form_context: formContext, complaint_id: complaintId },
    { signal }
  );

// --- Complaint CRUD endpoints ---
export const createComplaint = (payload) => api.post("/complaints", payload);
export const listComplaints = (params) => api.get("/complaints", { params });
export const getComplaint = (id) => api.get(`/complaints/${id}`);
export const updateComplaint = (id, payload) => api.put(`/complaints/${id}`, payload);
export const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

// --- Health check (useful for a "backend offline" banner) ---
export const checkHealth = () =>
  axios.get(`${API_BASE_URL.replace(/\/api\/v1$/, "")}/health`, { timeout: 5000 });