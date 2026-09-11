import { useEffect, useRef, type ReactNode } from "react";
import type { IdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { useToast } from "./Toast";
import { Button } from "../ui/buttons/Button";
import { RecoveryCodeInput } from "../ui/forms/RecoveryCodeInput";
import { validateRecoveryCode } from "../utils/validation";

interface IdentityRecoveryFormProps {
  flow: IdentityRecoveryFlow;
  deviceNoun: "device" | "browser";
  description?: ReactNode;
  inputAppearance?: "recovery" | "form";
  inputLabelAside?: ReactNode;
  checkLabel?: string;
  onLinked?: () => void | Promise<void>;
  onReclaimed?: () => void | Promise<void>;
  showFinishingStatus?: boolean;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function recoveryErrorMessage(message: string): string {
  return message === "Recovery code not found."
    ? "No account found for that recovery code."
    : message;
}

export function IdentityRecoveryForm({
  flow,
  deviceNoun,
  description,
  inputAppearance = "recovery",
  inputLabelAside,
  checkLabel = "Continue",
  onLinked,
  onReclaimed,
  showFinishingStatus = false,
}: IdentityRecoveryFormProps) {
  const toast = useToast();
  const lastErrorRef = useRef<string | null>(null);
  const busy = flow.phase !== "idle";
  const deviceLabel = titleCase(deviceNoun);
  const hasValidCode = validateRecoveryCode(flow.code).isValid;

  useEffect(() => {
    if (!flow.error) {
      lastErrorRef.current = null;
      return;
    }
    if (flow.error === lastErrorRef.current) return;

    lastErrorRef.current = flow.error;
    toast.error(recoveryErrorMessage(flow.error));
  }, [flow.error, toast]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!flow.mode) void flow.check();
      }}
    >
      {description && <p className="text-slate-300 text-sm lg:text-base">{description}</p>}

      {flow.mode === "link" && (
        <p className="text-amber-300 text-xs lg:text-sm">
          A linked device remains connected. This {deviceNoun} can only be linked; no identity will
          be moved or deleted.
        </p>
      )}
      {flow.mode === "reclaim" && (
        <p className="text-amber-300 text-xs lg:text-sm">
          No linked devices remain. Reclaiming moves the account identity to this {deviceNoun}.
        </p>
      )}

      <RecoveryCodeInput
        value={flow.code}
        onValueChange={flow.setCode}
        disabled={busy || flow.linkRequestPending}
        placeholder="DH-XXXX-YYYY"
        size="large"
        appearance={inputAppearance}
        labelAside={inputLabelAside}
      />

      {!flow.mode && (
        <Button type="submit" fullWidth size="lg" disabled={busy || !hasValidCode}>
          {flow.phase === "checking" ? "Checking…" : checkLabel}
        </Button>
      )}

      {flow.mode === "link" && (
        <Button
          fullWidth
          size="lg"
          onClick={() => void flow.link(onLinked)}
          disabled={busy || flow.linkRequestPending}
        >
          {flow.phase === "finishing"
            ? "Opening account…"
            : flow.phase === "linking" || flow.linkRequestPending
              ? "Linking…"
              : `Link This ${deviceLabel}`}
        </Button>
      )}

      {flow.mode === "reclaim" && (
        <Button
          fullWidth
          size="lg"
          variant="warningOutline"
          onClick={() => void flow.reclaim(onReclaimed)}
          disabled={busy}
        >
          {flow.phase === "finishing"
            ? "Opening account…"
            : flow.phase === "reclaiming"
              ? flow.progress && flow.progress.totalCount > 0
                ? `Reclaiming… (${flow.progress.processedCount}/${flow.progress.totalCount})`
                : "Reclaiming…"
              : "Reclaim Identity"}
        </Button>
      )}

      {showFinishingStatus && flow.phase === "finishing" && (
        <p className="text-emerald-300 text-sm lg:text-base text-center" role="status">
          Loading your account…
        </p>
      )}
    </form>
  );
}
