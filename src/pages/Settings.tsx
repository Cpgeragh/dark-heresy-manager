// src/pages/Settings.tsx
// User settings: role switching and recovery code management.

import { useState } from "react";
import type { User } from "firebase/auth";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { useToast } from "../components/Toast";
import { uiSection, uiSectionHeader } from "../ui/editableStyles";

type Role = "dm" | "player";

interface Props {
  user: User;
  currentRole: Role;
  onSwitchToDM?: () => void;
  onSwitchToPlayer?: () => void;
}

export default function Settings({ user, currentRole, onSwitchToDM, onSwitchToPlayer }: Props) {
  const toast = useToast();

  // ── Recovery code state ──────────────────────────────────────────────────
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [rotating, setRotating] = useState(false);

  async function handleReveal() {
    setRevealing(true);
    try {
      let code = await getRecoveryCode(user.uid);
      if (!code) {
        code = await rotateRecoveryCode(user.uid, currentRole);
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
      const newCode = await rotateRecoveryCode(user.uid, currentRole);
      setRevealedCode(newCode);
      toast.success("Recovery code rotated. Write down your new code.");
    } catch (err) {
      console.error("Failed to rotate recovery code:", err);
      toast.error("Failed to rotate recovery code. Please try again.");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <h1 className="text-lg font-semibold text-slate-100 text-center">Settings</h1>

      <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-6">

      {/* ── Role ──────────────────────────────────────────────────────────── */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Role</p>
        <section className={uiSection + " space-y-3"}>
          <p className="text-slate-400 text-sm">
            You are currently a{" "}
            <span className="text-slate-200 font-semibold">
              {currentRole === "dm" ? "Dungeon Master" : "Player"}
            </span>
            .
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSwitchToPlayer}
              disabled={currentRole === "player" || !onSwitchToPlayer}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Switch to Player
            </button>
            <button
              onClick={onSwitchToDM}
              disabled={currentRole === "dm" || !onSwitchToDM}
              className="px-4 py-2 rounded-lg border border-amber-500 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Switch to DM
            </button>
          </div>
        </section>
      </div>

      {/* ── Recovery Code ─────────────────────────────────────────────────── */}
      <div>
        <p className={`${uiSectionHeader} mb-3`}>Recovery Code</p>
        <section className={uiSection + " space-y-3"}>
          <p className="text-slate-400 text-sm">
            Use this code to reclaim your{" "}
            {currentRole === "dm" ? "campaigns" : "characters"} if you lose access
            to this device. Keep it somewhere safe and private.
          </p>

          {revealedCode ? (
            <>
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Recovery Code
                </p>
                <span className="font-mono text-lg text-amber-400 tracking-widest break-all select-all">
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
                Rotating generates a new code and invalidates the old one. Your old
                code will no longer work for reclaiming.
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

      </div>
    </div>
  );
}
