// src/mechanics/corruption/MalignancyRow.tsx

import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMalignancyEntry } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { CharacterEntryRow } from "../../ui/CharacterEntryRow";
import { RemoveEntryButton } from "../../ui/RemoveEntryButton";
import { RollChip } from "../../ui/chips/RollChip";
import { uiChipRow } from "../../ui/styles/editableStyles";
import { sourceChipColour } from "../../ui/styles/sourceStyles";
import { getRollDisplayEntries } from "./characteristicModifiers";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import { getCorruptionMalignancyRef } from "./corruptionReference";
import { RollEditor } from "./RollEditor";

export function MalignancyRow({
  malignancy,
  editable,
  onRemove,
  onUpdateRolls,
}: {
  malignancy: CorruptionMalignancyEntry;
  editable: boolean;
  onRemove: () => void;
  onUpdateRolls: (rolledModifiers: Record<string, number>) => void;
}) {
  const [isEditingRolls, setIsEditingRolls] = useState(false);
  const ref = getCorruptionMalignancyRef(malignancy.referenceId);
  const display = {
    roll: ref?.roll ?? malignancy.roll,
    name: ref?.name ?? malignancy.name,
    effect: ref?.effect ?? malignancy.effect,
  };
  const rollEntries = getRollDisplayEntries(ref?.modifiers, malignancy.rolledModifiers);

  return (
    <>
      <CharacterEntryRow
        name={display.name}
        info={
          <InfoModal
            title={display.name}
            content={<MalignancyInfoContent malignancy={display} notes={malignancy.notes} />}
          />
        }
        metadata={
          <>
            {(display.roll || malignancy.source) && (
              <div className={uiChipRow}>
                {display.roll && <RollChip>{display.roll}</RollChip>}
                {malignancy.source && (
                  <Chip colour={sourceChipColour(malignancy.source)} className="font-code">
                    {malignancy.source}
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
          editable ? (
            <>
              {rollEntries.length > 0 && (
                <Button size="xs" onClick={() => setIsEditingRolls(true)}>
                  Edit Rolls
                </Button>
              )}
              <RemoveEntryButton kind="Malignancy" name={display.name} onRemove={onRemove} />
            </>
          ) : undefined
        }
      />
      {isEditingRolls && (
        <RollEditor
          title={display.name}
          modifiers={ref?.modifiers ?? []}
          initialRolledModifiers={malignancy.rolledModifiers}
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
