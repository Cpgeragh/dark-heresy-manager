// src/pages/characterSheet/components/PowerCard.tsx

import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/Chip";
import { sourceColour } from "../../../ui/sourceStyles";
import type { PsychicPower } from "../../../types/Character";
import { disciplineColours } from "../psychicStyles";
import { uiTextBody, uiTextPlaceholder, uiTextSubtle, uiInfoModalWrapper } from "../../../ui/editableStyles";
import { uiActionButtonCompact } from "../../../ui/buttonStyles";

interface PowerCardProps {
  power: PsychicPower;
  editable: boolean;
  onRemove: (id: string) => void;
  onEdit?: (power: PsychicPower) => void;
}

/** Shared stat row — used in both the card and the InfoModal header. */
function PowerStats({ power }: { power: PsychicPower }) {
  const hasAny =
    power.discipline || power.threshold || power.focusTime || power.range || power.sustained;

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 lg:gap-x-4 gap-y-0.5 text-xs lg:text-sm">
      {power.source && (
        <Chip className={`bg-slate-800/40 font-code ${sourceColour(power.source)}`}>
          {power.source}
        </Chip>
      )}
      {power.discipline && (
        <Chip className={disciplineColours[power.discipline] ?? disciplineColours.default}>
          {power.discipline}
        </Chip>
      )}
      {power.threshold && (
        <span>
          <span className={uiTextSubtle}>PT </span>
          <span className="text-slate-200 font-code">{power.threshold}</span>
        </span>
      )}
      {power.focusTime && <span className="text-slate-100">{power.focusTime}</span>}
      {power.range && (
        <span>
          <span className={uiTextSubtle}>Range: </span>
          <span className="text-slate-200">{power.range}</span>
        </span>
      )}
      {power.sustained && (
        <span>
          <span className={uiTextSubtle}>Sustained: </span>
          <span className="text-slate-200">{power.sustained}</span>
        </span>
      )}
    </div>
  );
}

export function PowerCard({ power, editable, onRemove, onEdit }: PowerCardProps) {
  const isCustomPower = power.custom || power.source === "Custom" || power.source === "2nd Ed";
  const modalContent = (
    <>
      {power.description ? (
        <p className={`text-sm ${uiTextBody} leading-relaxed`}>{power.description}</p>
      ) : (
        <p className={`text-sm ${uiTextPlaceholder}`}>No description recorded.</p>
      )}
    </>
  );

  return (
    <div className="flex items-start justify-between gap-2 rounded border border-slate-500 bg-slate-900/60 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-slate-100">
            {power.name || <span className={uiTextPlaceholder}>Unnamed power</span>}
          </p>
          <span className={uiInfoModalWrapper}>
            <InfoModal title={power.name || "Psychic Power"} content={modalContent} hideTitle />
          </span>
        </div>
        <PowerStats power={power} />
      </div>

      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        {editable && isCustomPower && onEdit && (
          <button
            onClick={() => onEdit(power)}
            aria-label={`Edit ${power.name || "power"}`}
            className="text-slate-500 hover:text-amber-300 transition text-xs lg:text-sm"
          >
            Edit
          </button>
        )}
        {editable && (
          <button
            onClick={() => onRemove(power.id)}
            aria-label={`Remove ${power.name || "power"}`}
            className={uiActionButtonCompact}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
