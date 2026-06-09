// src/pages/Onboarding.tsx
// First-launch screen: the user picks DM or Player, then receives their
// identity recovery code. Only shown once — after completion the user doc
// is marked onboarded: true and this screen is never shown again.

import { useState } from "react";
import type { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { registerIdentityRecovery } from "../services/identityService";

type Role = "dm" | "player";
type Step = "pick-role" | "show-code";

interface Props {
  user: User;
  onComplete: (role: Role) => void;
}

export default function Onboarding({ user, onComplete }: Props) {
  const [step, setStep] = useState<Step>("pick-role");
  const [role, setRole] = useState<Role | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleSelect(chosen: Role) {
    setBusy(true);
    setError(null);
    try {
      const generatedCode = await registerIdentityRecovery(user.uid, chosen);
      await updateDoc(doc(db, "users", user.uid), {
        role: chosen,
        onboarded: true,
      });
      setRole(chosen);
      setCode(generatedCode);
      setStep("show-code");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleConfirm() {
    if (role) onComplete(role);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* ── Step 1: Role selection ── */}
        {step === "pick-role" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
              <h1 className="text-2xl font-bold">Dark Heresy Manager</h1>
            </div>

            <p className="text-slate-400 mb-8">
              Welcome. Are you running a campaign or playing in one?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRoleSelect("dm")}
                disabled={busy}
                className="py-4 rounded-xl border border-amber-500 text-amber-400 font-semibold text-lg hover:bg-amber-500/10 transition disabled:opacity-50"
              >
                {busy ? "Setting up…" : "I'm the Dungeon Master"}
              </button>
              <button
                onClick={() => handleRoleSelect("player")}
                disabled={busy}
                className="py-4 rounded-xl border border-slate-600 text-slate-300 font-semibold text-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                {busy ? "Setting up…" : "I'm a Player"}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </>
        )}

        {/* ── Step 2: Recovery code display ── */}
        {step === "show-code" && code && (
          <>
            <h1 className="text-2xl font-bold mb-2">Your Recovery Code</h1>
            <p className="text-slate-400 mb-6">
              If you ever lose access to this device, use this code to reclaim your{" "}
              {role === "dm" ? "campaigns" : "characters"}.{" "}
              <strong className="text-slate-200">Write it down somewhere safe.</strong>
            </p>

            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 mb-6 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Recovery Code</p>
              <span className="font-mono text-xl text-amber-400 tracking-widest break-all select-all">
                {code}
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-6 text-center">
              This code is shown only once and cannot be retrieved again.
            </p>

            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-base hover:bg-amber-400 transition"
            >
              I've saved my code
            </button>
          </>
        )}

      </div>
    </div>
  );
}
