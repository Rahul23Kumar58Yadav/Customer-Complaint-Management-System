import { createAsyncThunk } from "@reduxjs/toolkit";
import { extractFromFile, extractFromText, chatWithAssistant } from "../../services/api";
import { populateFromExtraction } from "../complaint/complaintSlice";
import { setExtractionProgress } from "./aiSlice";

const MAX_AUTO_RETRIES = 1; // one silent retry on transient/network failure before surfacing the error

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
  // No response = network/timeout issue; 502/503/504 = transient upstream (Groq) issues.
  const status = err.response?.status;
  return !err.response || [502, 503, 504].includes(status);
}

async function callExtraction({ file, text, dispatch }) {
  if (file) {
    const res = await extractFromFile(file, (evt) => {
      if (evt.total) {
        // File upload accounts for the first 40% of the progress bar;
        // the remaining 60% represents LangGraph/LLM processing time.
        const uploadPct = Math.round((evt.loaded / evt.total) * 40);
        dispatch(setExtractionProgress(uploadPct));
      }
    });
    return res.data;
  }
  dispatch(setExtractionProgress(40));
  const res = await extractFromText(text);
  return res.data;
}

export const runExtraction = createAsyncThunk(
  "ai/runExtraction",
  async ({ file, text }, { dispatch, rejectWithValue }) => {
    let attempt = 0;
    while (true) {
      try {
        const data = await callExtraction({ file, text, dispatch });
        dispatch(setExtractionProgress(90));
        dispatch(
          populateFromExtraction({
            extracted_fields: data.extracted_fields,
            extraction_confidence: data.extraction_confidence,
          })
        );
        return data;
      } catch (err) {
        if (attempt < MAX_AUTO_RETRIES && isRetryable(err)) {
          attempt += 1;
          await sleep(800 * attempt); // brief backoff before retrying
          continue;
        }
        return rejectWithValue(err.response?.data?.detail || err.message);
      }
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "ai/sendChatMessage",
  async ({ message, formContext, complaintId }, { rejectWithValue }) => {
    try {
      const { data } = await chatWithAssistant(message, formContext, complaintId);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);