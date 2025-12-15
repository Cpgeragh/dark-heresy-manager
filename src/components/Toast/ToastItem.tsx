// src/components/Toast/ToastItem.tsx

import { useState } from "react";
import { useToast, type Toast } from "./ToastContext";

interface ToastItemProps {
  toast: Toast;
}

export function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toast.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
      className={`
        ${styles[toast.type]}
        border rounded-lg p-4 shadow-lg
        backdrop-blur-sm
        animate-slide-in-right
        flex items-start gap-3
        min-w-[300px] max-w-sm
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
        {icons[toast.type]}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm whitespace-pre-wrap break-words">
        {toast.message}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1">
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-white/10 rounded transition text-xs"
          title="Copy to clipboard"
        >
          {copied ? "✓" : "📋"}
        </button>

        <button
          onClick={() => removeToast(toast.id)}
          className="p-1 hover:bg-white/10 rounded transition text-xs"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}