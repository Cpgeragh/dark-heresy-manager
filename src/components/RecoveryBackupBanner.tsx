// src/components/RecoveryBackupBanner.tsx
// Nags the user to back up their recovery code until they confirm they have.
// The flag is stored on the signed-in device's own user doc (users docs are
// self-only), so each device confirms once. The revealed code is the shared
// account code (works on linked devices via effectiveUserId).

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { useToast } from "./Toast";
import { Button } from "../ui/Button";

interface Props {
  ownUid: string;
  effectiveUserId: string;
}

export function RecoveryBackupBanner({ ownUid, effectiveUserId }: Props) {
  const [needsBackup, setNeedsBackup] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;
    getDoc(doc(db, "users", ownUid))
      .then((s) => {
        if (!ignore) setNeedsBackup(s.exists() && s.data().recoveryBackedUp !== true);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [ownUid]);

  if (!needsBackup) return null;

  async function reveal() {
    setBusy(true);
    try {
      setCode((await getRecoveryCode(effectiveUserId)) ?? (await rotateRecoveryCode(effectiveUserId)));
    } catch {
      toast.error("Couldn't load your recovery code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    try {
      await updateDoc(doc(db, "users", ownUid), { recoveryBackedUp: true });
      setNeedsBackup(false);
      toast.success("Recovery code backed up.");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <div className="border border-amber-500/60 bg-amber-500/10 rounded-lg p-4 lg:p-5 space-y-3">
      <p className="text-sm lg:text-base font-semibold text-amber-200">⚠ Back up your recovery code</p>
      <p className="text-xs lg:text-sm text-amber-100/80">
        It's the only way to restore your account on a new device or if your browser data is
        cleared.
      </p>
      {code ? (
        <>
          <div className="bg-slate-900 border border-slate-600 rounded p-3 text-center">
            <span className="font-code [font-feature-settings:'zero'] text-lg lg:text-xl text-amber-400 tracking-widest break-all select-all">
              {code}
            </span>
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
        <Button onClick={reveal} disabled={busy}>
          {busy ? "Loading…" : "Reveal my code"}
        </Button>
      )}
    </div>
  );
}
