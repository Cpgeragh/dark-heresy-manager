// src/pages/Onboarding.tsx
// First-launch screen: the user gets a recovery code, or links this browser to
// an existing identity. Only shown once — after completion the user doc is marked
// onboarded: true and this screen is never shown again.

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { createAccount, getRecoveryCode } from "../services/identityService";
import { completeOnboarding, discardOnboardingSetup } from "../services/userAccountService";
import { saveFirstName } from "../services/profileService";
import {
  editableInputClass,
  uiInfoModalWrapper,
  uiSectionHeader,
} from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { TitleHeaderActionButton } from "../ui/buttons/TitleHeaderActionButton";
import { ArrowLeft } from "../ui/icons/PickerArrows";
import { Panel } from "../ui/Panel";
import { IdentityRecoveryForm } from "../components/IdentityRecoveryForm";
import { useIdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { AppHeaderShell } from "../components/AppHeaderShell";
import { CenteredTitleHeader } from "../ui/CenteredTitleHeader";
import { InfoModal } from "../components/InfoModal";
import { useToast } from "../components/Toast";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { formatFirstNameInput } from "../utils/firstName";
import {
  colourMetadataLabelText,
  colourRequiredText,
  colourTextPrimary,
} from "../ui/styles/colourTokens";
import { RequiredFieldsNote } from "../ui/forms/CustomFormFooter";
import { ModalShell } from "../ui/modals/ModalShell";
import { ModalHeader } from "../ui/modals/ModalHeader";
import { LoadingState } from "../ui/LoadingState";

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
  const [codeLoading, setCodeLoading] = useState(step === "show-code");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [name, setName] = useState(firstName ?? "");
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelSetupOpen, setCancelSetupOpen] = useState(false);
  const [discardingSetup, setDiscardingSetup] = useState(false);
  const discardingSetupRef = useRef(false);
  const previousStepRef = useRef(step);
  const allowShowCodeExitRef = useRef(false);
  const skipCodeRehydrationRef = useRef(false);
  const recoveryFlow = useIdentityRecoveryFlow();
  const failRecoveryCompletion = recoveryFlow.failCompletion;
  const resetRecoveryFlow = recoveryFlow.reset;
  const [awaitingLinkedProfile, setAwaitingLinkedProfile] = useState(false);
  const linkCompletionRef = useRef(false);
  const toast = useToast();
  const recoveryBusy = recoveryFlow.phase !== "idle" || recoveryFlow.linkRequestPending;

  useLayoutEffect(() => {
    const previousStep = previousStepRef.current;
    previousStepRef.current = step;
    if (previousStep !== "show-code" || step === "show-code") return;

    if (allowShowCodeExitRef.current) {
      allowShowCodeExitRef.current = false;
      return;
    }
    if (!code) return;

    setSearchParams({ step: "show-code" }, { replace: true });
    if (busyRef.current || discardingSetupRef.current) return;
    setCancelSetupOpen(true);
  }, [code, setSearchParams, step]);

  useEffect(() => {
    if (step === "link") return;
    resetRecoveryFlow();
    setAwaitingLinkedProfile(false);
    linkCompletionRef.current = false;
  }, [step, resetRecoveryFlow]);

  // Linking is non-destructive. Wait until the live device-link and profile
  // subscriptions have resolved the permanent account, then mark this local
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
    completeOnboarding()
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

  // On a reload that lands back on the code step, the code value is gone from
  // memory — rehydrate it from the server. If none exists, fall back to welcome.
  useEffect(() => {
    if (step !== "show-code" || code || skipCodeRehydrationRef.current) return;
    let ignore = false;
    setCodeLoading(true);
    getRecoveryCode(effectiveUserId)
      .then((existing) => {
        if (ignore) return;
        setCodeLoading(false);
        if (existing) {
          setCode(existing);
        } else {
          setSearchParams({}, { replace: true });
        }
      })
      .catch(() => {
        if (ignore) return;
        setCodeLoading(false);
        toast.error("Couldn't load your recovery code. Please try again.");
        setSearchParams({}, { replace: true });
      });
    return () => {
      ignore = true;
    };
  }, [step, code, effectiveUserId, setSearchParams, toast]);

  async function handleFinish() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await completeOnboarding();
      setSearchParams({}, { replace: true });
      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      toast.error("Couldn't complete onboarding. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function handleGetStarted() {
    if (busyRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning("Please enter your first name.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    skipCodeRehydrationRef.current = false;
    try {
      const created = await createAccount();
      await saveFirstName(created.accountId, trimmedName);
      const nextCode = created.code;
      setCode(nextCode);
      setCopied(false);
      setSavedConfirmed(false);
      busyRef.current = false;
      setBusy(false);
      goToStep("show-code");
    } catch (err) {
      console.error("Onboarding error:", err);
      toast.error("Couldn't create your account. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function handleConnectExisting() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await discardOnboardingSetup();
      resetRecoveryFlow();
      goToStep("link");
    } catch (err) {
      console.error("Failed to open account connection:", err);
      toast.error("Couldn't open account connection. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function handleCopyCode() {
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
      toast.error("Couldn't copy the recovery code. Select it and copy it manually.");
    }
  }

  async function handleDiscardSetup() {
    if (discardingSetupRef.current) return;
    discardingSetupRef.current = true;
    setDiscardingSetup(true);
    try {
      await discardOnboardingSetup();
      skipCodeRehydrationRef.current = true;
      allowShowCodeExitRef.current = true;
      setCancelSetupOpen(false);
      setCode(null);
      setCodeLoading(false);
      setCopied(false);
      setSavedConfirmed(false);
      setName("");
      goToStep("welcome", true);
    } catch (err) {
      console.error("Failed to cancel account setup:", err);
      toast.error("Couldn't cancel account setup. Please try again.");
    } finally {
      discardingSetupRef.current = false;
      setDiscardingSetup(false);
    }
  }

  function closeCancelSetup() {
    if (!discardingSetupRef.current) setCancelSetupOpen(false);
  }

  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <AppHeaderShell />

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm lg:max-w-md w-full">
          {/* ── Welcome ── */}
          {step === "welcome" && (
            <Panel spacing="none" padding="none" className="overflow-hidden">
              <CenteredTitleHeader as="h1" size="page" title="Create Your Account" />

              <form
                className="space-y-4 p-4 lg:p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleGetStarted();
                }}
              >
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <label htmlFor="onboarding-first-name">
                      <span className={uiSectionHeader}>First Name</span>
                    </label>
                    <span className={uiInfoModalWrapper}>
                      <InfoModal
                        title="First Name"
                        content={<p>Used on your dashboard and character sheets.</p>}
                      />
                    </span>
                  </div>
                  <input
                    id="onboarding-first-name"
                    type="text"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    value={name}
                    onChange={(e) => setName(formatFirstNameInput(e.target.value))}
                    placeholder="e.g. David"
                    disabled={busy}
                    maxLength={PRODUCT_LIMITS.firstNameCharacters}
                    className={editableInputClass(true)}
                  />
                </div>

                <Button type="submit" fullWidth size="lg" disabled={busy || !name.trim()}>
                  {busy ? "Setting up…" : "Create new account"}
                </Button>

                <Button
                  variant="neutral"
                  fullWidth
                  size="lg"
                  onClick={() => void handleConnectExisting()}
                  disabled={busy}
                >
                  {busy ? "Opening…" : "Connect existing account"}
                </Button>
              </form>
            </Panel>
          )}

          {/* ── Link existing account ── */}
          {step === "link" && (
            <Panel spacing="none" padding="none" className="overflow-hidden">
              <CenteredTitleHeader
                as="h1"
                size="page"
                title="Connect Existing Account"
                left={
                  <TitleHeaderActionButton
                    align="start"
                    aria-label="Back"
                    disabled={recoveryBusy}
                    onClick={() => {
                      resetRecoveryFlow();
                      goToStep("welcome");
                    }}
                  >
                    <ArrowLeft />
                  </TitleHeaderActionButton>
                }
              />

              <div className="space-y-4 p-4 lg:p-5">
                <IdentityRecoveryForm
                  flow={recoveryFlow}
                  deviceNoun="device"
                  checkLabel="Find account"
                  inputAppearance="form"
                  inputLabelAside={
                    <span className={uiInfoModalWrapper}>
                      <InfoModal
                        title="Recovery Code"
                        content={
                          <p>
                            Enter your existing account’s recovery code. You can use it to connect
                            this device or restore access if your previous device is no longer
                            connected.
                          </p>
                        }
                      />
                    </span>
                  }
                  onLinked={() => setAwaitingLinkedProfile(true)}
                />
              </div>
            </Panel>
          )}

          {/* ── Show code ── */}
          {step === "show-code" && (
            <Panel spacing="none" padding="none" className="overflow-hidden">
              <CenteredTitleHeader
                as="h1"
                size="page"
                title="Save Your Recovery Code"
                left={
                  <TitleHeaderActionButton
                    align="start"
                    aria-label="Back"
                    disabled={busy || (!code && codeLoading) || discardingSetup}
                    onClick={() => setCancelSetupOpen(true)}
                  >
                    <ArrowLeft />
                  </TitleHeaderActionButton>
                }
              />

              {code ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (savedConfirmed && !busy) void handleFinish();
                  }}
                >
                  <div className="space-y-4 p-4 lg:p-5">
                    <p className={`text-center text-sm lg:text-base ${colourTextPrimary}`}>
                      Use this code to connect another device or recover your account.
                    </p>

                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 text-center">
                      <p
                        className={`text-xs lg:text-sm font-semibold ${colourMetadataLabelText} uppercase tracking-widest mb-2`}
                      >
                        Recovery Code
                      </p>
                      <span className="font-code [font-feature-settings:'zero'] text-xl lg:text-2xl text-white tracking-widest break-all select-all">
                        {code}
                      </span>
                    </div>

                    <p className="text-sm lg:text-base text-amber-300 text-center">
                      Keep it private. Anyone with this code may be able to access your account.
                    </p>

                    <Button
                      fullWidth
                      size="lg"
                      onClick={() => void handleCopyCode()}
                      disabled={copied}
                    >
                      {copied ? "Copied" : "Copy recovery code"}
                    </Button>

                    <label
                      className={`flex cursor-pointer items-center justify-center gap-2 text-sm lg:text-base ${colourTextPrimary}`}
                    >
                      <input
                        type="checkbox"
                        required
                        checked={savedConfirmed}
                        onChange={(e) => setSavedConfirmed(e.target.checked)}
                        className="h-4 w-4 shrink-0"
                      />
                      <span>
                        I've saved my recovery code somewhere safe.{" "}
                        <span className={colourRequiredText} aria-hidden="true">
                          *
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="border-t border-slate-700 px-4 py-3 lg:px-5 lg:py-4">
                    <div className="space-y-2">
                      <Button type="submit" fullWidth size="lg" disabled={!savedConfirmed || busy}>
                        {busy ? "Saving…" : "Continue to dashboard"}
                      </Button>
                      <RequiredFieldsNote />
                    </div>
                  </div>
                </form>
              ) : (
                <LoadingState className="p-6 text-center">Loading recovery code…</LoadingState>
              )}
            </Panel>
          )}
        </div>
      </main>

      {cancelSetupOpen && code && (
        <ModalShell
          ariaLabel="Cancel New Account Setup"
          onClose={closeCancelSetup}
          className="max-w-lg overflow-y-auto"
        >
          <ModalHeader title="Cancel New Account Setup" onClose={closeCancelSetup} />
          <div className="space-y-4 p-4 lg:p-5">
            <p className="text-sm text-slate-300 lg:text-base">
              Cancel new account setup? This recovery code will no longer work.
            </p>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
              <Button variant="neutral" onClick={closeCancelSetup} disabled={discardingSetup}>
                Keep setting up
              </Button>
              <Button onClick={() => void handleDiscardSetup()} disabled={discardingSetup}>
                {discardingSetup ? "Cancelling…" : "Cancel account setup"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
