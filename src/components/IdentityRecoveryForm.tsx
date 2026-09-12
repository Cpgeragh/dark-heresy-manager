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
  showFinishingStatus?: boolean;
}

function recoveryErrorMessage(message: string): string {
  return message === "Recovery code not found."
    ? "No account found for that recovery code."
    : message;
}

export function IdentityRecoveryForm({
  flow,
  deviceNoun: _deviceNoun,
  description,
  inputAppearance = "recovery",
  inputLabelAside,
  checkLabel = "Continue",
  onLinked,
  showFinishingStatus = false,
}: IdentityRecoveryFormProps) {
  const toast = useToast();
  const lastErrorRef = useRef<string | null>(null);
  const busy = flow.phase !== "idle";
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
        void flow.link(onLinked);
      }}
    >
      {description && <p className="text-slate-300 text-sm lg:text-base">{description}</p>}

      <RecoveryCodeInput
        value={flow.code}
        onValueChange={flow.setCode}
        disabled={busy || flow.linkRequestPending}
        placeholder="DH-XXXX-YYYY"
        size="large"
        appearance={inputAppearance}
        labelAside={inputLabelAside}
      />

      <Button type="submit" fullWidth size="lg" disabled={busy || !hasValidCode}>
        {flow.phase === "finishing"
          ? "Opening account…"
          : flow.phase === "linking" || flow.linkRequestPending
            ? "Connecting…"
            : checkLabel}
      </Button>

      {showFinishingStatus && flow.phase === "finishing" && (
        <p className="text-emerald-300 text-sm lg:text-base text-center" role="status">
          Loading your account…
        </p>
      )}
    </form>
  );
}
