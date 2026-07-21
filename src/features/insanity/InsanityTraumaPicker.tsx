import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { InsanityTraumaEntry } from "../../types/Character";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { uiPickerBackButton } from "../../ui/buttonStyles";
import { colourAmberFaint } from "../../ui/colourTokens";
import { editableInputClass, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextLabel } from "../../ui/editableStyles";
import { MENTAL_TRAUMAS, type MentalTraumaEntry } from "./insanityReference";

function createTraumaId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `trauma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function InsanityTraumaPicker({
  existingReferenceIds,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  onAdd: (entry: InsanityTraumaEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [selected, setSelected] = useState<MentalTraumaEntry | null>(null);

  const filtered = MENTAL_TRAUMAS.filter((ref) => {
    const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
    return !existingReferenceIds.has(ref.roll) && searchable.includes(query.trim().toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom = Boolean(customName.trim());

  function addReferenceTrauma(ref: MentalTraumaEntry, name: string) {
    onAdd({
      id: createTraumaId(),
      referenceId: ref.roll,
      roll: ref.roll,
      name,
      effect: ref.effect,
    });
  }

  function handleSelect(ref: MentalTraumaEntry) {
    if (ref.options) {
      setSelected(ref);
      return;
    }
    addReferenceTrauma(ref, ref.name);
  }

  if (selected) {
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
      >
        <div className="space-y-3 p-4 lg:p-5">
          <p className={`${uiFormLabel} text-center`}>Choose which effect applies</p>
          <div className="space-y-2">
            {selected.options!.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => addReferenceTrauma(selected, option.name)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-red-500 hover:bg-slate-700 lg:text-base"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </PickerModal>
    );
  }

  if (customMode) {
    return (
      <PickerModal
        title="Custom Trauma"
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
              <Button
                size="sm"
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
                className="flex-1"
              >
                Add Trauma
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
        </PickerBody>
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
        <PickerCustomAction
          onClick={() => {
            setCustomMode(true);
            setCustomName("");
            setCustomDetails("");
          }}
        >
          + Add custom trauma
        </PickerCustomAction>
      }
    >
      {filtered.map((ref) => (
        <PickerRow
          key={ref.roll}
          onClick={() => handleSelect(ref)}
        >
          <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip size="sm" className={colourAmberFaint}>{ref.roll}</Chip>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={uiTextLabel}>Rules</span>
            <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
              <InfoModal
                title={ref.name}
                content={<p className="text-sm leading-relaxed text-slate-300 lg:text-base">{ref.effect}</p>}
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
