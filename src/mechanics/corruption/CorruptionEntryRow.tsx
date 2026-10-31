import { useState } from "react";
import type { CorruptionMalignancyEntry, CorruptionMutationEntry } from "../../types/Character";
import { EntryActionButton } from "../../ui/buttons/EntryActionButton";
import { Chip } from "../../ui/chips/Chip";
import { RollChip } from "../../ui/chips/RollChip";
import { OwnedEntryRow } from "../../ui/OwnedEntryRow";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { getRollDisplayEntries } from "./characteristicModifiers";
import { MalignancyInfoContent, MutationInfoContent } from "./CorruptionReferenceModals";
import { getCorruptionMalignancyRef } from "./corruptionReference";
import { getMutationRef } from "./mutationsReference";
import { RollEditor } from "./RollEditor";

interface CorruptionEntryRowProps {
  kind: "Mutation" | "Malignancy";
  entry: CorruptionMutationEntry | CorruptionMalignancyEntry;
  editable: boolean;
  onRemove: () => unknown;
  onUpdateRolls: (rolledModifiers: Record<string, number>) => void;
}

/** One Mutation or Malignancy on the Corruption tab. */
export function CorruptionEntryRow({
  kind,
  entry,
  editable,
  onRemove,
  onUpdateRolls,
}: CorruptionEntryRowProps) {
  const [isEditingRolls, setIsEditingRolls] = useState(false);
  const ref =
    kind === "Mutation"
      ? getMutationRef(entry.referenceId)
      : getCorruptionMalignancyRef(entry.referenceId);
  const display = {
    roll: ref?.roll ?? entry.roll,
    name: ref?.name ?? entry.name,
    effect: ref?.effect ?? entry.effect,
  };
  const rollEntries = getRollDisplayEntries(ref?.modifiers, entry.rolledModifiers);

  return (
    <>
      <OwnedEntryRow
        name={display.name}
        editable={editable}
        information={
          kind === "Mutation" ? (
            <MutationInfoContent mutation={display} notes={entry.notes} />
          ) : (
            <MalignancyInfoContent malignancy={display} notes={entry.notes} />
          )
        }
        chips={
          <>
            {display.roll && <RollChip>{display.roll}</RollChip>}
            {entry.source && (
              <Chip colour={sourceChipColour(entry.source)} className="font-code">
                {entry.source}
              </Chip>
            )}
            {rollEntries.map((rollEntry) => (
              <Chip
                key={rollEntry.characteristic}
                colour={rollEntry.value === undefined ? "rose" : "sky"}
              >
                {rollEntry.label}: {rollEntry.value ?? "not recorded"}
              </Chip>
            ))}
          </>
        }
        actions={
          editable && rollEntries.length > 0 ? (
            <EntryActionButton onClick={() => setIsEditingRolls(true)}>
              Edit Rolls
            </EntryActionButton>
          ) : undefined
        }
        removal={{ kind, onRemove }}
      />
      {isEditingRolls && (
        <RollEditor
          title={display.name}
          modifiers={ref?.modifiers ?? []}
          initialRolledModifiers={entry.rolledModifiers}
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
