// src/pages/CharacterSheet/CyberneticsTab/ImplantPicker.tsx

import { useRef, useState } from "react";
import type { CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import {
  CYBERNETICS_REFERENCE,
  type CyberneticRef,
} from "../../../data/reference/cyberneticsReference";
import {
  PickerBody,
  PickerCustomAction,
  PickerList,
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { previewVersionId } from "../weapons/weaponSnapshotHelpers";
import { buildCyberneticSnapshot, cyberneticFromReference } from "./cyberneticSnapshotHelpers";
import { ImplantRow } from "./ImplantRow";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { ModalHeader } from "../../../ui/modals/ModalHeader";
import { ModalShell } from "../../../ui/modals/ModalShell";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  uiInlineRow,
  uiTwoColumnGrid,
  uiTextBody,
  uiDescriptionBox,
  uiStackField,
  editableInputClass,
} from "../../../ui/styles/editableStyles";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
import { ARMOUR_LOCATION_LABELS } from "../../../constants/locations";
import {
  availableCraftsmanship,
  concealedWeaponBionicDescription,
  craftsmanshipDescription,
  craftsmanshipValue,
  defaultCraftsmanship,
  hasQualityText,
} from "./cyberneticsHelpers";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { isVariableMeta } from "../../../data/reference/referenceMeta";
import { useAssignedItemPick, type AssignedItemNeeds } from "../../../hooks/useAssignedItemPick";
import { AssignedItemPickScreen } from "../../../ui/pickers/AssignedItemPickScreen";
import { AssignedOnAddNote } from "../../../ui/pickers/AssignedOnAddNote";
import { FormLabel } from "../../../ui/forms/FormLabel";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"cybernetic">[];
  onSelect: (
    ref: CyberneticRef,
    craftsmanship: CyberneticCraftsmanship | undefined,
    bodyLocation?: ArmourLocationKey[],
    gmValue?: string,
    gmRarity?: string,
    gmWeight?: string
  ) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"cybernetic">) => void;
  onCustom?: () => void;
  onClose: () => void;
  suspended?: boolean;
}

function assignedOnAddNote(ref: CyberneticRef) {
  const costVaries = isVariableMeta(ref.value);
  const rarityVaries = isVariableMeta(ref.availability);
  if (costVaries && rarityVaries) {
    return <AssignedOnAddNote>Cost and availability assigned on add</AssignedOnAddNote>;
  }
  if (costVaries) return <AssignedOnAddNote>Cost assigned on add</AssignedOnAddNote>;
  if (rarityVaries) return <AssignedOnAddNote>Availability assigned on add</AssignedOnAddNote>;
  return undefined;
}

function implantCostNeeds(ref: CyberneticRef): AssignedItemNeeds {
  return {
    cost: isVariableMeta(ref.value),
    weight: false,
    rarity: isVariableMeta(ref.availability),
  };
}

