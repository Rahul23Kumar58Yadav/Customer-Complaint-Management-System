import { createSlice, nanoid } from "@reduxjs/toolkit";
import { runExtraction, sendChatMessage } from "./aiThunks";

function makeMessage(role, text) {
  return { id: nanoid(), role, text, timestamp: Date.now() };
}

const initialState = {
  extractionStatus: "idle",   // idle | uploading | analyzing | succeeded | failed
  extractionProgress: 0,      // 0-100, drives the progress bar
  extractionError: null,
  retryCount: 0,

  // AI Copilot Risk Assessment panel outputs
  completenessScore: null,
  missingFields: [],
  riskClassification: null,
  riskRationale: null,
  rootCauseSuggestion: null,
  capaRecommendation: null,
  summary: null,
  duplicateOf: null,
  duplicateScore: null,

  // Audit trail of every extraction run this session (useful for demoing
  // the pipeline across multiple uploaded documents without losing history)
  extractionHistory: [],

  // Chat
  messages: [
    makeMessage(
      "assistant",
      "Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you."
    ),
  ],
  chatStatus: "idle",
  chatError: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setExtractionProgress(state, action) {
      state.extractionProgress = action.payload;
    },
    resetAiState() {
      return initialState;
    },
    clearChatHistory(state) {
      state.messages = [
        makeMessage("assistant", "Chat cleared. Ask me anything about the current complaint."),
      ];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtraction.pending, (state) => {
        state.extractionStatus = "analyzing";
        state.extractionProgress = 10;
        state.extractionError = null;
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        const d = action.payload;
        state.extractionStatus = "succeeded";
        state.extractionProgress = 100;
        state.retryCount = 0;
        state.completenessScore = d.completeness_score;
        state.missingFields = d.missing_fields;
        state.riskClassification = d.risk_classification;
        state.riskRationale = d.risk_rationale;
        state.rootCauseSuggestion = d.root_cause_suggestion;
        state.capaRecommendation = d.capa_recommendation;
        state.summary = d.summary;
        state.duplicateOf = d.duplicate_of;
        state.duplicateScore = d.duplicate_score;

        state.extractionHistory.push({
          id: nanoid(),
          timestamp: Date.now(),
          completenessScore: d.completeness_score,
          riskClassification: d.risk_classification,
        });

        state.messages.push(
          makeMessage(
            "assistant",
            `Extraction complete (${d.completeness_score}% complete). Risk classified as "${d.risk_classification}". Review the populated form below.`
          )
        );
      })
      .addCase(runExtraction.rejected, (state, action) => {
        state.extractionStatus = "failed";
        state.extractionError = action.payload || action.error.message;
        state.retryCount += 1;
        state.messages.push(
          makeMessage("assistant", `Sorry, I couldn't process that document: ${state.extractionError}`)
        );
      })
      .addCase(sendChatMessage.pending, (state, action) => {
        state.chatStatus = "loading";
        state.chatError = null;
        state.messages.push(makeMessage("user", action.meta.arg.message));
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatStatus = "idle";
        state.messages.push(makeMessage("assistant", action.payload.reply));
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatStatus = "idle";
        state.chatError = action.payload || action.error.message;
        state.messages.push(
          makeMessage("assistant", `AI assistant error: ${state.chatError}`)
        );
      });
  },
});

export const { setExtractionProgress, resetAiState, clearChatHistory } = aiSlice.actions;
export default aiSlice.reducer;