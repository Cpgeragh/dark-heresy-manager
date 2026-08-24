// src/pages/Settings.tsx
// User settings: recovery code management and device linking.

import { useRef, useState } from "react";
import type { User } from "firebase/auth";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { useLinkDevice } from "../hooks/useLinkDevice";
import { useToast } from "../components/Toast";
import { uiSection, uiTextError } from "../ui/editableStyles";
import { Button } from "../ui/Button";
import { ConfirmInline } from "../ui/ConfirmInline";
import { PageShell } from "../ui/PageShell";
import { Panel } from "../ui/Panel";
import { SectionHeader } from "../ui/SectionHeader";

interface Props {
  user: User;
  effectiveUserId: string;
  isLinked: boolean;
  unlink: () => Promise<void>;
}

export default function Settings({ user: _user, effectiveUserId, isLinked, unlink }: Props) {
  const toast = useToast();

  // ── Recovery code state ──────────────────────────────────────────────────
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const revealingRef = useRef(false);
  const [rotating, setRotating] = useState(false);
  const rotatingRef = useRef(false);

  // ── Device link state ────────────────────────────────────────────────────
  const { linkDevice, loading: linking, error: linkError } = useLinkDevice();
  const [linkCode, setLinkCode] = useState("");
  const [unlinking, setUnlinking] = useState(false);
  const unlinkingRef = useRef(false);

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

  async function handleLinkDevice() {
    try {
      await linkDevice(linkCode);
      setLinkCode("");
      toast.success("Device linked successfully.");
    } catch {
      // linkError is set by useLinkDevice; nothing extra needed here
    }
  }

  async function handleUnlink() {
    if (unlinkingRef.current) return;
    unlinkingRef.current = true;
    setUnlinking(true);
    try {
      await unlink();
      toast.success("Device unlinked.");
    } catch {
      toast.error("Failed to unlink device. Please try again.");
    } finally {
      unlinkingRef.current = false;
      setUnlinking(false);
    }
  }

  return (
    <PageShell title="Settings">
      <Panel>
        {/* ── Recovery Code ───────────────────────────────────────────────── */}
        <div>
          <SectionHeader className="mb-3">Recovery Code</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            <p className="text-slate-400 text-sm lg:text-base">
              Use this code to reclaim your campaigns and characters if you lose access to this
              device. Keep it somewhere safe and private.
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
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={handleReveal} disabled={revealing}>
                {revealing ? "Loading…" : "Reveal Recovery Code"}
              </Button>
            )}
          </section>
        </div>

        {/* ── Linked Device ───────────────────────────────────────────────── */}
        <div>
          <SectionHeader className="mb-3">Linked Device</SectionHeader>
          <section className={uiSection + " space-y-3"}>
            {isLinked ? (
              <>
                <p className="text-slate-400 text-sm lg:text-base">
                  This device is linked to another account. All campaigns and characters from that
                  account are accessible here.
                </p>
                <ConfirmInline
                  triggerLabel="Unlink This Device"
                  question="Unlink this device?"
                  onConfirm={handleUnlink}
                  variant="warning"
                  busy={unlinking}
                  confirmLabel="Yes, unlink"
                  cancelLabel="Cancel"
                  busyLabel="Unlinking…"
                />
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm lg:text-base">
                  Enter the recovery code from your other device to access all its campaigns and
                  characters here.
                </p>
                <input
                  type="text"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  placeholder="Paste recovery code here"
                  className="w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm lg:text-base placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                {linkError && <p className={uiTextError}>{linkError}</p>}
                <Button onClick={handleLinkDevice} disabled={linking || !linkCode.trim()}>
                  {linking ? "Linking…" : "Link This Device"}
                </Button>
              </>
            )}
          </section>
        </div>
      </Panel>
    </PageShell>
  );
}
