import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" }[size] || "max-w-md";

  // Only the JSX return needs changing — logic stays identical
return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] px-4"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? "modal-title" : undefined}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.15),0_8px_10px_-6px_rgba(15,23,42,0.08)] w-full ${widthClass} max-h-[85vh] flex flex-col animate-fade-in-up`}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id="modal-title" className="text-[15px] font-semibold text-gray-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

      {footer && (
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);
}