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

      {/* Character Basics */}
      <div>
        <h2 className="text-xl font-semibold">
          {character.header?.characterName ?? "Unnamed Character"}
        </h2>

        {character.header?.career && (
          <p className="text-sm text-slate-400">Career: {character.header.career}</p>
        )}

        {character.userId && (
          <p className="text-xs text-slate-500">
            Claimed by: <code>{character.userId}</code>
          </p>
        )}
      </div>

      {/* Placeholder for future data */}
      <p>This will later show wounds, fate, insanity, corruption, movement, etc.</p>

      {/* Recovery Code */}
      {character.recoveryCode && (
        <p className="text-xs text-slate-500">
          Recovery code: {character.recoveryCode}
        </p>
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