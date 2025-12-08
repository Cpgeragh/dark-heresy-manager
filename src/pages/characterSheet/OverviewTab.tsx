// src/pages/characterSheet/OverviewTab.tsx
import type { Character } from "../../types/Character";

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
  return (
    <div className="space-y-4 text-slate-300">
      <p>
        This will later show wounds, fate, insanity, corruption, movement, etc.
      </p>

      {character.recoveryCode && (
        <p className="text-xs text-slate-500">
          Recovery code: {character.recoveryCode}
        </p>
      )}

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