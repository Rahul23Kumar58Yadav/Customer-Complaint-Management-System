import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dismissToast } from "../../features/ui/uiSlice";

const STYLES = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-gray-800",
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div
      onClick={() => dispatch(dismissToast(toast.id))}
      className={`text-white text-sm font-medium px-4 py-3 rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.3)] cursor-pointer animate-toast-in flex items-center gap-2 ${
        STYLES[toast.type] || STYLES.info
      }`}
    >
      {toast.message}
    </div>
  );
}

export default function Toast() {
  const toasts = useSelector((s) => s.ui.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}