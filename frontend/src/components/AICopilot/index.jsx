import { useState } from "react";
import { useSelector } from "react-redux";
import FileUploadDropzone from "./FileUploadDropzone";
import ExtractionProgressBar from "./ExtractionProgressBar";
import RiskAssessmentPanel from "./RiskAssessmentPanel";
import AssistantChat from "./AssistantChat";

const STATUS_DOT = {
  idle: "bg-gray-300",
  analyzing: "bg-blue-500 animate-pulse",
  succeeded: "bg-emerald-500",
  failed: "bg-red-500",
};

export default function AICopilot() {
  const extractionStatus = useSelector((s) => s.ai.extractionStatus);
  const [showRiskPanel, setShowRiskPanel] = useState(true);
  const hasResults = extractionStatus === "succeeded";

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.06)] border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm shadow-sm">
            ✨
          </span>
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            AI Complaint Intake Assistant
          </h2>
          <span
            className={`w-2 h-2 rounded-full ${STATUS_DOT[extractionStatus] || STATUS_DOT.idle}`}
            title={`Status: ${extractionStatus}`}
          />
        </div>
        <span className="text-[10px] font-bold tracking-wide bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
          BETA
        </span>
      </div>

      <FileUploadDropzone />
      <ExtractionProgressBar />

      <div className="flex-1 overflow-y-auto min-h-0">
        {hasResults && (
          <button
            onClick={() => setShowRiskPanel((v) => !v)}
            className="w-full flex items-center justify-end mt-6 text-[11px] font-medium text-gray-400 hover:text-blue-600 transition-colors"
          >
            {showRiskPanel ? "Collapse ▾" : "Expand ▸"}
          </button>
        )}
        {showRiskPanel && <RiskAssessmentPanel />}
        <AssistantChat />
      </div>
    </div>
  );
}