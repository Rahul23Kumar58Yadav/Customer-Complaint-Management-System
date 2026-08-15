import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { runExtraction } from "../../features/aiAssistant/aiThunks";

const ACCEPTED_EXT = [".pdf", ".docx", ".txt", ".eml"];
const MAX_SIZE_MB = 10;

const FILE_ICONS = { pdf: "📕", docx: "📘", txt: "📄", eml: "✉️" };

export default function FileUploadDropzone() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [lastFile, setLastFile] = useState(null);

  const extractionStatus = useSelector((s) => s.ai.extractionStatus);
  const isBusy = extractionStatus === "analyzing";
  const failed = extractionStatus === "failed";

  const validate = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      return `Unsupported file type "${ext}". Accepted: ${ACCEPTED_EXT.join(", ")}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB — exceeds the ${MAX_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const handleFile = (file) => {
    if (!file) return;
    const error = validate(file);
    if (error) {
      setLocalError(error);
      return;
    }
    setLocalError(null);
    setLastFile(file);
    dispatch(runExtraction({ file }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setLastFile(null);
    dispatch(runExtraction({ text: pastedText }));
    setShowPasteBox(false);
  };

  const handleRetry = () => {
    if (lastFile) dispatch(runExtraction({ file: lastFile }));
    else if (pastedText.trim()) dispatch(runExtraction({ text: pastedText }));
  };

  const ext = lastFile ? lastFile.name.split(".").pop().toLowerCase() : null;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl py-9 px-4 text-center cursor-pointer transition-all duration-200
          ${isDragging ? "border-blue-500 bg-blue-50/70 scale-[1.01] shadow-inner" : "border-gray-200 bg-gray-50/60"}
          ${isBusy ? "opacity-60 pointer-events-none" : "hover:border-blue-400 hover:bg-blue-50/40"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="text-3xl mb-2.5">{ext ? FILE_ICONS[ext] || "📎" : "☁️"}</div>
        {lastFile ? (
          <p className="text-sm text-gray-700 font-semibold truncate max-w-xs mx-auto">
            {lastFile.name}
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-700 font-semibold">Drag &amp; drop complaint document here</p>
            <p className="text-sm text-gray-500 mt-0.5">
              or <span className="text-blue-600 font-semibold underline underline-offset-2">click to browse</span>
            </p>
          </>
        )}
      </div>

      {localError && (
        <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
          ⚠ {localError}
        </p>
      )}

      {failed && (
        <button
          onClick={handleRetry}
          className="w-full mt-2 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors"
        >
          ↻ Retry extraction
        </button>
      )}

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-bold tracking-wider">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {!showPasteBox ? (
        <button
          onClick={() => setShowPasteBox(true)}
          disabled={isBusy}
          className="w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60"
        >
          📄 Paste Complaint Text / Email
        </button>
      ) : (
        <div className="space-y-2 animate-fade-in-up">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste complaint email or text here..."
            rows={5}
            className="form-input resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 tabular-nums">{pastedText.length} chars</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasteBox(false)}
                className="px-3 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={isBusy || !pastedText.trim()}
                className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-300 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-[0_1px_2px_rgba(37,99,235,0.3),0_2px_8px_rgba(37,99,235,0.2)] disabled:shadow-none transition-all active:scale-[0.98]"
              >
                Analyze Text
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl px-4 py-3 mt-4 text-xs text-emerald-800">
        <p className="font-semibold">ⓘ Supported formats: PDF, DOCX, TXT, EML</p>
        <p className="text-emerald-700/80 mt-0.5">Max file size: {MAX_SIZE_MB}MB</p>
      </div>
    </div>
  );
}