import { useSelector } from "react-redux";

const STAGES = [
  { max: 15, label: "Uploading and parsing document..." },
  { max: 45, label: "Extracting structured fields (gemma2-9b-it)..." },
  { max: 65, label: "Checking completeness and scanning for duplicates..." },
  { max: 85, label: "Running risk classification and root cause analysis..." },
  { max: 99, label: "Drafting CAPA recommendation and summary..." },
  { max: 100, label: "Finalizing results..." },
];

function stageLabelFor(progress) {
  return STAGES.find((s) => progress <= s.max)?.label || STAGES[STAGES.length - 1].label;
}

export default function ExtractionProgressBar() {
  const status = useSelector((s) => s.ai.extractionStatus);
  const progress = useSelector((s) => s.ai.extractionProgress);

  if (status === "idle") return null;

  const isFailed = status === "failed";
  const isDone = status === "succeeded";
  const barColor = isFailed
    ? "bg-gradient-to-r from-red-500 to-red-600"
    : isDone
    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
    : "bg-gradient-to-r from-blue-500 to-indigo-600";

  return (
    <div className="mt-6 bg-gray-50/70 border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
          Extraction Progress
        </p>
        {status === "analyzing" && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-600 w-9 text-right tabular-nums">
          {progress}%
        </span>
      </div>

      <p className={`text-[13px] mt-2.5 font-medium ${isFailed ? "text-red-600" : "text-gray-600"}`}>
        {isFailed ? "Extraction failed." : isDone ? "Extraction complete." : stageLabelFor(progress)}
      </p>
      {status === "analyzing" && (
        <p className="text-[11px] text-gray-400 mt-0.5">This usually takes a few seconds per LLM call.</p>
      )}
    </div>
  );
}