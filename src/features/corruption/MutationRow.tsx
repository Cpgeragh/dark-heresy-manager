import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { uiActionButtonCompact } from "../../ui/buttonStyles";
import { colourAmberFaint, colourRose, colourSky } from "../../ui/colourTokens";
import { uiInfoModalWrapper, uiItemName, uiSection, uiTextLabel } from "../../ui/editableStyles";
import { getRollDisplayEntries } from "./characteristicModifiers";
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { getMutationRef } from "./mutationsReference";
import { RollEditor } from "./RollEditor";

export function mutationDisplayName(mutation: CorruptionMutationEntry): string {
  return getMutationRef(mutation.referenceId)?.name ?? mutation.name ?? "";
}

export function MutationRow({
  mutation,
  editable,
  onRemove,
  onUpdateRolls,
}: {
  mutation: CorruptionMutationEntry;
  editable: boolean;
  onRemove: () => void;
  onUpdateRolls: (rolledModifiers: Record<string, number>) => void;
}) {
  const [isEditingRolls, setIsEditingRolls] = useState(false);
  const ref = getMutationRef(mutation.referenceId);
  const display = {
    roll: ref?.roll ?? mutation.roll,
    name: ref?.name ?? mutation.name,
    effect: ref?.effect ?? mutation.effect,
  };
  const rollEntries = getRollDisplayEntries(ref?.modifiers, mutation.rolledModifiers);

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
          {rollEntries.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {rollEntries.map((entry) => (
                <Chip key={entry.characteristic} size="sm" className={entry.value === undefined ? colourRose : colourSky}>
                  {entry.label}: {entry.value ?? "not recorded"}
                </Chip>
              ))}
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
          <div className="flex shrink-0 gap-1.5">
            {rollEntries.length > 0 && (
              <button type="button" onClick={() => setIsEditingRolls(true)} className={uiActionButtonCompact}>
                Edit Rolls
              </button>
            )}
            <button type="button" onClick={onRemove} className={uiActionButtonCompact}>
              Remove
            </button>
          </div>
        )}
      </div>
      {isEditingRolls && (
        <RollEditor
          title={display.name}
          modifiers={ref?.modifiers ?? []}
          initialRolledModifiers={mutation.rolledModifiers}
          onSave={(rolledModifiers) => {
            onUpdateRolls(rolledModifiers);
            setIsEditingRolls(false);
          }}
          onCancel={() => setIsEditingRolls(false)}
        />
      )}
    </div>
  );
}
