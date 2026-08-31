import type { ReactNode } from "react";
import type { IdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { Button } from "../ui/Button";
import { RecoveryCodeInput } from "../ui/RecoveryCodeInput";
import { uiTextError } from "../ui/editableStyles";

interface IdentityRecoveryFormProps {
  flow: IdentityRecoveryFlow;
  deviceNoun: "device" | "browser";
  description: ReactNode;
  onLinked?: () => void | Promise<void>;
  onReclaimed?: () => void | Promise<void>;
  showFinishingStatus?: boolean;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function IdentityRecoveryForm({
  flow,
  deviceNoun,
  description,
  onLinked,
  onReclaimed,
  showFinishingStatus = false,
}: IdentityRecoveryFormProps) {
  const busy = flow.phase !== "idle";
  const deviceLabel = titleCase(deviceNoun);

  return (
    <>
      <p className="text-slate-300 text-sm lg:text-base">{description}</p>

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
      />

      {!flow.mode && (
        <Button fullWidth size="lg" onClick={() => void flow.check()} disabled={busy || !flow.code}>
          {flow.phase === "checking" ? "Checking…" : "Continue"}
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

      {flow.error && <p className={`${uiTextError} text-center`}>{flow.error}</p>}
      {showFinishingStatus && flow.phase === "finishing" && (
        <p className="text-emerald-300 text-sm lg:text-base text-center" role="status">
          Loading your account…
        </p>
      )}
    </>
  );
}
