import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendChatMessage } from "../../features/aiAssistant/aiThunks";

const QUICK_QUESTIONS = [
  "Why was this risk level assigned?",
  "What fields are still missing?",
  "Summarize this complaint in one line",
  "Is this likely a duplicate?",
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AssistantChat() {
  const dispatch = useDispatch();
  const messages = useSelector((s) => s.ai.messages);
  const chatStatus = useSelector((s) => s.ai.chatStatus);
  const extractionStatus = useSelector((s) => s.ai.extractionStatus);
  const formContext = useSelector((s) => s.complaint.form);
  const savedComplaintId = useSelector((s) => s.complaint.savedComplaintId);

  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  const hasContext = extractionStatus === "succeeded";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatStatus]);

  const send = (text) => {
    const message = text ?? input;
    if (!message.trim() || chatStatus === "loading") return;
    dispatch(sendChatMessage({ message, formContext, complaintId: savedComplaintId }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 mt-6">
      <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-2.5">
        AI Assistant
      </p>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 max-h-72">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-end gap-2 max-w-[85%] ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[11px] flex-shrink-0 shadow-sm">
                  🤖
                </div>
              )}
              <div>
                <div
                  className={`text-sm rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md"
                      : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
                {m.timestamp && (
                  <p
                    className={`text-[10px] text-gray-400 mt-1 px-1 ${
                      m.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {formatTime(new Date(m.timestamp))}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {chatStatus === "loading" && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[11px] shadow-sm">
              🤖
            </div>
            <span className="flex gap-0.5 bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-3 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
            </span>
          </div>
        )}
      </div>

      {hasContext && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={chatStatus === "loading"}
              className="text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:shadow-sm border border-blue-100 rounded-full px-2.5 py-1 transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasContext
              ? "Ask me anything about this complaint..."
              : "Upload or paste a complaint to start chatting..."
          }
          className="form-input flex-1"
        />
        <button
          onClick={() => send()}
          disabled={chatStatus === "loading" || !input.trim()}
          className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-300 disabled:to-blue-300 text-white w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_1px_2px_rgba(37,99,235,0.3),0_2px_8px_rgba(37,99,235,0.2)] disabled:shadow-none transition-all active:scale-95"
        >
          ➤
        </button>
      </div>
      <p className="text-[11px] text-gray-400 text-center mt-2.5">
        AI responses may contain errors. Please verify information.
      </p>
    </div>
  );
}