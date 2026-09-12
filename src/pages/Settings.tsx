// src/pages/Settings.tsx
// User settings: recovery code management and device linking.

import { useRef, useState } from "react";
import {
  getRecoveryCode,
  revokeIdentityRecoveryCode,
  rotateRecoveryCode,
} from "../services/identityService";
import { deleteCurrentAccount } from "../services/userAccountService";
import { LastDeviceDisconnectError } from "../services/deviceLinkService";
import { saveFirstName } from "../services/profileService";
import { useToast } from "../components/Toast";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { uiSection, uiTextError } from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { ConfirmInline } from "../ui/forms/ConfirmInline";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";
import { formatFirstNameInput } from "../utils/firstName";
import { ModalShell } from "../ui/modals/ModalShell";
import { ModalHeader } from "../ui/modals/ModalHeader";

interface Props {
  effectiveUserId: string;
  firstName: string;
  disconnect: (confirmLastDevice?: boolean) => Promise<void>;
}

export default function Settings({ effectiveUserId, firstName, disconnect }: Props) {
  const toast = useToast();

  // ── Display name state ───────────────────────────────────────────────────
  const [nameDraft, setNameDraft] = useState(firstName);
  const [savingName, setSavingName] = useState(false);
  const savingNameRef = useRef(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // ── Recovery code state ──────────────────────────────────────────────────
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const revealingRef = useRef(false);
  const [rotating, setRotating] = useState(false);
  const rotatingRef = useRef(false);
  const [revoking, setRevoking] = useState(false);
  const revokingRef = useRef(false);

  // ── Device link state ────────────────────────────────────────────────────
  const [disconnectingDevice, setDisconnectingDevice] = useState(false);
  const disconnectingDeviceRef = useRef(false);
  const [lastDeviceWarningOpen, setLastDeviceWarningOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const deletingAccountRef = useRef(false);

  async function handleSaveName() {
    if (savingNameRef.current) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === firstName) return;
    savingNameRef.current = true;
    setSavingName(true);
    setNameError(null);
    try {
      await saveFirstName(effectiveUserId, trimmed);
      toast.success("Display name updated.");
    } catch (err) {
      console.error("Failed to save display name:", err);
      setNameError("Failed to save display name. Please try again.");
    } finally {
      savingNameRef.current = false;
      setSavingName(false);
    }
  }

  async function handleReveal() {
    if (revealingRef.current) return;
    revealingRef.current = true;
    setRevealing(true);
    try {
      let code = await getRecoveryCode(effectiveUserId);
      if (!code) {
        code = await rotateRecoveryCode(effectiveUserId);
        toast.success("Recovery code generated.");
      }
      setRevealedCode(code);
    } catch (err) {
      console.error("Failed to reveal recovery code:", err);
      toast.error("Failed to load recovery code.");
    } finally {
      revealingRef.current = false;
      setRevealing(false);
    }
  }

  async function handleRotate() {
    if (rotatingRef.current) return;
    rotatingRef.current = true;
    setRotating(true);
    try {
      const newCode = await rotateRecoveryCode(effectiveUserId);
      setRevealedCode(newCode);
      toast.success("Recovery code rotated. Write down your new code.");
    } catch (err) {
      console.error("Failed to rotate recovery code:", err);
      toast.error("Failed to rotate recovery code. Please try again.");
    } finally {
      rotatingRef.current = false;
      setRotating(false);
    }
  }

  async function handleRevoke() {
    if (revokingRef.current) return;
    revokingRef.current = true;
    setRevoking(true);
    try {
      await revokeIdentityRecoveryCode();
      setRevealedCode(null);
      toast.success("Recovery code revoked.");
    } catch (err) {
      console.error("Failed to revoke recovery code:", err);
      toast.error("Failed to revoke recovery code. Please try again.");
    } finally {
      revokingRef.current = false;
      setRevoking(false);
    }
  }

  async function handleDisconnectDevice(confirmLastDevice = false) {
    if (disconnectingDeviceRef.current) return;
    disconnectingDeviceRef.current = true;
    setDisconnectingDevice(true);
    try {
      await disconnect(confirmLastDevice);
    } catch (err) {
      if (err instanceof LastDeviceDisconnectError) {
        setLastDeviceWarningOpen(true);
        return;
      }
      console.error("Failed to disconnect device:", err);
      toast.error("Failed to disconnect device. Please try again.");
    } finally {
      disconnectingDeviceRef.current = false;
      setDisconnectingDevice(false);
    }
  }

  async function handleDeleteAccount() {
    if (deletingAccountRef.current) return;
    deletingAccountRef.current = true;
    setDeletingAccount(true);
    try {
      await deleteCurrentAccount();
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account. Please try again."
      );
    } finally {
      deletingAccountRef.current = false;
      setDeletingAccount(false);
    }
  }

  return (
    <PageShell title="Settings">
      <Panel>
        {/* ── Display Name ───────────────────────────────────────────────── */}
        <div>
          <SectionHeader className="mb-3">Display Name</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <p className="text-slate-400 text-sm lg:text-base">
              Your first name, shown on your dashboard and character sheets. If you DM a campaign,
              it's also shown to your players as the GM's name.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                autoComplete="given-name"
                autoCapitalize="words"
                value={nameDraft}
                onChange={(e) => setNameDraft(formatFirstNameInput(e.target.value))}
                maxLength={PRODUCT_LIMITS.firstNameCharacters}
                placeholder="e.g. David"
                className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm lg:text-base placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Button
                onClick={handleSaveName}
                disabled={savingName || !nameDraft.trim() || nameDraft.trim() === firstName}
              >
                {savingName ? "Saving…" : "Save"}
              </Button>
            </div>
            {nameError && <p className={uiTextError}>{nameError}</p>}
          </section>
        </div>

        {/* ── Recovery Code ───────────────────────────────────────────────── */}
        <div>
          <SectionHeader className="mb-3">Recovery Code</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <p className="text-slate-400 text-sm lg:text-base">
              Use this code to reconnect to your campaigns and characters if no device is still
              connected. Keep it somewhere safe and private.
            </p>

            {revealedCode ? (
              <>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs lg:text-sm text-slate-500 uppercase tracking-widest mb-2">
                    Recovery Code
                  </p>
                  <span className="font-code [font-feature-settings:'zero'] text-lg lg:text-xl text-amber-400 tracking-widest break-all select-all">
                    {revealedCode}
                  </span>
                </div>

                <div className="border border-amber-500/60 bg-amber-500/10 rounded-lg p-3 space-y-2">
                  <p className="text-xs lg:text-sm text-amber-200">
                    If anyone else may have seen this code, rotate it now to invalidate it.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setRevealedCode(null)}>
                      Hide
                    </Button>
                    <ConfirmInline
                      triggerLabel="Rotate Code"
                      question="Rotate code?"
                      onConfirm={handleRotate}
                      variant="warning"
                      busy={rotating}
                      confirmLabel="Yes, rotate"
                      cancelLabel="Cancel"
                      busyLabel="Rotating…"
                    />
                    <ConfirmInline
                      triggerLabel="Revoke Code"
                      question="Revoke code?"
                      onConfirm={handleRevoke}
                      busy={revoking}
                      confirmLabel="Yes, revoke"
                      cancelLabel="Cancel"
                      busyLabel="Revoking…"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Button onClick={handleReveal} disabled={revealing}>
                  {revealing ? "Loading…" : "Reveal Recovery Code"}
                </Button>
                <ConfirmInline
                  triggerLabel="Revoke Code"
                  question="Revoke code?"
                  onConfirm={handleRevoke}
                  busy={revoking}
                  confirmLabel="Yes, revoke"
                  cancelLabel="Cancel"
                  busyLabel="Revoking…"
                />
              </div>
            )}
          </section>
        </div>

        {/* ── Linked Device ───────────────────────────────────────────────── */}
        <div>
          <SectionHeader className="mb-3">This Device</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <p className="text-slate-400 text-sm lg:text-base">
              Disconnect this device from your account. Your campaigns and characters remain in the
              account and stay available on every other connected device.
            </p>
            <ConfirmInline
              triggerLabel="Disconnect This Device"
              question="Disconnect this device?"
              onConfirm={() => handleDisconnectDevice(false)}
              variant="warning"
              busy={disconnectingDevice}
              confirmLabel="Yes, disconnect"
              cancelLabel="Cancel"
              busyLabel="Disconnecting…"
            />
          </section>
        </div>

        <div>
          <SectionHeader className="mb-3">Delete Account</SectionHeader>
          <section className={uiSection + " space-y-3 border-red-900/70"}>
            <p className="text-slate-400 text-sm lg:text-base">
              This releases your claimed characters, removes your profile and linked devices,
              revokes account recovery, and permanently deletes this anonymous account. You must
              delete or transfer every campaign you own first.
            </p>
            <ConfirmInline
              triggerLabel="Delete Account"
              onConfirm={handleDeleteAccount}
              requireText="DELETE"
              requirePrompt="Type DELETE to permanently delete this account"
              busy={deletingAccount}
              confirmLabel="Delete permanently"
              cancelLabel="Cancel"
              busyLabel="Deleting…"
            />
          </section>
        </div>
      </Panel>

      {lastDeviceWarningOpen && (
        <ModalShell
          ariaLabel="Disconnect Last Device"
          onClose={() => !disconnectingDevice && setLastDeviceWarningOpen(false)}
          className="max-w-lg"
        >
          <ModalHeader
            title="Disconnect Last Device"
            onClose={() => !disconnectingDevice && setLastDeviceWarningOpen(false)}
          />
          <div className="space-y-4 p-4 lg:p-5">
            <p className="text-sm text-slate-300 lg:text-base">
              This is the last connected device. Make sure you have saved your recovery code or you
              will lose access to this account.
            </p>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
              <Button
                variant="neutral"
                onClick={() => setLastDeviceWarningOpen(false)}
                disabled={disconnectingDevice}
              >
                Keep connected
              </Button>
              <Button
                variant="warning"
                onClick={() => void handleDisconnectDevice(true)}
                disabled={disconnectingDevice}
              >
                {disconnectingDevice ? "Disconnecting…" : "Disconnect anyway"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </PageShell>
  );
}
