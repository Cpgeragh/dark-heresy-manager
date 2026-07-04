import { useState } from "react";
import { FormField } from "../../components/FormField";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import { Chip } from "../../ui/Chip";
import { PickerModal } from "../../ui/PickerModal";
import { uiActionButton, uiPickerBackButton } from "../../ui/buttonStyles";
import { colourAmberFaint } from "../../ui/colourTokens";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiTextLabel,
} from "../../ui/editableStyles";
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { MAJOR_MUTATIONS, MINOR_MUTATIONS, type MutationRef } from "./mutationsReference";

export type MutationTier = "minor" | "major";

function createMutationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

  const title = tier === "minor" ? "Minor Mutation" : "Major Mutation";
  const source = tier === "minor" ? MINOR_MUTATIONS : MAJOR_MUTATIONS;

  const filtered = source
    .filter((ref) => {
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
        <div className="space-y-4 p-4 lg:p-5">
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
        </div>
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
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            setCustomName("");
            setCustomDetails("");
          }}
          className="w-full py-1 text-center text-sm text-red-500 hover:text-red-400 lg:py-1.5 lg:text-base"
        >
          + Add custom {title.toLowerCase()}
        </button>
      }
    >
      {filtered.map((ref) =>
        // "roll-major" is a table redirect (roll again on Major Mutations), not a real mutation to hold.
        ref.id === "roll-major" ? (
          <div key={ref.id} className="w-full px-4 py-3 text-left lg:px-5 lg:py-4">
            <span className={uiItemName}>{ref.name}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip size="sm" className={colourAmberFaint}>{ref.roll}</Chip>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal title={ref.name} content={<MutationInfoContent mutation={ref} hideName />} />
              </span>
            </div>
          </div>
        ) : (
          <button
            key={ref.id}
            type="button"
            onClick={() => addReferenceMutation(ref)}
            className="group w-full px-4 py-3 text-left transition hover:bg-slate-800 lg:px-5 lg:py-4"
          >
            <span className={`${uiItemName} group-hover:text-white`}>{ref.name}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip size="sm" className={colourAmberFaint}>{ref.roll}</Chip>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              <span onClick={(event) => event.stopPropagation()} className={uiInfoModalWrapper}>
                <InfoModal title={ref.name} content={<MutationInfoContent mutation={ref} hideName />} />
              </span>
            </div>
          </button>
        )
      )}
    </PickerModal>
  );
}
