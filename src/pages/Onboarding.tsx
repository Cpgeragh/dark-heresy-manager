// src/pages/Onboarding.tsx
// First-launch screen: the user gets a recovery code, or reclaims an existing
// identity. Only shown once — after completion the user doc is marked
// onboarded: true and this screen is never shown again.

import { useState } from "react";
import type { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { registerIdentityRecovery, reclaimIdentity } from "../services/identityService";

type Step = "welcome" | "show-code" | "reclaim";

interface Props {
  user: User;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reclaimCode, setReclaimCode] = useState("");

  async function handleGetStarted() {
    setBusy(true);
    setError(null);
    try {
      const generatedCode = await registerIdentityRecovery(user.uid);
      await updateDoc(doc(db, "users", user.uid), { onboarded: true });
      setCode(generatedCode);
      setStep("show-code");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReclaim() {
    const trimmed = reclaimCode.trim().toUpperCase();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await reclaimIdentity(user.uid, trimmed);
      onComplete();
    } catch (err) {
      console.error("Reclaim error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please check your code and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
              <h1 className="text-2xl font-bold">Dark Heresy Manager</h1>
            </div>

            <p className="text-slate-400 mb-8">
              Welcome. Tap Get Started to set up your account and receive a recovery code.
            </p>

            <button
              onClick={handleGetStarted}
              disabled={busy}
              className="w-full py-4 rounded-xl border border-amber-500 text-amber-400 font-semibold text-lg hover:bg-amber-500/10 transition disabled:opacity-50"
            >
              {busy ? "Setting up…" : "Get Started"}
            </button>

            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              onClick={() => { setError(null); setStep("reclaim"); }}
              className="mt-8 w-full text-sm text-slate-500 hover:text-slate-300 transition text-center"
            >
              Returning user? Reclaim your identity →
            </button>
          </>
        )}

        {/* ── Reclaim ── */}
        {step === "reclaim" && (
          <>
            <button
              onClick={() => { setError(null); setStep("welcome"); }}
              className="mb-6 text-sm text-slate-500 hover:text-slate-300 transition"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold mb-2">Returning User</h1>
            <p className="text-slate-400 mb-6">
              Enter the recovery code you saved when you first set up the app.
            </p>

            <input
              type="text"
              value={reclaimCode}
              onChange={(e) => setReclaimCode(e.target.value.toUpperCase())}
              placeholder="DH-XXXX-YYYY"
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 font-mono text-base placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50 mb-4"
            />

            <button
              onClick={handleReclaim}
              disabled={busy || !reclaimCode.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-base hover:bg-amber-400 transition disabled:opacity-50"
            >
              {busy ? "Reclaiming…" : "Reclaim Identity"}
            </button>

            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </>
        )}

        {/* ── Show code ── */}
        {step === "show-code" && code && (
          <>
            <h1 className="text-2xl font-bold mb-2">Your Recovery Code</h1>
            <p className="text-slate-400 mb-6">
              If you ever lose access to this device, use this code to reclaim your campaigns
              and characters.{" "}
              <strong className="text-slate-200">Write it down somewhere safe.</strong>
            </p>

            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 mb-6 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                Recovery Code
              </p>
              <span className="font-mono text-xl text-amber-400 tracking-widest break-all select-all">
                {code}
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-6 text-center">
              This code is shown only once and cannot be retrieved again without rotating it
              in Settings.
            </p>

            <button
              onClick={onComplete}
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
