import { useState } from "react";
import { X, FlaskConical } from "lucide-react";

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("beta-banner-dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("beta-banner-dismissed", "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="relative z-50 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm text-amber-300 flex-1 min-w-0">
          <FlaskConical className="w-4 h-4 flex-shrink-0" />
          <p className="leading-snug">
            <span className="font-semibold">Beta — under active development.</span>
            {" "}Some content on this site is AI-generated and may not be fully accurate. Use it as a starting point, not a final source.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="flex-shrink-0 text-amber-400 hover:text-amber-200 transition p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
