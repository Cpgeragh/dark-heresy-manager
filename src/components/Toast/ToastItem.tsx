// src/components/Toast/ToastItem.tsx

import { useState, useCallback } from "react";
import { useToast, type Toast } from "./ToastContext";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";

interface ToastItemProps {
  toast: Toast;
}

export function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(toast.copyText ?? toast.message);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [toast.message]);

  const handleDismiss = useCallback(() => {
    removeToast(toast.id);
  }, [removeToast, toast.id]);

  const styles = {
    success: "bg-green-500/20 border-green-500 text-green-100",
    error: "bg-red-500/20 border-red-500 text-red-100",
    warning: "bg-amber-500/20 border-amber-500 text-amber-100",
    info: "bg-blue-500/20 border-blue-500 text-blue-100",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        ${styles[toast.type]}
        border rounded-lg p-4 shadow-lg
        backdrop-blur-sm
        animate-slide-in-right
        flex items-start gap-3 overflow-hidden
        min-w-[300px] max-w-sm
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
        {icons[toast.type]}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0 text-sm whitespace-pre-wrap break-all">
        {toast.message}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1">
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-white/10 rounded transition text-xs"
          aria-label="Copy message to clipboard"
          title="Copy to clipboard"
        >
          <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded transition text-xs"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}