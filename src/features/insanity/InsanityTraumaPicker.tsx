import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { InsanityTraumaEntry } from "../../types/Character";
import { PickerModal } from "../../ui/PickerModal";
import { uiActionButton, uiPickerBackButton } from "../../ui/buttonStyles";
import { editableInputClass, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextLabel } from "../../ui/editableStyles";
import { MENTAL_TRAUMAS, type MentalTraumaEntry } from "./insanityReference";

function createTraumaId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `trauma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function InsanityTraumaPicker({
  onAdd,
  onClose,
}: {
  onAdd: (entry: InsanityTraumaEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");

  const filtered = MENTAL_TRAUMAS.filter((ref) => {
    const searchable = `${ref.roll} ${ref.effect}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });
  const canAddCustom = Boolean(customName.trim());

  function addReferenceTrauma(ref: MentalTraumaEntry) {
    onAdd({
      id: createTraumaId(),
      referenceId: ref.roll,
      roll: ref.roll,
      effect: ref.effect,
    });
  }

  if (customMode) {
    return (
      <PickerModal
        title="Custom Trauma"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setCustomMode(false)}
        closeLabel="←"
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
                    id: createTraumaId(),
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
                Add Trauma
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
              placeholder="Name the trauma..."
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
      title="Add Trauma"
      placeholder="Search mental traumas..."
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
          + Add custom trauma
        </button>
      }
    >
      {filtered.map((ref) => (
        <button
          key={ref.roll}
          type="button"
          onClick={() => addReferenceTrauma(ref)}
          className="group w-full px-4 py-3 text-left transition hover:bg-slate-800 lg:px-5 lg:py-4"
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.roll}</span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={`Trauma ${ref.roll}`}
                content={<p className="text-sm leading-relaxed text-slate-300 lg:text-base">{ref.effect}</p>}
              />
            </span>
          </div>
        </button>
      ))}
    </PickerModal>
  );
}
