// src/pages/Onboarding.tsx
// First-launch screen: the user gets a recovery code, or links this browser to
// an existing identity. Only shown once — after completion the user doc is marked
// onboarded: true and this screen is never shown again.

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { rotateRecoveryCode, getRecoveryCode } from "../services/identityService";
import { completeOnboarding } from "../services/userAccountService";
import { saveFirstName } from "../services/profileService";
import { uiSectionHeader, uiTextError } from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { ArrowLeft, ArrowRight } from "../ui/icons/PickerArrows";
import { Panel } from "../ui/Panel";
import { IdentityRecoveryForm } from "../components/IdentityRecoveryForm";
import { useIdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";

type Step = "welcome" | "show-code" | "link";

interface Props {
  user: User;
  onComplete: () => void;
  effectiveUserId: string;
  firstName: string | null;
}

export default function Onboarding({ user, onComplete, effectiveUserId, firstName }: Props) {
  // The current step lives in the URL (?step=…) so browser/phone Back and
  // Forward move between steps natively. Unknown/absent values → welcome.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStep = searchParams.get("step");
  const step: Step = rawStep === "show-code" || rawStep === "link" ? rawStep : "welcome";

  const goToStep = (next: Step, replace = false) =>
    setSearchParams(next === "welcome" ? {} : { step: next }, { replace });

  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const recoveryFlow = useIdentityRecoveryFlow();
  const failRecoveryCompletion = recoveryFlow.failCompletion;
  const resetRecoveryFlow = recoveryFlow.reset;
  const [awaitingLinkedProfile, setAwaitingLinkedProfile] = useState(false);
  const linkCompletionRef = useRef(false);
  const [awaitingReclaimedProfile, setAwaitingReclaimedProfile] = useState(false);
  const reclaimCompletionRef = useRef(false);

  // Linking is non-destructive. Wait until the live device-link and profile
  // subscriptions have resolved the primary identity, then mark this local
  // browser's user document as onboarded and open the shared account.
  useEffect(() => {
    if (
      !awaitingLinkedProfile ||
      effectiveUserId === user.uid ||
      !firstName ||
      linkCompletionRef.current
    ) {
      return;
    }

    linkCompletionRef.current = true;
    let ignore = false;
    completeOnboarding(user.uid)
      .then(() => {
        if (ignore) return;
        setSearchParams({}, { replace: true });
        onComplete();
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to finish device linking:", err);
        linkCompletionRef.current = false;
        setAwaitingLinkedProfile(false);
        failRecoveryCompletion(
          "This device was linked, but setup could not be completed. Please try again."
        );
      });

    return () => {
      ignore = true;
    };
  }, [
    awaitingLinkedProfile,
    effectiveUserId,
    firstName,
    onComplete,
    setSearchParams,
    user.uid,
    failRecoveryCompletion,
  ]);

  useEffect(() => {
    if (!awaitingLinkedProfile) return;
    const timeout = window.setTimeout(() => {
      setAwaitingLinkedProfile(false);
      failRecoveryCompletion(
        "This device was linked, but the account is still loading. Please try again."
      );
    }, 15_000);
    return () => window.clearTimeout(timeout);
  }, [awaitingLinkedProfile, failRecoveryCompletion]);

  useEffect(() => {
    if (!awaitingReclaimedProfile || !firstName || reclaimCompletionRef.current) return;
    reclaimCompletionRef.current = true;
    setSearchParams({}, { replace: true });
    onComplete();
  }, [awaitingReclaimedProfile, firstName, onComplete, setSearchParams]);

  useEffect(() => {
    if (!awaitingReclaimedProfile) return;
    const timeout = window.setTimeout(() => {
      setAwaitingReclaimedProfile(false);
      failRecoveryCompletion(
        "Your identity was reclaimed, but the account is still loading. Please try again."
      );
    }, 15_000);
    return () => window.clearTimeout(timeout);
  }, [awaitingReclaimedProfile, failRecoveryCompletion]);

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
      .catch(() => {
        if (ignore) return;
        setError("Couldn't load your recovery code. Please try again.");
        setSearchParams({}, { replace: true });
      });
    return () => {
      ignore = true;
    };
  }, [step, code, user.uid, setSearchParams]);

  async function handleFinish() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(user.uid);
      setSearchParams({}, { replace: true });
      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setError("Couldn't complete onboarding. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function handleGetStarted() {
    if (busyRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your first name.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await saveFirstName(effectiveUserId, trimmedName);
      const generatedCode = await rotateRecoveryCode(user.uid);
      setCode(generatedCode);
      setCopied(false);
      setSavedConfirmed(false);
      goToStep("show-code");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm lg:max-w-md w-full">
        {/* ── Welcome ── */}
        {step === "welcome" && (
          <div className="space-y-6 text-slate-100">
            <h1 className="text-lg lg:text-xl font-semibold text-slate-100 text-center">Welcome</h1>

            <Panel spacing="compact">
              <p className="text-slate-300 text-sm lg:text-base">
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
                  className="mt-1 w-full px-4 lg:px-5 py-3 lg:py-3.5 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-base lg:text-lg placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <span className="mt-1 block text-[11px] lg:text-xs text-amber-300 text-center">
                  First name only. Used on your dashboard and your character sheets.
                </span>
              </label>

              <Button
                fullWidth
                size="lg"
                onClick={handleGetStarted}
                disabled={busy || !name.trim()}
              >
                {busy ? "Setting up…" : "Get Started"}
              </Button>

              {error && <p className={`${uiTextError} text-center`}>{error}</p>}

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  resetRecoveryFlow();
                  goToStep("link");
                }}
                className="w-full text-sm lg:text-base text-slate-300 hover:text-slate-100 transition flex items-center justify-center gap-2"
              >
                <span>Already have an account? Connect this device</span>
                <ArrowRight />
              </button>
            </Panel>
          </div>
        )}

        {/* ── Link existing account ── */}
        {step === "link" && (
          <div className="space-y-6 text-slate-100">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  resetRecoveryFlow();
                  goToStep("welcome");
                }}
                className="absolute left-0 text-sm lg:text-base text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
              >
                <ArrowLeft />
                <span>Back</span>
              </button>
              <h1 className="text-lg lg:text-xl font-semibold text-center">
                Connect Existing Account
              </h1>
            </div>

            <Panel spacing="compact">
              <IdentityRecoveryForm
                flow={recoveryFlow}
                deviceNoun="device"
                description={
                  <>
                    Enter the recovery code. The account's connected-device records determine the
                    one available action.
                  </>
                }
                onLinked={() => setAwaitingLinkedProfile(true)}
                onReclaimed={() => setAwaitingReclaimedProfile(true)}
              />
            </Panel>
          </div>
        )}

        {/* ── Show code ── */}
        {step === "show-code" && code && (
          <div className="space-y-6 text-slate-100">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => goToStep("welcome")}
                className="absolute left-0 text-sm lg:text-base text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
              >
                <ArrowLeft />
                <span>Back</span>
              </button>
              <h1 className="text-lg lg:text-xl font-semibold text-slate-100 text-center">
                Data Recovery Code
              </h1>
            </div>

            <Panel spacing="compact">
              <p className="text-slate-300 text-sm lg:text-base text-center">
                Use this code to connect your account on another device.
              </p>
              <p className="text-slate-100 text-sm lg:text-base text-center font-semibold">
                Write it down somewhere safe.
              </p>

              <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 text-center">
                <p className="text-xs lg:text-sm font-semibold text-amber-400 uppercase tracking-widest mb-2">
                  Recovery Code
                </p>
                <span className="font-code [font-feature-settings:'zero'] text-xl lg:text-2xl text-white tracking-widest break-all select-all">
                  {code}
                </span>
              </div>

              <p className="text-sm lg:text-base text-amber-300 text-center">
                This code is shown only once and cannot be retrieved again without rotating it in
                Settings.
              </p>

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                    setCopied(true);
                  }}
                  disabled={copied}
                >
                  {copied ? "Copied" : "Copy code"}
                </Button>
              </div>

              <label className="flex items-center justify-center gap-2 text-sm lg:text-base text-slate-300 cursor-pointer">
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
                <p className="text-xs lg:text-sm text-amber-300 text-center">
                  Copy your code, then tick the box to continue.
                </p>
              )}

              {error && <p className={`${uiTextError} text-center`}>{error}</p>}

              <Button
                fullWidth
                size="lg"
                onClick={handleFinish}
                disabled={!savedConfirmed || !copied || busy}
              >
                {busy ? "Saving…" : "I've saved my code"}
              </Button>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
