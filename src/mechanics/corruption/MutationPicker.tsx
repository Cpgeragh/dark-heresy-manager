import { useRef, useState } from "react";
import { InfoModal } from "../../components/InfoModal";
import type { CorruptionMutationEntry } from "../../types/Character";
import type { CustomItemOrigin } from "../../constants/customItems";
import { Button } from "../../ui/buttons/Button";
import { CustomFormSection } from "../../ui/forms/CustomFormSection";
import { CustomFormShell } from "../../ui/forms/CustomFormShell";
import { OriginSelector } from "../../ui/forms/OriginSelector";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
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
import { MutationInfoContent } from "./CorruptionReferenceModals";
import { MAJOR_MUTATIONS, MINOR_MUTATIONS, type MutationRef } from "./mutationsReference";
import { createLocalId } from "../../utils/createLocalId";
import { RollModifierFields } from "./RollModifierFields";
import { areRollModifierValuesValid, getRoll1d10Modifiers } from "./rollModifierValues";

export type MutationTier = "minor" | "major";

export function MutationPicker({
  tier,
  existingReferenceIds,
  editable,
  onAdd,
  onClose,
}: {
  tier: MutationTier;
  existingReferenceIds: Set<string>;
  editable: boolean;
  onAdd: (entry: CorruptionMutationEntry) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetails, setCustomDetails] = useState("");
  const [customOrigin, setCustomOrigin] = useState<"" | CustomItemOrigin>("");
  const [selected, setSelected] = useState<MutationRef | null>(null);
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const listScrollPositionRef = useRef(0);
  const customFormScrollPositionRef = useRef(0);

  const title = tier === "minor" ? "Minor Mutation" : "Major Mutation";
  const source = tier === "minor" ? MINOR_MUTATIONS : MAJOR_MUTATIONS;

  const filtered = source
    .filter((ref) => {
      if (ref.id === "roll-major") return false;
      const searchable = `${ref.roll} ${ref.name} ${ref.effect}`.toLowerCase();
      return !existingReferenceIds.has(ref.id) && searchable.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const canAddCustom = Boolean(customName.trim()) && Boolean(customDetails.trim()) && Boolean(customOrigin);

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
      <CustomFormShell
        title={`Custom ${title}`}
        scrollPositionRef={customFormScrollPositionRef}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        onClose={() => setCustomMode(false)}
        canSubmit={canAddCustom}
        submitLabel={`Add ${title}`}
        onSubmit={() => {
          if (!canAddCustom || !customOrigin) return;
          onAdd({
            id: createLocalId("mutation"),
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
            <RequiredFormLabel htmlFor="custom-mutation-name">Name</RequiredFormLabel>
            <input
              id="custom-mutation-name"
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Name the mutation..."
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        </CustomFormSection>

        <CustomFormSection title="Origin">
          <OriginSelector name="custom-mutation-origin" value={customOrigin} onChange={setCustomOrigin} />
        </CustomFormSection>

        <CustomFormSection title="Rules">
          <div>
            <RequiredFormLabel htmlFor="custom-mutation-rules">Rules Text</RequiredFormLabel>
            <textarea
              id="custom-mutation-rules"
              required
              value={customDetails}
              onChange={(event) => setCustomDetails(event.target.value)}
              placeholder="What this mutation does..."
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
      title={editable ? `Add ${title}` : `View ${title}s`}
      placeholder={`Search ${title.toLowerCase()}s...`}
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
            Add custom {title.toLowerCase()}
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
      </div>
    </PickerModal>
  );
}
