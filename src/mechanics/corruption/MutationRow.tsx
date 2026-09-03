import { useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Button } from "../../ui/buttons/Button";
import { Chip } from "../../ui/chips/Chip";
import { PickerBody, PickerModal } from "../../ui/pickers/PickerModal";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { RollChip } from "../../ui/chips/RollChip";
import { colourRose, colourSky } from "../../ui/styles/colourTokens";
import { uiInfoModalWrapper, uiItemName, uiSection, uiTextBody, uiTextLabel } from "../../ui/styles/editableStyles";
import { sourceColour } from "../../ui/styles/sourceStyles";
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
  const [deleteArmed, setDeleteArmed] = useState(false);
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
          {(display.roll || mutation.source) && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {display.roll && <RollChip>{display.roll}</RollChip>}
              {mutation.source && (
                <Chip size="sm" className={`bg-slate-800/40 font-code ${sourceColour(mutation.source)}`}>
                  {mutation.source}
                </Chip>
              )}
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
                content={<MutationInfoContent mutation={display} notes={mutation.notes} />}
              />
            </span>
          </div>
        </div>
        {editable && (
          <div className="flex shrink-0 gap-1.5">
            {rollEntries.length > 0 && (
              <Button size="xs" onClick={() => setIsEditingRolls(true)}>
                Edit Rolls
              </Button>
            )}
            <RemoveButton onClick={() => setDeleteArmed(true)} label="Remove" />
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
      {deleteArmed && (
        <PickerModal
          title="Delete Mutation"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={onRemove}>Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteArmed(false)}>Cancel</Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Delete {display.name} from this character?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
