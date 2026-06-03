// src/pages/characterSheet/CharacterKebabContent.tsx

import { useState, useCallback } from "react";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";

interface Props {
  recoveryCode?: string;
  canExport: boolean;
  onExport: () => void;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  isReleasing: boolean;
}

export function CharacterKebabContent({
  recoveryCode,
  canExport,
  onExport,
  canPlayerRelease,
  onPlayerRelease,
  isReleasing,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    if (!recoveryCode) return;
    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
    }
  }, [recoveryCode]);

  return (
    <div className="space-y-4">
      {/* Recovery Code */}
      {recoveryCode && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-100 uppercase tracking-wide">Recovery Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-amber-300 text-sm break-all">
              {recoveryCode}
            </code>
            <button
              onClick={copyCode}
              className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-500 text-slate-100 hover:bg-slate-600 shrink-0"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Export */}
      {canExport && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-100 uppercase tracking-wide">Character Data</p>
          <button
            onClick={onExport}
            className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-500 text-slate-100 hover:bg-slate-600"
          >
            Export JSON
          </button>
        </div>
      )}

      {/* Release */}
      {canPlayerRelease && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-100 uppercase tracking-wide">Release Character</p>
          <p className="text-xs text-slate-400">Unlinks this character from your account.</p>
          <button
            onClick={onPlayerRelease}
            disabled={isReleasing}
            className={`px-3 py-2 rounded border text-sm transition ${
              isReleasing
                ? "bg-red-800 border-red-900 text-red-300 cursor-wait"
                : "bg-red-600 border-red-700 text-white hover:bg-red-500"
            }`}
          >
            {isReleasing ? "Releasing..." : "Release Character"}
          </button>
        </div>
      )}
    </div>
  );
}