export function ImplantPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: Props) {
  recordComponentRender("ImplantPicker");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const costPick = useAssignedItemPick(implantCostNeeds);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");
  const [assignedValue, setAssignedValue] = useState<string | undefined>();
  const [assignedRarity, setAssignedRarity] = useState<string | undefined>();
  const [weightStep, setWeightStep] = useState(false);
  const [weight, setWeight] = useState("");
  const listScrollPositionRef = useRef(0);

  const normalizedQuery = query.toLowerCase();
  const filtered = CYBERNETICS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const pickerEntries = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const resetPicker = () => {
    setSelected(null);
    costPick.cancel();
    setLocation(null);
    setCraftsmanship("Common");
    setAssignedValue(undefined);
    setAssignedRarity(undefined);
    setWeightStep(false);
    setWeight("");
  };
  const asksQuality = (ref: CyberneticRef) => hasQualityText(ref) || Boolean(ref.requiresLocation);
  const finalizeSelection = (ref: CyberneticRef) => {
    setSelected(ref);
    if (!asksQuality(ref)) {
      setWeightStep(true);
      return;
    }
    setCraftsmanship(defaultCraftsmanship(ref));
  };
  const selectImplant = (ref: CyberneticRef) => {
    if (!editable) return;
    const refNeeds = implantCostNeeds(ref);
    if (refNeeds.cost || refNeeds.rarity) {
      costPick.begin(ref);
      return;
    }
    finalizeSelection(ref);
  };
  const confirmCost = () =>
    costPick.confirm((ref) => {
      setAssignedValue(costPick.needs.cost ? formatMoneyInput(costPick.meta.gmCost) : undefined);
      setAssignedRarity(costPick.needs.rarity ? costPick.meta.gmRarity : undefined);
      finalizeSelection(ref);
    });
  if (costPick.pending) {
    return (
      <AssignedItemPickScreen
        pick={costPick}
        title="Assigned Cost"
        explanation="has no listed cost or availability. Enter the values assigned for this implant."
        costPlaceholder="e.g. 5000"
        idPrefix="cybernetic-assigned-meta"
        confirmLabel="Continue"
        onBack={resetPicker}
        onConfirm={confirmCost}
        maxWidth="max-w-md lg:max-w-lg"
      />
    );
  }

  // ── Weight step ──────────────────────────────────────────────────────────
  if (selected && weightStep) {
    return (
      <ModalShell
        ariaLabel={selected.name}
        onClose={resetPicker}
        className="max-w-md lg:max-w-lg overflow-y-auto"
      >
        <ModalHeader title={selected.name} onClose={resetPicker} />

        <PickerBody>
          <div className={uiStackField}>
            <FormLabel htmlFor="implant-weight">Weight (kg)</FormLabel>
            <input
              id="implant-weight"
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
              placeholder="e.g. 2"
              className={editableInputClass(true)}
              autoComplete="off"
            />
          </div>
        </PickerBody>

        <div className={`${uiTwoColumnGrid} px-4 lg:px-5 py-3 lg:py-4`}>
          <Button
            onClick={() => {
              onSelect(
                selected,
                asksQuality(selected) ? craftsmanship : undefined,
                location ?? undefined,
                assignedValue,
                assignedRarity,
                formatWeightInput(weight)
              );
              resetPicker();
            }}
            disabled={!editable}
          >
            Add
          </Button>
          <Button
            variant="neutral"
            onClick={() => (asksQuality(selected) ? setWeightStep(false) : resetPicker())}
          >
            Back
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Location picker (arm/leg implants only) ──────────────────────────────
  if (selected && selected.requiresLocation && !location) {
    const isArm = selected.requiresLocation === "arm";
    const options: { label: string; value: ArmourLocationKey[] }[] = isArm
      ? [
          { label: "Left Arm", value: ["leftArm"] },
          { label: "Right Arm", value: ["rightArm"] },
          { label: "Both Arms", value: ["leftArm", "rightArm"] },
        ]
      : [
          { label: "Left Leg", value: ["leftLeg"] },
          { label: "Right Leg", value: ["rightLeg"] },
          { label: "Both Legs", value: ["leftLeg", "rightLeg"] },
        ];

    return (
      <ModalShell
        ariaLabel={selected.name}
        onClose={resetPicker}
        className="max-w-md lg:max-w-lg overflow-y-auto"
      >
        <ModalHeader title={selected.name} onClose={resetPicker} />

        <PickerList>
          <p className={`text-sm lg:text-base ${uiTextBody}`}>Select installation side:</p>
          {options.map((opt) => (
            <PickerRow key={opt.label} opensScreen onClick={() => setLocation(opt.value)}>
              <PickerRowName name={opt.label} />
            </PickerRow>
          ))}
        </PickerList>

        <div className="px-4 lg:px-5 py-3 lg:py-4">
          <Button fullWidth variant="neutral" onClick={resetPicker}>
            Back
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Craftsmanship picker ─────────────────────────────────────────────────
  if (selected) {
    const qualities = availableCraftsmanship(selected);
    return (
      <ModalShell
        ariaLabel={selected.name}
        onClose={resetPicker}
        className="max-w-md lg:max-w-lg overflow-y-auto"
      >
        <ModalHeader title={selected.name} onClose={resetPicker} />

        <PickerBody>
          {location && (
            <div className={`${uiInlineRow} text-xs lg:text-sm ${uiTextBody}`}>
              <span>Installing on:</span>
              <Chip colour="slate">
                {location.map((item) => ARMOUR_LOCATION_LABELS[item]).join(" & ")}
              </Chip>
            </div>
          )}

          <div>
            <p className={`text-sm lg:text-base ${uiTextBody} mb-2`}>
              Select craftsmanship quality:
            </p>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <ToggleButton
                  key={q}
                  selected={craftsmanship === q}
                  selectedClassName={CRAFTSMANSHIP_STYLE[q]}
                  className="flex-1 py-1.5 lg:py-2 text-sm lg:text-base font-medium"
                  onClick={() => setCraftsmanship(q)}
                >
                  {q}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className={`whitespace-pre-line ${uiDescriptionBox}`}>
            {selected.id === "ih-concealed-weapon-bionic"
              ? concealedWeaponBionicDescription(craftsmanship)
              : craftsmanshipDescription(selected, craftsmanship)}
          </div>
          <ItemMetaChips
            value={craftsmanshipValue(selected, craftsmanship)}
            availability={selected.availability}
            source={selected.source}
          />
        </PickerBody>

        <div className={`${uiTwoColumnGrid} px-4 lg:px-5 py-3 lg:py-4`}>
          <Button
            onClick={() => {
              if (selected.id === "ih-concealed-weapon-bionic") {
                onSelect(
                  selected,
                  craftsmanship,
                  location ?? undefined,
                  assignedValue,
                  assignedRarity
                );
                resetPicker();
                return;
              }
              setWeightStep(true);
            }}
            disabled={!editable}
          >
            Continue
          </Button>
          <Button variant="neutral" onClick={resetPicker}>
            Back
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Search list ──────────────────────────────────────────────────────────
  return (
    <PickerModal
      title={editable ? "Add Cybernetic" : "View Cybernetics"}
      placeholder="Search implants…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction onClick={onCustom}>Add Custom Cybernetic</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <ImplantRow
              key={`custom-${entry.item.id}`}
              item={buildCyberneticSnapshot(
                `picker-${entry.item.id}`,
                undefined,
                entry.item.data,
                entry.item.id,
                previewVersionId(entry.item)
              )}
              editable={false}
              libraryItem={entry.item}
              preview
              onSelect={editable ? () => onSelectCustomItem?.(entry.item) : undefined}
              onToggleInstalled={() => {}}
              onRemove={() => {}}
            />
          ) : (
            <ImplantRow
              key={entry.ref.id}
              item={cyberneticFromReference(`picker-${entry.ref.id}`, entry.ref)}
              editable={false}
              preview
              previewNote={assignedOnAddNote(entry.ref)}
              onSelect={editable ? () => selectImplant(entry.ref) : undefined}
              onToggleInstalled={() => {}}
              onRemove={() => {}}
            />
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
