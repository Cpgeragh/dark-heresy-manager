// src/pages/NameGate.tsx
// Shown to existing (already-onboarded) users who don't yet have a first name
// on their public profile. They must provide one before using the app again.

import { useState } from "react";
import { saveFirstName } from "../services/profileService";
import { Button } from "../ui/Button";

interface Props {
  effectiveUserId: string;
}

export default function NameGate({ effectiveUserId }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your first name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveFirstName(effectiveUserId, trimmed);
    } catch (err) {
      console.error("Failed to save name:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm lg:max-w-md w-full">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">One quick thing</h1>
        <p className="text-sm lg:text-base text-slate-400 mb-6">
          Please add your name. First name only. Used on your dashboard and your character sheets.
        </p>

        <label className="block mb-6">
          <span className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-400">
            First name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
            placeholder="e.g. David"
            disabled={busy}
            maxLength={50}
            className="mt-1 w-full px-4 lg:px-5 py-3 lg:py-3.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 text-base lg:text-lg placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
        </label>

        <Button fullWidth size="lg" onClick={handleSave} disabled={busy || !name.trim()}>
          {busy ? "Saving…" : "Continue"}
        </Button>

        {error && <p className="mt-4 text-red-400 text-sm lg:text-base text-center">{error}</p>}
      </div>
    </div>
  );
}
