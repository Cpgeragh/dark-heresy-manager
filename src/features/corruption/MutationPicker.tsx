import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { uiActionButton, uiPickerBackButton } from "../../ui/buttonStyles";
import { colourAmberFaint } from "../../ui/colourTokens";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiTextLabel,
} from "../../ui/editableStyles";
import { CHARACTERISTIC_LABELS, type CharacteristicModifier } from "./characteristicModifiers";
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { MAJOR_MUTATIONS, MINOR_MUTATIONS, type MutationRef } from "./mutationsReference";

export type MutationTier = "minor" | "major";

function createMutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function rollModifiersFor(ref: MutationRef): CharacteristicModifier[] {
  return (ref.modifiers ?? []).filter((modifier) => modifier.kind === "roll1d10");
}

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
      id: createMutationId(),
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
              <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCustomMode(false)} className={uiPickerBackButton}>
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canAddCustom) return;
                  onAdd({
                    id: createMutationId(),
                    name: customName.trim(),
                    effect: customDetails.trim() || undefined,
                    custom: true,
                  });
                  setCustomName("");
                  setCustomDetails("");
                  setCustomMode(false);
                }}
                disabled={!canAddCustom}
                className={`${uiActionButton} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Add {title}
              </button>
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
    const rollModifiers = rollModifiersFor(selected);
    const canAdd = rollModifiers.every((modifier) => {
      const parsed = Number(rolls[modifier.characteristic]);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10;
    });

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
                id: createMutationId(),
                referenceId: selected.id,
                roll: selected.roll,
                name: selected.name,
                effect: selected.effect,
                rolledModifiers: Object.fromEntries(
                  rollModifiers.map((modifier) => [modifier.characteristic, Number(rolls[modifier.characteristic])])
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
          {rollModifiers.map((modifier) => (
            <div key={modifier.characteristic}>
              <label className={uiFormLabel}>
                {CHARACTERISTIC_LABELS[modifier.characteristic]} roll (1d10) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={rolls[modifier.characteristic] ?? ""}
                onChange={(event) => setRolls((prev) => ({ ...prev, [modifier.characteristic]: event.target.value }))}
                placeholder="Enter rolled value..."
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          ))}
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
      isEmpty={filtered.length === 0}
      footer={
        <PickerCustomAction
          onClick={() => {
            setCustomMode(true);
            setCustomName("");
            setCustomDetails("");
          }}
        >
          + Add custom {title.toLowerCase()}
        </PickerCustomAction>
      }
    >
      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          onClick={() => {
            if (rollModifiersFor(ref).length === 0) {
              addReferenceMutation(ref);
            } else {
              setRolls({});
              setSelected(ref);
            }
          }}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={colourAmberFaint}>{ref.roll}</Chip>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal title={ref.name} content={<MutationInfoContent mutation={ref} hideName />} as="span" />
            </span>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
