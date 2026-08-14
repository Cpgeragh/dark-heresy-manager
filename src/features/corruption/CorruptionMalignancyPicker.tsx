import { useRef, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMalignancyEntry } from "../../types/Character";
import { Button } from "../../ui/Button";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { RollChip } from "../../ui/RollChip";
import { uiPickerBackButton } from "../../ui/buttonStyles";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiTextLabel,
} from "../../ui/editableStyles";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import { CORRUPTION_MALIGNANCIES, type CorruptionMalignancyRef } from "./corruptionReference";
import { createLocalId } from "../../utils/createLocalId";
import { RollModifierFields } from "./RollModifierFields";
import { areRollModifierValuesValid, getRoll1d10Modifiers } from "./rollModifierValues";

export function CorruptionMalignancyPicker({
  existingReferenceIds,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  onAdd: (entry: CorruptionMalignancyEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [selected, setSelected] = useState<CorruptionMalignancyRef | null>(null);
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const listScrollPositionRef = useRef(0);

  const filtered = CORRUPTION_MALIGNANCIES.filter((ref) => {
    const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
    return !existingReferenceIds.has(ref.id) && searchable.includes(query.trim().toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom = Boolean(customName.trim());

  function addReferenceMalignancy(ref: CorruptionMalignancyRef) {
    onAdd({
      id: createLocalId("malignancy"),
      referenceId: ref.id,
      roll: ref.roll,
      name: ref.name,
      effect: ref.effect,
    });
  }

  if (customMode) {
    return (
      <PickerModal
        title="Custom Malignancy"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setCustomMode(false)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <div className="space-y-2">
            {!canAddCustom && (
              <p className="text-xs lg:text-sm text-slate-300">
                <span className="text-red-500">*</span> Required
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                className={uiPickerBackButton}
              >
                Back
              </button>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  if (!canAddCustom) return;
                  onAdd({
                    id: createLocalId("malignancy"),
                    name: customName.trim(),
                    effect: customDetails.trim() || undefined,
                    custom: true,
                  });
                  setCustomName("");
                  setCustomDetails("");
                  setCustomMode(false);
                }}
                disabled={!canAddCustom}
                className="flex-1"
              >
                Add Malignancy
              </Button>
            </div>
          </div>
        }
      >
        <PickerBody>
          <div>
            <label className={uiFormLabel}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the malignancy..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>

          <FormField
            label="Details"
            value={customDetails}
            onChange={setCustomDetails}
            editable
            type="textarea"
            rows={3}
            placeholder="Optional details..."
          />
        </PickerBody>
      </PickerModal>
    );
  }

  if (selected) {
    const rollModifiers = getRoll1d10Modifiers(selected.modifiers);
    const canAdd = areRollModifierValuesValid(rollModifiers, rolls);

    return (
      <PickerModal
        title={selected.name}
        query=""
        onQueryChange={() => undefined}
        onClose={() => setSelected(null)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        hideSearch
        isEmpty={false}
        footer={
          <Button
            className="w-full"
            disabled={!canAdd}
            onClick={() => {
              onAdd({
                id: createLocalId("malignancy"),
                referenceId: selected.id,
                roll: selected.roll,
                name: selected.name,
                effect: selected.effect,
                rolledModifiers: Object.fromEntries(
                  rollModifiers.map((modifier) => [
                    modifier.characteristic,
                    Number(rolls[modifier.characteristic]),
                  ])
                ),
              });
              setSelected(null);
            }}
          >
            Add Malignancy
          </Button>
        }
      >
        <PickerBody>
          <RollModifierFields
            modifiers={rollModifiers}
            rolls={rolls}
            onRollChange={(characteristic, value) =>
              setRolls((previous) => ({ ...previous, [characteristic]: value }))
            }
            idPrefix="malignancy-roll"
          />
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title="Add Malignancy"
      placeholder="Search malignancies..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0}
      footer={
        <PickerCustomAction
          onClick={() => {
            setCustomMode(true);
            setCustomName("");
            setCustomDetails("");
          }}
        >
          + Add custom malignancy
        </PickerCustomAction>
      }
    >
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          onClick={() => {
            if (getRoll1d10Modifiers(ref.modifiers).length === 0) {
              addReferenceMalignancy(ref);
            } else {
              setRolls({});
              setSelected(ref);
            }
          }}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <RollChip>{ref.roll}</RollChip>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                content={<MalignancyInfoContent malignancy={ref} />}
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
