import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { colourAmberFaint } from "../../ui/colourTokens";
import { uiInfoModalWrapper, uiItemName, uiSection, uiTextLabel } from "../../ui/editableStyles";
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { getMutationRef } from "./mutationsReference";

export function mutationDisplayName(mutation: CorruptionMutationEntry): string {
  return getMutationRef(mutation.referenceId)?.name ?? mutation.name ?? "";
}

export function MutationRow({
  mutation,
  editable,
  onRemove,
}: {
  mutation: CorruptionMutationEntry;
  editable: boolean;
  onRemove: () => void;
}) {
  const ref = getMutationRef(mutation.referenceId);
  const display = {
    roll: ref?.roll ?? mutation.roll,
    name: ref?.name ?? mutation.name,
    effect: ref?.effect ?? mutation.effect,
  };

  return (
    <div className={uiSection}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={uiItemName}>{display.name}</span>
          {display.roll && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip size="sm" className={colourAmberFaint}>{display.roll}</Chip>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={display.name}
                content={<MutationInfoContent mutation={display} notes={mutation.notes} hideName />}
              />
            </span>
          </div>
        </div>
        {editable && (
          <button type="button" onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
