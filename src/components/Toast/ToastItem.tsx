// src/components/Toast/ToastItem.tsx

import { useState, useCallback } from "react";
import { useToast, type Toast } from "./ToastContext";
import { COPY_FEEDBACK_DURATION } from "../../constants/ui";
import { CheckIcon } from "../../ui/icons/CheckIcon";
import { CloseIcon } from "../../ui/icons/CloseIcon";
import { CopyIcon } from "../../ui/icons/CopyIcon";
import { ExclamationIcon } from "../../ui/icons/ExclamationIcon";
import { InfoIcon } from "../../ui/icons/InfoIcon";
import { WarningIcon } from "../../ui/icons/WarningIcon";
import { colourHoverToastControl, toastColours } from "../../ui/styles/colourTokens";
import { uiFocusRing, uiPressFeedback } from "../../ui/styles/buttonStyles";

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

  const icons = {
    success: <CheckIcon className="h-[1em] w-[1em]" />,
    error: <ExclamationIcon className="h-[1em] w-[1em]" />,
    warning: <WarningIcon className="h-[1em] w-[1em]" />,
    info: <InfoIcon className="h-[1em] w-[1em]" />,
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
        ${toastColours[toast.type]}
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
            className={`inline-flex h-8 w-8 items-center justify-center rounded text-xs transition ${colourHoverToastControl} ${uiPressFeedback()} ${uiFocusRing}`}
            aria-label="Copy message to clipboard"
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className={`inline-flex h-8 w-8 items-center justify-center rounded text-xl transition ${colourHoverToastControl} ${uiPressFeedback()} ${uiFocusRing} lg:h-9 lg:w-9 lg:text-2xl`}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
