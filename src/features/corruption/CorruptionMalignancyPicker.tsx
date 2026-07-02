import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMalignancyEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { PickerModal } from "../../ui/PickerModal";
import { uiActionButton, uiPickerBackButton } from "../../ui/buttonStyles";
import {
  colourAmberFaint,
} from "../../ui/colourTokens";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiTextMuted,
} from "../../ui/editableStyles";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import { CORRUPTION_MALIGNANCIES, type CorruptionMalignancyRef } from "./corruptionReference";

function createMalignancyId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `malignancy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CorruptionMalignancyPicker({
  onAdd,
  onClose,
}: {
  onAdd: (entry: CorruptionMalignancyEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");

  const filtered = CORRUPTION_MALIGNANCIES.filter((ref) => {
    const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });
  const canAddCustom = Boolean(customName.trim());

  function addReferenceMalignancy(ref: CorruptionMalignancyRef) {
    onAdd({
      id: createMalignancyId(),
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
        closeLabel="<"
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
                    id: createMalignancyId(),
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
                Add Malignancy
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-4 lg:p-5">
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
        </div>
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
      isEmpty={filtered.length === 0}
      footer={
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            setCustomName("");
            setCustomDetails("");
          }}
          className="w-full py-1 text-center text-sm text-red-500 hover:text-red-400 lg:py-1.5 lg:text-base"
        >
          + Add custom malignancy
        </button>
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.id}
          type="button"
          onClick={() => addReferenceMalignancy(ref)}
          className="group w-full px-4 py-3 text-left transition hover:bg-slate-800 lg:px-5 lg:py-4"
        >
          <div className="flex items-center gap-1.5">
            <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                content={<MalignancyInfoContent malignancy={ref} hideName />}
              />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={colourAmberFaint}>{ref.roll}</Chip>
          </div>
          <p className={`mt-1 line-clamp-2 text-xs lg:text-sm ${uiTextMuted}`}>{ref.effect}</p>
        </button>
      ))}
    </PickerModal>
  );
}
