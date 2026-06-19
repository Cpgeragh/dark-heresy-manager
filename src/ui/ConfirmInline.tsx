// src/ui/ConfirmInline.tsx
// Inline confirm affordance: a resting trigger button that arms into a
// "[question] [Yes] [No]" group, or a "type X to confirm" group when
// `requireText` is set. Owns its own armed/typed state.
//
// Internal clicks call preventDefault so the component is safe inside a <Link>.

import { useState } from "react";
import { Button } from "./Button";

interface ConfirmInlineProps {
  /** Label on the resting trigger button. */
  triggerLabel: string;
  /** Short question shown when armed (simple confirm), e.g. "Delete?". */
  question?: string;
  onConfirm: () => void | Promise<void>;
  /** Red (destructive, default) or amber (reversible, e.g. Archive). */
  variant?: "danger" | "warning";
  /** Shows the busy label and disables the buttons while an action runs. */
  busy?: boolean;
  size?: "sm" | "md";
  /** When set, the user must type this exact text before Yes is enabled. */
  requireText?: string;
  /** Prompt shown above the input in type-to-confirm mode. */
  requirePrompt?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
}

export function ConfirmInline({
  triggerLabel,
  question,
  onConfirm,
  variant = "danger",
  busy = false,
  size = "sm",
  requireText,
  requirePrompt,
  confirmLabel = "Yes",
  cancelLabel = "No",
  busyLabel = "…",
}: ConfirmInlineProps) {
  const [armed, setArmed] = useState(false);
  const [text, setText] = useState("");

  const triggerVariant = variant === "warning" ? "warningGhost" : "dangerGhost";
  const confirmVariant = variant === "warning" ? "primary" : "danger";
  const accent = variant === "warning" ? "text-amber-400" : "text-red-400";

  const handle = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  const disarm = () => {
    setArmed(false);
    setText("");
  };

  // Run the action, then collapse back to the resting trigger. Disarming in
  // finally keeps stay-mounted cases (e.g. "Clear chat") from staying armed;
  // for cases where the row unmounts on success the state update is a no-op.
  const runConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      disarm();
    }
  };

  if (!armed) {
    return (
      <Button variant={triggerVariant} size={size} onClick={handle(() => setArmed(true))}>
        {triggerLabel}
      </Button>
    );
  }

  const confirmDisabled = busy || (requireText !== undefined && text !== requireText);

  if (requireText !== undefined) {
    return (
      <div className="flex flex-col gap-1 items-start" onClick={(e) => e.preventDefault()}>
        <span className={`text-xs lg:text-sm ${accent}`}>
          {requirePrompt ?? `Type ${requireText} to confirm`}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={requireText}
            autoFocus
            disabled={busy}
            className="px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-700 border border-slate-500 rounded text-xs lg:text-sm text-slate-100 w-24 lg:w-32 font-code placeholder:text-slate-600 disabled:opacity-50"
          />
          <Button
            variant={confirmVariant}
            size={size}
            disabled={confirmDisabled}
            onClick={handle(runConfirm)}
          >
            {busy ? busyLabel : confirmLabel}
          </Button>
          <Button variant="secondary" size={size} disabled={busy} onClick={handle(disarm)}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {question && <span className={`text-xs lg:text-sm ${accent}`}>{question}</span>}
      <Button variant={confirmVariant} size={size} disabled={busy} onClick={handle(runConfirm)}>
        {busy ? busyLabel : confirmLabel}
      </Button>
      <Button variant="secondary" size={size} disabled={busy} onClick={handle(disarm)}>
        {cancelLabel}
      </Button>
    </div>
  );
}
