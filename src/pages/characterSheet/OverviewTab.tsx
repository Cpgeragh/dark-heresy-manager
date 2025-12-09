// src/pages/characterSheet/OverviewTab.tsx

import type { Character } from "../../types/Character";
import { useState } from "react";

interface OverviewTabProps {
  character: Character;
  canPlayerRelease: boolean;
  onPlayerRelease: () => void;
}

export function OverviewTab({
  character,
  canPlayerRelease,
  onPlayerRelease,
}: OverviewTabProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const recoveryCode = character.recoveryCode ?? null;

  async function copyCode() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-4 text-slate-300">

      {/* Character Basics */}
      <div>
        <h2 className="text-xl font-semibold">
          {character.header?.characterName ?? "Unnamed Character"}
        </h2>

        {character.header?.career && (
          <p className="text-sm text-slate-400">
            Career: {character.header.career}
          </p>
        )}

        {character.userId && (
          <p className="text-xs text-slate-500">
            Claimed by: <code>{character.userId}</code>
          </p>
        )}
      </div>

      {/* Placeholder for future stats */}
      <p>This will later show wounds, fate, insanity, corruption, movement, etc.</p>

      {/* Recovery Code */}
      {recoveryCode && (
        <div className="p-3 rounded border border-slate-700 bg-slate-900/40 space-y-1">
          <div className="text-xs text-slate-400">Recovery Code</div>

          <div className="flex items-center gap-2">
            {showCode ? (
              <code className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-amber-300">
                {recoveryCode}
              </code>
            ) : (
              <code className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400">
                ••••••••••
              </code>
            )}

            <button
              onClick={() => setShowCode(!showCode)}
              className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 hover:bg-slate-600"
            >
              {showCode ? "Hide" : "Show"}
            </button>

            <button
              onClick={copyCode}
              className="px-2 py-1 text-xs rounded bg-slate-700 border border-slate-600 hover:bg-slate-600"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Use this code to claim this character on another device.
          </p>
        </div>
      )}

      {/* Player Release Button */}
      {canPlayerRelease && (
        <button
          onClick={onPlayerRelease}
          className="px-3 py-2 bg-red-600 text-white rounded border border-red-700 hover:bg-red-500"
        >
          Release Character
        </button>
      )}
    </div>
  );
}