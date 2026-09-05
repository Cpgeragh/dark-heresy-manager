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
  PickerModal,
  PickerRow,
} from "../../../ui/pickers/PickerModal";
import { Button } from "../../../ui/buttons/Button";
import { ModalHeader } from "../../../ui/modals/ModalHeader";
import { ModalShell } from "../../../ui/modals/ModalShell";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import {
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiInfoModalWrapper,
  uiItemName,
  uiTextGMNote,
} from "../../../ui/styles/editableStyles";
import { uiPickerBackButton } from "../../../ui/styles/buttonStyles";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { formatMoneyInput } from "../../../ui/format/moneyFormat";
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
import { isVariableMeta } from "../../../utils/customItemMeta";
import { useAssignedItemMeta } from "../../../hooks/useAssignedItemMeta";
import { AssignedItemMetaScreen } from "../../../ui/pickers/AssignedItemMetaScreen";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"cybernetic">[];
  onSelect: (
    ref: CyberneticRef,
    craftsmanship: CyberneticCraftsmanship | undefined,
    bodyLocation?: ArmourLocationKey[],
    gmValue?: string,
    gmRarity?: string
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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const [pendingCost, setPendingCost] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");
  const [assignedValue, setAssignedValue] = useState<string | undefined>();
  const [assignedRarity, setAssignedRarity] = useState<string | undefined>();
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
    resetAssignedItemMeta();
  };
  const finalizeSelection = (ref: CyberneticRef, gmValue?: string, gmRarity?: string) => {
    if (!hasQualityText(ref) && !ref.requiresLocation) {
      onSelect(ref, undefined, undefined, gmValue, gmRarity);
      resetPicker();
      return;
    }
    setSelected(ref);
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
    finalizeSelection(ref, nextValue, nextRarity);
  };
  const implantInfo = (ref: CyberneticRef) => (
    <div className="space-y-3">
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>Item Rules</p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
        </div>
      )}
      {availableCraftsmanship(ref).map((quality) => (
        <div key={quality}>
          <p className={`${uiTextLabel} font-semibold mb-1`}>{quality}</p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
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
        onConfirm={confirmCost}
        maxWidth="max-w-md lg:max-w-lg"
      />
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

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-3">
          <p className={`text-xs lg:text-sm ${uiTextMuted}`}>Select installation side:</p>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.label}
                onClick={() => setLocation(opt.value)}
                className="py-2 lg:py-2.5 px-3 lg:px-4 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-200 text-left transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700">
          <button type="button" onClick={resetPicker} className={uiPickerBackButton}>
            Back
          </button>
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
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted}`}>
              <span>Installing on:</span>
              <Chip className="border-slate-600 bg-slate-800 text-slate-300">
                {location.map((item) => ARMOUR_LOCATION_LABELS[item]).join(" & ")}
              </Chip>
            </div>
          )}

          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>
              Select craftsmanship quality:
            </p>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`whitespace-pre-line text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}
          >
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

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button type="button" onClick={resetPicker} className={uiPickerBackButton}>
            Back
          </button>
          <Button
            className="flex-1"
            onClick={() => {
              onSelect(
                selected,
                craftsmanship,
                location ?? undefined,
                assignedValue,
                assignedRarity
              );
              resetPicker();
            }}
            disabled={!editable}
          >
            Install
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
      {pickerEntries.map((entry) =>
        entry.kind === "custom" ? (
          <PickerRow
            key={`custom-${entry.item.id}`}
            interactive={editable}
            onClick={() => onSelectCustomItem?.(entry.item)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}
              >
                {entry.item.name}
              </span>
              <StatusBadge status={entry.item.status} />
              {entry.item.data.notes && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal
                    title={entry.item.name}
                    content={
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                        {entry.item.data.notes}
                      </p>
                    }
                    as="span"
                  />
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
              <ItemMetaChips
                bare
                value={entry.item.data.value}
                availability={entry.item.data.availability}
                source={entry.item.data.source}
              />
              <Chip className={CRAFTSMANSHIP_STYLE[entry.item.data.craftsmanship ?? "Common"]}>
                {entry.item.data.craftsmanship ?? "Common"}
              </Chip>
            </div>
          </PickerRow>
        ) : (
          <PickerRow
            key={entry.ref.id}
            interactive={editable}
            onClick={() => selectImplant(entry.ref)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}
              >
                {entry.ref.name}
              </span>
              {(entry.ref.notes || entry.ref.poor || entry.ref.common || entry.ref.good) && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={entry.ref.name} content={implantInfo(entry.ref)} as="span" />
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
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
            </div>
          </PickerRow>
        )
      )}
    </PickerModal>
  );
}
