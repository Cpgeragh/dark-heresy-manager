// src/pages/NameGate.tsx
// Shown to existing (already-onboarded) users who don't yet have a first name
// on their public profile. They must provide one before using the app again.

import { useState } from "react";
import type { User } from "firebase/auth";
import { saveFirstName } from "../services/profileService";

interface Props {
  user: User;
  onSaved: (name: string) => void;
}

export default function NameGate({ user, onSaved }: Props) {
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
      await saveFirstName(user.uid, trimmed);
      onSaved(trimmed);
    } catch (err) {
      console.error("Failed to save name:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2">One quick thing</h1>
        <p className="text-slate-400 mb-6">
          Please add your first name to continue. It's shown on your dashboard and lets your DM
          and party know who you are.
        </p>

        <label className="block mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            First name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. David"
            disabled={busy}
            maxLength={50}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 text-base placeholder:text-slate-600 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
        </label>

        <p className="text-[11px] text-slate-500 mb-6">First name only, for data protection.</p>

        <button
          onClick={handleSave}
          disabled={busy || !name.trim()}
          className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-base hover:bg-amber-400 transition disabled:opacity-50"
        >
          {busy ? "Saving…" : "Continue"}
        </button>

        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
