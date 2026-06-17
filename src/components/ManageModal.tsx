// src/components/ManageModal.tsx

import { useState, useCallback } from "react";
import { uiSection, uiSectionHeader } from "../ui/editableStyles";
import { COPY_FEEDBACK_DURATION } from "../constants/ui";

interface ManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCode?: string;
  canExport: boolean;
  onExport: () => void;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
  isReleasing: boolean;
}

export function ManageModal({
  isOpen,
  onClose,
  recoveryCode,
  canExport,
  onExport,
  canPlayerRelease,
  onPlayerRelease,
  isReleasing,
}: ManageModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-5 lg:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className={uiSectionHeader}>Manage</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-100 text-lg lg:text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Recovery Code */}
        {recoveryCode && (
          <section className={uiSection + " space-y-2"}>
            <p className="text-xs lg:text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Recovery Code
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2 py-1 bg-slate-800 border border-slate-500 rounded text-amber-300 text-sm lg:text-base break-all">
                {recoveryCode}
              </code>
              <button
                onClick={copyCode}
                aria-label="Copy recovery code"
                className="px-2 py-1 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 hover:bg-slate-600 shrink-0"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>
        )}

        {/* Export */}
        {canExport && (
          <section className={uiSection + " space-y-2"}>
            <p className="text-xs lg:text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Character Data
            </p>
            <button
              onClick={() => {
                onExport();
                onClose();
              }}
              className="px-2 py-1 text-xs lg:text-sm rounded bg-slate-700 border border-slate-500 text-slate-100 hover:bg-slate-600"
            >
              Export JSON
            </button>
          </section>
        )}

        {/* Release */}
        {canPlayerRelease && (
          <section className={uiSection + " space-y-2"}>
            <p className="text-xs lg:text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Release Character
            </p>
            <p className="text-xs lg:text-sm text-slate-400">Unlinks this character from your account.</p>
            <button
              onClick={onPlayerRelease}
              disabled={isReleasing}
              className={`px-3 py-2 rounded border text-sm lg:text-base transition ${
                isReleasing
                  ? "bg-red-800 border-red-900 text-red-300 cursor-wait"
                  : "bg-red-600 border-red-700 text-white hover:bg-red-500"
              }`}
            >
              {isReleasing ? "Releasing…" : "Release Character"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
