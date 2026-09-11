// src/components/Toast/ToastItem.tsx

import { useState, useCallback } from "react";
import { useToast, type Toast } from "./ToastContext";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";
import { CloseIcon } from "../../ui/buttons/CloseButton";

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
  }, [toast.copyText, toast.message]);

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
    error: "!",
    warning: "⚠",
    info: "ℹ",
  };
  const gridColumns = toast.copyText
    ? "grid-cols-[4.25rem_minmax(0,1fr)_4.25rem]"
    : "grid-cols-[2rem_minmax(0,1fr)_2rem]";

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
        grid ${gridColumns} items-center gap-3 overflow-hidden
        w-full max-w-sm
      `}
    >
      {/* Icon */}
      <div className="flex h-8 items-center justify-center text-lg font-bold">
        {icons[toast.type]}
      </div>

      {/* Message */}
      <div className="min-w-0 whitespace-pre-wrap break-words text-center text-sm">
        {toast.message}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        {toast.copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8 w-8 items-center justify-center rounded text-xs transition hover:bg-white/10"
            aria-label="Copy message to clipboard"
            title="Copy to clipboard"
          >
            <span aria-hidden="true">{copied ? "✓" : "📋"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-xl transition hover:bg-white/10 lg:h-9 lg:w-9 lg:text-2xl"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
