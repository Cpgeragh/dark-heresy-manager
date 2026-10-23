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
import {
  PickerRowChips,
  PickerRowName,
  PickerRowRulesLine,
} from "../../../ui/pickers/PickerRowParts";
import { InfoParagraph } from "../../../ui/InfoSection";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { ModalHeader } from "../../../ui/modals/ModalHeader";
import { ModalShell } from "../../../ui/modals/ModalShell";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  uiInlineRow,
  uiTextBody,
  uiTextLabel,
  uiTextGMNote,
  uiTextDescription,
  uiDescriptionBox,
  uiStackBody,
  uiStackField,
  uiFormLabel,
  editableInputClass,
} from "../../../ui/styles/editableStyles";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/format/weightFormat";
import { CRAFTSMANSHIP_COLOUR, CRAFTSMANSHIP_STYLE } from "../../../ui/styles/craftsmanship";
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
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/pickers/AssignedItemMetaScreen";
import { colourDivider } from "../../../ui/styles/colourTokens";

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
  const [pendingCost, setPendingCost] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");
  const [assignedValue, setAssignedValue] = useState<string | undefined>();
  const [assignedRarity, setAssignedRarity] = useState<string | undefined>();
  const [weightStep, setWeightStep] = useState(false);
  const [weight, setWeight] = useState("");
  const listScrollPositionRef = useRef(0);
  const pendingNeedsCost = pendingCost ? isVariableMeta(pendingCost.value) : false;
  const pendingNeedsRarity = pendingCost ? isVariableMeta(pendingCost.availability) : false;
  const {
    gmCost,
    setGmCost,
    gmRarity,
    setGmRarity,
    showRarityPicker,
    setShowRarityPicker,
    costValid,
    canConfirm: canConfirmCost,
    resetAssignedItemMeta,
  } = useAssignedItemMeta({ requiresCost: pendingNeedsCost, requiresRarity: pendingNeedsRarity });

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
    setPendingCost(null);
    setLocation(null);
    setCraftsmanship("Common");
    setAssignedValue(undefined);
    setAssignedRarity(undefined);
    setWeightStep(false);
    setWeight("");
    resetAssignedItemMeta();
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
    if (isVariableMeta(ref.value) || isVariableMeta(ref.availability)) {
      setPendingCost(ref);
      resetAssignedItemMeta();
      return;
    }
    finalizeSelection(ref);
  };
  const confirmCost = () => {
    if (!pendingCost || !canConfirmCost) return;
    const nextValue = pendingNeedsCost ? formatMoneyInput(gmCost) : undefined;
    const nextRarity = pendingNeedsRarity ? gmRarity : undefined;
    setAssignedValue(nextValue);
    setAssignedRarity(nextRarity);
    const ref = pendingCost;
    setPendingCost(null);
    finalizeSelection(ref);
  };
  const implantInfo = (ref: CyberneticRef) => (
    <div className={uiStackBody}>
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Item Rules</p>
          <p className={uiTextDescription}>{ref.notes}</p>
        </div>
      )}
      {availableCraftsmanship(ref).map((quality) => (
        <div key={quality}>
          <p className={`${uiTextLabel} font-semibold mb-1`}>{quality}</p>
          <p className={uiTextDescription}>
            {ref.id === "ih-concealed-weapon-bionic"
              ? concealedWeaponBionicDescription(quality)
              : craftsmanshipDescription(ref, quality)}
          </p>
        </div>
      ))}
    </div>
  );

  if (pendingCost) {
    return (
      <AssignedItemMetaScreen
        title="Assigned Cost"
        itemName={pendingCost.name}
        explanation="has no listed cost or availability. Enter the values assigned for this implant."
        gmCost={gmCost}
        setGmCost={setGmCost}
        costValid={costValid}
        costPlaceholder="e.g. 5000"
        requiresCost={pendingNeedsCost}
        requiresRarity={pendingNeedsRarity}
        gmRarity={gmRarity}
        setGmRarity={setGmRarity}
        showRarityPicker={showRarityPicker}
        setShowRarityPicker={setShowRarityPicker}
        idPrefix="cybernetic-assigned-meta"
        confirmLabel="Continue"
        canConfirm={canConfirmCost}
        onBack={resetPicker}
        onClose={onClose}
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
            <label htmlFor="implant-weight" className={uiFormLabel}>
              Weight (kg)
            </label>
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

        <div className={`px-4 lg:px-5 py-3 lg:py-4 border-t ${colourDivider} flex gap-2`}>
          <Button
            variant="neutral"
            onClick={() => (asksQuality(selected) ? setWeightStep(false) : resetPicker())}
          >
            Back
          </Button>
          <Button
            className="flex-1"
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
          <p className={`text-xs lg:text-sm ${uiTextBody}`}>Select installation side:</p>
          {options.map((opt) => (
            <PickerRow key={opt.label} opensScreen onClick={() => setLocation(opt.value)}>
              <PickerRowName name={opt.label} />
            </PickerRow>
          ))}
        </PickerList>

        <div className={`px-4 lg:px-5 py-3 lg:py-4 border-t ${colourDivider}`}>
          <Button variant="neutral" onClick={resetPicker}>
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
            <p className={`text-xs lg:text-sm ${uiTextBody} mb-2`}>Select craftsmanship quality:</p>
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

        <div className={`px-4 lg:px-5 py-3 lg:py-4 border-t ${colourDivider} flex gap-2`}>
          <Button variant="neutral" onClick={resetPicker}>
            Back
          </Button>
          <Button
            className="flex-1"
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
          <PickerCustomAction onClick={onCustom}>+ Add custom cybernetic</PickerCustomAction>
        ) : undefined
      }
    >
      <PickerList>
        {pickerEntries.map((entry) =>
          entry.kind === "custom" ? (
            <PickerRow
              key={`custom-${entry.item.id}`}
              interactive={editable}
              onClick={() => onSelectCustomItem?.(entry.item)}
            >
              <PickerRowName
                name={entry.item.name}
                status={entry.item.status}
                infoTitle={entry.item.name}
                information={
                  entry.item.data.notes ? (
                    <InfoParagraph>{entry.item.data.notes}</InfoParagraph>
                  ) : undefined
                }
              />
              <PickerRowChips className="text-xs lg:text-sm">
                <ItemMetaChips
                  bare
                  weight={entry.item.data.weight}
                  value={entry.item.data.value}
                  availability={entry.item.data.availability}
                  source={entry.item.data.source}
                />
                <Chip colour={CRAFTSMANSHIP_COLOUR[entry.item.data.craftsmanship ?? "Common"]}>
                  {entry.item.data.craftsmanship ?? "Common"}
                </Chip>
              </PickerRowChips>
              <PickerRowRulesLine name={entry.item.name} rules={entry.item.data.rules} />
            </PickerRow>
          ) : (
            <PickerRow
              key={entry.ref.id}
              interactive={editable}
              opensScreen
              onClick={() => selectImplant(entry.ref)}
            >
              <PickerRowName
                name={entry.ref.name}
                infoTitle={entry.ref.name}
                information={
                  entry.ref.notes || entry.ref.poor || entry.ref.common || entry.ref.good
                    ? implantInfo(entry.ref)
                    : undefined
                }
              />
              <PickerRowChips className="text-xs lg:text-sm">
                <ItemMetaChips
                  bare
                  value={isVariableMeta(entry.ref.value) ? undefined : entry.ref.value}
                  availability={
                    isVariableMeta(entry.ref.availability) ? undefined : entry.ref.availability
                  }
                  source={entry.ref.source}
                />
                {isVariableMeta(entry.ref.value) && isVariableMeta(entry.ref.availability) && (
                  <span className={uiTextGMNote}>Cost and availability assigned on add</span>
                )}
                {isVariableMeta(entry.ref.value) && !isVariableMeta(entry.ref.availability) && (
                  <span className={uiTextGMNote}>Cost assigned on add</span>
                )}
                {!isVariableMeta(entry.ref.value) && isVariableMeta(entry.ref.availability) && (
                  <span className={uiTextGMNote}>Availability assigned on add</span>
                )}
              </PickerRowChips>
              <PickerRowRulesLine
                name={entry.ref.name}
                rules={entry.ref.id === "ih-concealed-weapon-bionic" ? undefined : entry.ref.notes}
              />
            </PickerRow>
          )
        )}
      </PickerList>
    </PickerModal>
  );
}
