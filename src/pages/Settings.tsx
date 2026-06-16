// src/pages/Settings.tsx
// User settings: recovery code management and device linking.

import { useState } from "react";
import type { User } from "firebase/auth";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { useLinkDevice } from "../hooks/useLinkDevice";
import { useToast } from "../components/Toast";
import { uiSection, uiSectionHeader } from "../ui/editableStyles";

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
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [rotating, setRotating] = useState(false);

  // ── Device link state ────────────────────────────────────────────────────
  const { linkDevice, loading: linking, error: linkError } = useLinkDevice();
  const [linkCode, setLinkCode] = useState("");
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  async function handleReveal() {
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
      setRevealing(false);
    }
  }

  async function handleRotate() {
    setRotating(true);
    setConfirmRotate(false);
    try {
      const newCode = await rotateRecoveryCode(effectiveUserId);
      setRevealedCode(newCode);
      toast.success("Recovery code rotated. Write down your new code.");
    } catch (err) {
      console.error("Failed to rotate recovery code:", err);
      toast.error("Failed to rotate recovery code. Please try again.");
    } finally {
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
    setUnlinking(true);
    try {
      await unlink();
      setConfirmUnlink(false);
      toast.success("Device unlinked.");
    } catch {
      toast.error("Failed to unlink device. Please try again.");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">Settings</h1>

      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">

        {/* ── Recovery Code ───────────────────────────────────────────────── */}
        <div>
          <p className={`${uiSectionHeader} mb-3`}>Recovery Code</p>
          <section className={uiSection + " space-y-3"}>
            <p className="text-slate-400 text-sm">
              Use this code to reclaim your campaigns and characters if you lose access to
              this device. Keep it somewhere safe and private.
            </p>

            {revealedCode ? (
              <>
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                    Recovery Code
                  </p>
                  <span className="font-code [font-feature-settings:'zero'] text-lg text-amber-400 tracking-widest break-all select-all">
                    {revealedCode}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setRevealedCode(null)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
                  >
                    Hide
                  </button>
                  {confirmRotate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-amber-400">Rotate code?</span>
                      <button
                        onClick={handleRotate}
                        disabled={rotating}
                        className="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition disabled:opacity-50"
                      >
                        {rotating ? "Rotating…" : "Yes, rotate"}
                      </button>
                      <button
                        onClick={() => setConfirmRotate(false)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRotate(true)}
                      disabled={rotating}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      Rotate Code
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Rotating generates a new code and invalidates the old one.
                </p>
              </>
            ) : (
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="px-3 py-2 text-sm rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition disabled:opacity-50"
              >
                {revealing ? "Loading…" : "Reveal Recovery Code"}
              </button>
            )}
          </section>
        </div>

        {/* ── Linked Device ───────────────────────────────────────────────── */}
        <div>
          <p className={`${uiSectionHeader} mb-3`}>Linked Device</p>
          <section className={uiSection + " space-y-3"}>
            {isLinked ? (
              <>
                <p className="text-slate-400 text-sm">
                  This device is linked to another account. All campaigns and characters
                  from that account are accessible here.
                </p>
                {confirmUnlink ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-amber-400">Unlink this device?</span>
                    <button
                      onClick={handleUnlink}
                      disabled={unlinking}
                      className="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition disabled:opacity-50"
                    >
                      {unlinking ? "Unlinking…" : "Yes, unlink"}
                    </button>
                    <button
                      onClick={() => setConfirmUnlink(false)}
                      disabled={unlinking}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmUnlink(true)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 transition"
                  >
                    Unlink This Device
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm">
                  Enter the recovery code from your other device to access all its campaigns
                  and characters here.
                </p>
                <input
                  type="text"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value)}
                  placeholder="Paste recovery code here"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                {linkError && <p className="text-red-400 text-sm">{linkError}</p>}
                <button
                  onClick={handleLinkDevice}
                  disabled={linking || !linkCode.trim()}
                  className="px-3 py-2 text-sm rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {linking ? "Linking…" : "Link This Device"}
                </button>
              </>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}
