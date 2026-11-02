import { useEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmModal } from "../ui/modals/ConfirmModal";
import type { DeviceRecoveryMode } from "../services/deviceLinkService";
import type { IdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { useToast } from "./Toast";
import { Button } from "../ui/buttons/Button";
import { RecoveryCodeInput } from "../ui/forms/RecoveryCodeInput";
import { FormLabel } from "../ui/forms/FormLabel";
import { validateRecoveryCode } from "../utils/validation";
import { editableInputClass, uiTextBody, uiStackBody } from "../ui/styles/editableStyles";
import { PRODUCT_LIMITS } from "../constants/productLimits";

interface IdentityRecoveryFormProps {
  flow: IdentityRecoveryFlow;
  deviceNoun: "device" | "browser";
  description?: ReactNode;
  inputAppearance?: "recovery" | "form";
  inputLabelAside?: ReactNode;
  checkLabel?: string;
  onLinked?: () => void | Promise<void>;
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
  checkLabel = "Link device",
  onLinked,
}: IdentityRecoveryFormProps) {
  const toast = useToast();
  const [confirmMode, setConfirmMode] = useState<DeviceRecoveryMode | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const busy = flow.phase !== "idle";
  const hasValidCode = validateRecoveryCode(flow.code).isValid;
  const hasDeviceName = flow.deviceName.trim().length > 0;

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
      className={uiStackBody}
      onSubmit={(event) => {
        event.preventDefault();
        void flow.link(onLinked);
      }}
    >
      {description && <p className={`${uiTextBody} text-sm lg:text-base`}>{description}</p>}

      <RecoveryCodeInput
        value={flow.code}
        onValueChange={flow.setCode}
        disabled={busy || flow.linkRequestPending}
        placeholder="DH-XXXX-YYYY"
        size="large"
        appearance={inputAppearance}
        labelAside={inputLabelAside}
      />

      <div>
        <FormLabel htmlFor="identity-device-name" required>
          Device Name
        </FormLabel>
        <input
          id="identity-device-name"
          type="text"
          value={flow.deviceName}
          onChange={(event) => flow.setDeviceName(event.target.value)}
          disabled={busy || flow.linkRequestPending}
          maxLength={PRODUCT_LIMITS.deviceNameCharacters}
          placeholder="e.g. My phone"
          autoComplete="off"
          className={`${editableInputClass(true)} mt-1`}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!hasValidCode || !hasDeviceName}
        loading={busy || flow.linkRequestPending}
        loadingLabel={
          flow.phase === "finishing"
            ? "Opening account"
            : flow.phase === "linking" || flow.linkRequestPending
              ? "Connecting"
              : undefined
        }
      >
        {checkLabel}
      </Button>
      <Button
        fullWidth
        size="lg"
        variant="secondary"
        disabled={!hasValidCode || !hasDeviceName || busy || flow.linkRequestPending}
        onClick={() => setConfirmMode("primary")}
      >
        Set as primary device
      </Button>
      <Button
        fullWidth
        size="lg"
        variant="secondary"
        disabled={!hasValidCode || !hasDeviceName || busy || flow.linkRequestPending}
        onClick={() => setConfirmMode("recover")}
      >
        Recover account
      </Button>
      {confirmMode && (
        <ConfirmModal
          title={confirmMode === "primary" ? "Set as Primary Device" : "Recover Account"}
          message={
            confirmMode === "primary"
              ? "This device will become your primary device. Your previous primary device will be disconnected. Your account data will be kept."
              : "This device will become your primary device. All previous devices will be disconnected. Your account data will be kept."
          }
          confirmLabel={confirmMode === "primary" ? "Set as primary device" : "Recover account"}
          confirmVariant="warningOutline"
          busy={busy || flow.linkRequestPending}
          loadingLabel="Connecting"
          onCancel={() => setConfirmMode(null)}
          onConfirm={async () => {
            if (await flow.link(onLinked, confirmMode)) setConfirmMode(null);
          }}
        />
      )}
    </form>
  );
}
