// src/components/RecoveryBackupBanner.tsx
// Nags the user to back up their recovery code until they confirm they have.
// The flag is stored on the signed-in device's own user doc (users docs are
// self-only), so each device confirms once. The revealed code is the shared
// account code (works on linked devices via effectiveUserId).

import { useRef, useState } from "react";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { markRecoveryCodeBackedUp } from "../services/userAccountService";
import { useToast } from "./Toast";
import { Button } from "../ui/buttons/Button";
import { colourNoticeAmber } from "../ui/styles/colourTokens";
import { uiCodeBox, uiCodeText, uiNoticeBox } from "../ui/styles/editableStyles";

interface Props {
  ownUid: string;
  effectiveUserId: string;
  needsBackup: boolean;
}

export function RecoveryBackupBanner({
  ownUid,
  effectiveUserId,
  needsBackup: initialNeedsBackup,
}: Props) {
  const [needsBackup, setNeedsBackup] = useState(initialNeedsBackup);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const confirmingRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!needsBackup) return null;

  async function reveal() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setCode(
        (await getRecoveryCode(effectiveUserId)) ?? (await rotateRecoveryCode(effectiveUserId))
      );
    } catch {
      toast.error("Couldn't load your recovery code.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function confirm() {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    try {
      await markRecoveryCodeBackedUp(ownUid);
      setNeedsBackup(false);
      toast.success("Recovery code backed up.");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      confirmingRef.current = false;
    }
  }

  return (
    <div className={`${uiNoticeBox} ${colourNoticeAmber} p-3 lg:p-4 space-y-3`}>
      <p className="text-sm lg:text-base font-semibold text-amber-200">
        ⚠ Back up your recovery code
      </p>
      <p className="text-xs lg:text-sm text-amber-100/80">
        It's the only way to restore your account on a new device or if your browser data is
        cleared.
      </p>
      {code ? (
        <>
          <div className={uiCodeBox}>
            <span className={uiCodeText}>{code}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard?.writeText(code);
                setCopied(true);
                toast.success("Copied.");
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={confirm} disabled={!copied}>
              I've saved it
            </Button>
          </div>
          {!copied && <p className="text-xs lg:text-sm text-amber-100/70">Copy your code first.</p>}
        </>
      ) : (
        <Button onClick={reveal} loading={busy} loadingLabel="Loading">
          Reveal my code
        </Button>
      )}
    </div>
  );
}
