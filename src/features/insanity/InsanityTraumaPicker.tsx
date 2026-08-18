import { useRef, useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { InsanityTraumaEntry } from "../../types/Character";
import type { CustomItemOrigin } from "../../constants/customItems";
import { CustomFormSection } from "../../ui/CustomFormSection";
import { CustomFormShell } from "../../ui/CustomFormShell";
import { OriginSelector } from "../../ui/OriginSelector";
import { PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { ArrowLeft } from "../../ui/PickerArrows";
import { OptionPickerScreen } from "../../ui/OptionPickerScreen";
import { RequiredFormLabel } from "../../ui/RequiredFormLabel";
import { RollChip } from "../../ui/RollChip";
import {
  editableInputClass,
  editableTextareaClass,
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextLabel,
} from "../../ui/editableStyles";
import { MENTAL_TRAUMAS, type MentalTraumaEntry } from "./insanityReference";
import { createLocalId } from "../../utils/createLocalId";

export function InsanityTraumaPicker({
  existingReferenceIds,
  editable,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  editable: boolean;
  onAdd: (entry: InsanityTraumaEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [customOrigin, setCustomOrigin] = useState<"" | CustomItemOrigin>("");
  const [selected, setSelected] = useState<MentalTraumaEntry | null>(null);
  const listScrollPositionRef = useRef(0);
  const customFormScrollPositionRef = useRef(0);

  const filtered = MENTAL_TRAUMAS.filter((ref) => {
    const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
    return !existingReferenceIds.has(ref.roll) && searchable.includes(query.trim().toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom = Boolean(customName.trim()) && Boolean(customOrigin) && Boolean(customDetails.trim());

  function addReferenceTrauma(ref: MentalTraumaEntry, name: string) {
    onAdd({
      id: createLocalId("trauma"),
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
      <OptionPickerScreen
        title={selected.name}
        options={selected.options!.map((option) => ({
          value: option.name,
          label: option.label,
        }))}
        onSelect={(name) => {
          addReferenceTrauma(selected, name);
          setSelected(null);
        }}
        onClose={() => setSelected(null)}
      />
    );
  }

  if (customMode) {
    return (
      <CustomFormShell
        title="Custom Trauma"
        scrollPositionRef={customFormScrollPositionRef}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        onClose={() => setCustomMode(false)}
        canSubmit={canAddCustom}
        submitLabel="Add Trauma"
        onSubmit={() => {
          if (!canAddCustom || !customOrigin) return;
          onAdd({
            id: createLocalId("trauma"),
            name: customName.trim(),
            effect: customDetails.trim(),
            source: customOrigin,
            custom: true,
          });
          setCustomName("");
          setCustomDetails("");
          setCustomOrigin("");
          setCustomMode(false);
        }}
      >
        <CustomFormSection title="Identity">
          <div>
            <RequiredFormLabel htmlFor="custom-trauma-name">Name</RequiredFormLabel>
            <input
              id="custom-trauma-name"
              type="text"
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the trauma..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>

        <CustomFormSection title="Origin">
          <OriginSelector name="custom-trauma-origin" value={customOrigin} onChange={setCustomOrigin} />
        </CustomFormSection>

        <CustomFormSection title="Rules">
          <div>
            <RequiredFormLabel htmlFor="custom-trauma-rules">Rules Text</RequiredFormLabel>
            <textarea
              id="custom-trauma-rules"
              required
              value={customDetails}
              onChange={(event) => setCustomDetails(event.target.value)}
              placeholder="What this trauma does..."
              rows={4}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>
      </CustomFormShell>
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Trauma" : "View Temporary Trauma"}
      placeholder="Search mental traumas..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0}
      footer={
        editable && (
          <PickerCustomAction
            onClick={() => {
              setCustomMode(true);
              setCustomName("");
              setCustomDetails("");
              setCustomOrigin("");
            }}
          >
            + Add custom trauma
          </PickerCustomAction>
        )
      }
    >
      <div className="space-y-3 p-3 lg:p-4">
      {filtered.map((ref) => (
        <PickerRow
          key={ref.roll}
          card
          className={uiSectionShell}
          interactive={editable}
          onClick={() => handleSelect(ref)}
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
                content={
                  <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
                    {ref.effect}
                  </p>
                }
                as="span"
              />
            </span>
          </div>
        </PickerRow>
      ))}
      </div>
    </PickerModal>
  );
}
