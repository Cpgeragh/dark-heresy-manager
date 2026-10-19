import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { CharacterEntryRow } from "../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../ui/RemoveEntryButton";
import { RollChip } from "../../ui/chips/RollChip";
import { uiChipRow } from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { getRollDisplayEntries } from "./characteristicModifiers";
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { getMutationRef } from "./mutationsReference";
import { RollEditor } from "./RollEditor";

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
    <>
      <CharacterEntryRow
        name={display.name}
        info={
          <InfoModal
            title={display.name}
            content={<MutationInfoContent mutation={display} notes={mutation.notes} />}
          />
        }
        metadata={
          <>
            {(display.roll || mutation.source) && (
              <div className={uiChipRow}>
                {display.roll && <RollChip>{display.roll}</RollChip>}
                {mutation.source && (
                  <Chip colour={sourceChipColour(mutation.source)} className="font-code">
                    {mutation.source}
                  </Chip>
                )}
              </div>
            )}
            {rollEntries.length > 0 && (
              <div className={uiChipRow}>
                {rollEntries.map((entry) => (
                  <Chip
                    key={entry.characteristic}
                    colour={entry.value === undefined ? "rose" : "sky"}
                  >
                    {entry.label}: {entry.value ?? "not recorded"}
                  </Chip>
                ))}
              </div>
            )}
          </>
        }
        actions={
          editable && rollEntries.length > 0 ? (
            <Button size="xs" onClick={() => setIsEditingRolls(true)}>
              Edit Rolls
            </Button>
          ) : undefined
        }
        removeAction={
          editable ? (
            <RemoveEntryButton kind="Mutation" name={display.name} onRemove={onRemove} />
          ) : undefined
        }
      />
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
    </>
  );
}
