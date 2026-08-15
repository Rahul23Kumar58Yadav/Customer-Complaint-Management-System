import { Component, useEffect, useState } from "react";
import ComplaintIntakePage from "./pages/ComplaintIntakePage";
import { checkHealth } from "./services/api";

/** Catches render-time crashes anywhere in the tree so one bad component
 *  doesn't blank the entire screen for a QA reviewer mid-complaint-entry. */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="max-w-md text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">
              The application hit an unexpected error. Your form data may still be intact —
              try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function BackendOfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await checkHealth();
        if (!cancelled) setIsOnline(true);
      } catch {
        if (!cancelled) setIsOnline(false);
      } finally {
        if (!cancelled) setChecked(true);
      }
    };
    ping();
    const interval = setInterval(ping, 30000); // re-check every 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!checked || isOnline) return null;

  return (
    <div className="bg-red-600 text-white text-sm text-center py-2 px-4">
      ⚠ Backend API unreachable — AI extraction and save actions will fail until the server is
      back online.
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BackendOfflineBanner />
      <ComplaintIntakePage />
    </ErrorBoundary>
  );
}