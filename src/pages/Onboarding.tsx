// src/pages/Onboarding.tsx
// First-launch screen: the user gets a recovery code, or reclaims an existing
// identity. Only shown once — after completion the user doc is marked
// onboarded: true and this screen is never shown again.

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { rotateRecoveryCode, reclaimIdentity, getRecoveryCode } from "../services/identityService";
import { saveFirstName } from "../services/profileService";
import { uiSectionHeader } from "../ui/editableStyles";

type Step = "welcome" | "show-code" | "reclaim";

interface Props {
  user: User;
  onComplete: () => void;
  setFirstName: (value: string) => void;
}

export default function Onboarding({ user, onComplete, setFirstName }: Props) {
  // The current step lives in the URL (?step=…) so browser/phone Back and
  // Forward move between steps natively. Unknown/absent values → welcome.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStep = searchParams.get("step");
  const step: Step = rawStep === "show-code" || rawStep === "reclaim" ? rawStep : "welcome";

  const goToStep = (next: Step, replace = false) =>
    setSearchParams(next === "welcome" ? {} : { step: next }, { replace });

  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reclaimCode, setReclaimCode] = useState("");
  const [name, setName] = useState("");
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // On a reload that lands back on the code step, the code value is gone from
  // memory — rehydrate it from the server. If none exists, fall back to welcome.
  useEffect(() => {
    if (step !== "show-code" || code) return;
    let ignore = false;
    getRecoveryCode(user.uid)
      .then((existing) => {
        if (ignore) return;
        if (existing) setCode(existing);
        else setSearchParams({}, { replace: true });
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [step, code, user.uid, setSearchParams]);

  async function handleFinish() {
    try {
      await updateDoc(doc(db, "users", user.uid), { onboarded: true, recoveryBackedUp: true });
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
    setSearchParams({}, { replace: true });
    onComplete();
  }

  async function handleGetStarted() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your first name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveFirstName(user.uid, trimmedName);
      const generatedCode = await rotateRecoveryCode(user.uid);
      setFirstName(trimmedName);
      setCode(generatedCode);
      setCopied(false);
      setSavedConfirmed(false);
      goToStep("show-code");
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
      setSearchParams({}, { replace: true });
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
          <div className="space-y-6 text-slate-100">
            <h1 className="text-lg font-semibold text-slate-100 text-center">Welcome</h1>

            <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-4">
              <p className="text-slate-400 text-sm">
                Enter your first name, then tap Get Started to set up your account and receive a
                recovery code.
              </p>

              <label className="block">
                <span className={uiSectionHeader}>First name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
                  placeholder="e.g. David"
                  disabled={busy}
                  maxLength={50}
                  className="mt-1 w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  First name only. Used on your dashboard and your character sheets.
                </span>
              </label>

              <button
                onClick={handleGetStarted}
                disabled={busy || !name.trim()}
                className="w-full py-3 rounded-lg border border-amber-500 text-amber-400 font-semibold hover:bg-amber-500/10 transition disabled:opacity-50"
              >
                {busy ? "Setting up…" : "Get Started"}
              </button>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                onClick={() => { setError(null); goToStep("reclaim"); }}
                className="w-full text-sm text-slate-300 hover:text-slate-100 transition text-center"
              >
                Returning user? Reclaim your identity →
              </button>
            </div>
          </div>
        )}

        {/* ── Reclaim ── */}
        {step === "reclaim" && (
          <>
            <button
              onClick={() => { setError(null); goToStep("welcome"); }}
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
          <div className="space-y-6 text-slate-100">
            <h1 className="text-lg font-semibold text-slate-100 text-center">Data Recovery Code</h1>

            <div className="border border-slate-700 bg-slate-900/40 p-4 rounded-lg space-y-4">
              <p className="text-slate-300 text-sm text-center">
                If you ever lose access to this device, use this code to reclaim your campaigns
                and characters.
              </p>
              <p className="text-slate-100 text-sm text-center font-semibold">
                Write it down somewhere safe.
              </p>

              <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 text-center">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">
                  Recovery Code
                </p>
                <span className="font-mono text-xl text-white tracking-widest break-all select-all">
                  {code}
                </span>
              </div>

              <p className="text-sm text-amber-300 text-center">
                This code is shown only once and cannot be retrieved again without rotating it
                in Settings.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); }}
                  disabled={copied}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 text-slate-900 hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {copied ? "Copied" : "Copy code"}
                </button>

              </div>

              <label className="flex items-center justify-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savedConfirmed}
                  onChange={(e) => setSavedConfirmed(e.target.checked)}
                  disabled={!copied}
                  className="h-4 w-4 shrink-0 mt-[2px]"
                />
                <span>I've saved my recovery code somewhere safe.</span>
              </label>

              {!copied && (
                <p className="text-xs text-amber-300 text-center">
                  Copy your code, then tick the box to continue.
                </p>
              )}

              <button
                onClick={handleFinish}
                disabled={!savedConfirmed || !copied}
                className="w-full py-3 rounded-lg bg-amber-500 text-slate-900 font-bold text-base hover:bg-amber-400 transition disabled:opacity-50"
              >
                I've saved my code
              </button>

              <button
                onClick={() => goToStep("welcome")}
                className="w-full text-sm text-slate-300 hover:text-slate-100 transition text-center"
              >
                ← Change name
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
