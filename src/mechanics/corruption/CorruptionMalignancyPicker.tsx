import { useRef, useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMalignancyEntry } from "../../types/Character";
import type { CustomItemOrigin } from "../../constants/customItems";
import { Button } from "../../ui/buttons/Button";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../ui/forms/OriginSelector";
import {
  PickerBody,
  PickerCustomAction,
  PickerModal,
  PickerRow,
} from "../../ui/pickers/PickerModal";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import { RollChip } from "../../ui/chips/RollChip";
import {
  editableInputClass,
  editableTextareaClass,
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextLabel,
} from "../../ui/styles/editableStyles";
import { MalignancyInfoContent } from "./CorruptionReferenceModals";
import { CORRUPTION_MALIGNANCIES, type CorruptionMalignancyRef } from "./corruptionReference";
import { createLocalId } from "../../utils/createLocalId";
import { RollModifierFields } from "./RollModifierFields";
import { areRollModifierValuesValid, getRoll1d10Modifiers } from "./rollModifierValues";

export function CorruptionMalignancyPicker({
  existingReferenceIds,
  editable,
  onAdd,
  onClose,
}: {
  existingReferenceIds: Set<string>;
  editable: boolean;
  onAdd: (entry: CorruptionMalignancyEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [customOrigin, setCustomOrigin] = useState<"" | CustomItemOrigin>("");
  const [selected, setSelected] = useState<CorruptionMalignancyRef | null>(null);
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const listScrollPositionRef = useRef(0);
  const customFormScrollPositionRef = useRef(0);

  const filtered = CORRUPTION_MALIGNANCIES.filter((ref) => {
    const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
    return !existingReferenceIds.has(ref.id) && searchable.includes(query.trim().toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom =
    Boolean(customName.trim()) && Boolean(customDetails.trim()) && Boolean(customOrigin);

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
      <CustomFormShell
        title="Custom Malignancy"
        scrollPositionRef={customFormScrollPositionRef}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        onClose={() => setCustomMode(false)}
        canSubmit={canAddCustom}
        submitLabel="Add Malignancy"
        onSubmit={() => {
          if (!canAddCustom || !customOrigin) return;
          onAdd({
            id: createLocalId("malignancy"),
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
            <RequiredFormLabel htmlFor="custom-malignancy-name">Name</RequiredFormLabel>
            <input
              id="custom-malignancy-name"
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the malignancy..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>

        <CustomFormSection title="Origin">
          <OriginSelector
            name="custom-malignancy-origin"
            value={customOrigin}
            onChange={setCustomOrigin}
          />
        </CustomFormSection>

        <CustomFormSection title="Rules">
          <div>
            <RequiredFormLabel htmlFor="custom-malignancy-rules">Rules Text</RequiredFormLabel>
            <textarea
              id="custom-malignancy-rules"
              required
              value={customDetails}
              onChange={(event) => setCustomDetails(event.target.value)}
              placeholder="What this malignancy does..."
              rows={4}
              className={editableTextareaClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>
      </CustomFormShell>
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
      title={editable ? "Add Malignancy" : "View Malignancies"}
      placeholder="Search malignancies..."
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
            + Add custom malignancy
          </PickerCustomAction>
        )
      }
    >
      <div className="space-y-3 p-3 lg:p-4">
        {filtered.map((ref) => (
          <PickerRow
            key={ref.id}
            card
            className={uiSectionShell}
            interactive={editable}
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
      </div>
    </PickerModal>
  );
}
