import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "../features/complaint/complaintSlice";
import aiReducer from "../features/aiAssistant/aiSlice";
import uiReducer from "../features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    ai: aiReducer,
    ui: uiReducer,
  },
});