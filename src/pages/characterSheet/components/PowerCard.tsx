// src/pages/characterSheet/components/PowerCard.tsx

import { InfoModal } from "../../../components/InfoModal";
import { sourceColour } from "../../../ui/sourceStyles";
import type { PsychicPower } from "../../../types/Character";

interface PowerCardProps {
  power: PsychicPower;
  editable: boolean;
  onRemove: (id: string) => void;
}

/** Shared stat row — used in both the card and the InfoModal header. */
function PowerStats({ power }: { power: PsychicPower }) {
  const hasAny =
    power.discipline || power.threshold || power.focusTime || power.range || power.sustained;

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
      {power.source && (
        <span
          className={`rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(power.source)}`}
        >
          {power.source}
        </span>
      )}
      {power.discipline && <span className="text-indigo-400">{power.discipline}</span>}
      {power.threshold && (
        <span>
          <span className="text-slate-500">PT </span>
          <span className="text-slate-200 font-mono">{power.threshold}</span>
        </span>
      )}
      {power.focusTime && <span className="text-slate-100">{power.focusTime}</span>}
      {power.range && (
        <span>
          <span className="text-slate-500">Range: </span>
          <span className="text-slate-200">{power.range}</span>
        </span>
      )}
      {power.sustained && (
        <span>
          <span className="text-slate-500">Sustained: </span>
          <span className="text-slate-200">{power.sustained}</span>
        </span>
      )}
    </div>
  );
}

export function PowerCard({ power, editable, onRemove }: PowerCardProps) {
  const modalContent = (
    <>
      <div className="pb-2 mb-2 border-b border-slate-700">
        <PowerStats power={power} />
      </div>
      {power.description ? (
        <p className="text-sm text-slate-100 leading-relaxed">{power.description}</p>
      ) : (
        <p className="text-sm text-slate-500 italic">No description recorded.</p>
      )}
    </>
  );

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-500 bg-slate-900/60 px-3 py-2 text-sm">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-slate-100">
            {power.name || <span className="italic text-slate-500">Unnamed power</span>}
          </p>
          <InfoModal title={power.name || "Psychic Power"} content={modalContent} />
        </div>
        <PowerStats power={power} />
      </div>

      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {editable && (
          <button
            onClick={() => onRemove(power.id)}
            aria-label={`Remove ${power.name || "power"}`}
            className="text-slate-500 hover:text-red-400 transition text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
