import { useSelector } from "react-redux";

const RISK_COLORS = {
  "Critical Risk": "bg-red-50 text-red-700 border-red-200",
  "High Risk": "bg-orange-50 text-orange-700 border-orange-200",
  "Medium Risk": "bg-amber-50 text-amber-700 border-amber-200",
  "Low Risk": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const CARD = "border border-gray-100 rounded-xl p-3.5 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export default function RiskAssessmentPanel() {
  const {
    extractionStatus,
    completenessScore,
    missingFields,
    riskClassification,
    riskRationale,
    rootCauseSuggestion,
    capaRecommendation,
    summary,
    duplicateOf,
    duplicateScore,
  } = useSelector((s) => s.ai);

  if (extractionStatus !== "succeeded") return null;

  return (
    <div className="mt-6 space-y-3">
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
        AI Copilot Risk Assessment
      </p>

      {/* Completeness */}
      <div className={CARD}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-gray-800">Completeness Check</span>
          <span className="text-[13px] font-bold text-gray-900 tabular-nums">{completenessScore}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${completenessScore}%` }}
          />
        </div>
        {missingFields?.length > 0 ? (
          <p className="text-xs text-gray-500">
            Missing: <span className="font-medium text-gray-600">{missingFields.join(", ").replace(/_/g, " ")}</span>
          </p>
        ) : (
          <p className="text-xs text-emerald-600 font-medium">✓ All required fields present.</p>
        )}
      </div>

      {/* Risk classification */}
      {riskClassification && (
        <div className={`border rounded-xl p-3.5 ${RISK_COLORS[riskClassification] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-semibold">Risk Classification</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 shadow-sm">
              {riskClassification}
            </span>
          </div>
          {riskRationale && <p className="text-xs opacity-90 mt-1 leading-relaxed">{riskRationale}</p>}
        </div>
      )}

      {/* Duplicate detection */}
      {duplicateOf && (
        <div className="border border-purple-200 bg-gradient-to-br from-purple-50 to-white rounded-xl p-3.5">
          <span className="text-[13px] font-semibold text-purple-800 flex items-center gap-1.5">
            ⚠ Possible Duplicate Detected
          </span>
          <p className="text-xs text-purple-700 mt-1">
            Matches complaint{" "}
            <code className="font-mono bg-purple-100/70 px-1.5 py-0.5 rounded text-[11px]">
              {duplicateOf.slice(0, 8)}
            </code>{" "}
            <span className="font-semibold">({Math.round((duplicateScore || 0) * 100)}% similarity)</span>
          </p>
        </div>
      )}

      {/* Root cause */}
      {rootCauseSuggestion && (
        <div className={CARD}>
          <span className="text-[13px] font-semibold text-gray-800">Root Cause Suggestion</span>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{rootCauseSuggestion}</p>
        </div>
      )}

      {/* CAPA */}
      {capaRecommendation && (
        <div className={CARD}>
          <span className="text-[13px] font-semibold text-gray-800">CAPA Recommendation (Draft)</span>
          <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-line leading-relaxed">{capaRecommendation}</p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/70">
          <span className="text-[13px] font-semibold text-gray-800">Complaint Summary</span>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}