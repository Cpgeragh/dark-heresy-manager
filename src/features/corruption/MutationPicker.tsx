import { useRef, useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
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
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { MAJOR_MUTATIONS, MINOR_MUTATIONS, type MutationRef } from "./mutationsReference";
import { createLocalId } from "../../utils/createLocalId";
import { RollModifierFields } from "./RollModifierFields";
import { areRollModifierValuesValid, getRoll1d10Modifiers } from "./rollModifierValues";

export type MutationTier = "minor" | "major";

export function MutationPicker({
  tier,
  existingReferenceIds,
  onAdd,
  onClose,
}: {
  tier: MutationTier;
  existingReferenceIds: Set<string>;
  onAdd: (entry: CorruptionMutationEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [selected, setSelected] = useState<MutationRef | null>(null);
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const listScrollPositionRef = useRef(0);

  const title = tier === "minor" ? "Minor Mutation" : "Major Mutation";
  const source = tier === "minor" ? MINOR_MUTATIONS : MAJOR_MUTATIONS;

  const filtered = source
    .filter((ref) => {
      if (ref.id === "roll-major") return false;
      const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
      return !existingReferenceIds.has(ref.id) && searchable.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom = Boolean(customName.trim());

  function addReferenceMutation(ref: MutationRef) {
    onAdd({
      id: createLocalId("mutation"),
      referenceId: ref.id,
      roll: ref.roll,
      name: ref.name,
      effect: ref.effect,
    });
  }

  if (customMode) {
    return (
      <PickerModal
        title={`Custom ${title}`}
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
                    id: createLocalId("mutation"),
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
                Add {title}
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
              placeholder="Name the mutation..."
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
                id: createLocalId("mutation"),
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
            Add {title}
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
            idPrefix="mutation-roll"
          />
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={`Add ${title}`}
      placeholder={`Search ${title.toLowerCase()}s...`}
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
          Add custom {title.toLowerCase()}
        </PickerCustomAction>
      }
    >
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          onClick={() => {
            if (getRoll1d10Modifiers(ref.modifiers).length === 0) {
              addReferenceMutation(ref);
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
                content={<MutationInfoContent mutation={ref} />}
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
