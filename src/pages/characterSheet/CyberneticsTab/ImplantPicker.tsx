// src/pages/characterSheet/CyberneticsTab/ImplantPicker.tsx

import { useState } from "react";
import type { CyberneticCraftsmanship, ArmourLocationKey } from "../../../types/Character";
import {
  CYBERNETICS_REFERENCE,
  type CyberneticRef,
} from "../../../data/reference/cyberneticsReference";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../../ui/PickerModal";
import { OptionPickerScreen } from "../../../ui/OptionPickerScreen";
import { ArrowRight } from "../../../ui/PickerArrows";
import { Button } from "../../../ui/Button";
import { ModalHeader } from "../../../ui/ModalHeader";
import { ModalShell } from "../../../ui/ModalShell";
import { InfoModal } from "../../../components/InfoModal";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { editableInputClass, uiTextBody, uiTextLabel, uiTextMuted, uiFormLabel, uiInfoModalWrapper, uiItemName, uiTextGMNote } from "../../../ui/editableStyles";
import { uiPickerBackButton } from "../../../ui/buttonStyles";
import { StatusBadge } from "../../../ui/StatusBadge";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { CRAFTSMANSHIP_STYLE } from "../../../ui/craftsmanship";
import { LOCATION_DISPLAY } from "./cyberneticsConstants";
import {
  availableCraftsmanship,
  craftsmanshipDescription,
  defaultCraftsmanship,
} from "./cyberneticsHelpers";
import type { CampaignCustomItem } from "../../../types/CustomItems";

interface Props {
  editable?: boolean;
  customItems?: CampaignCustomItem<"cybernetic">[];
  onSelect: (
    ref: CyberneticRef,
    craftsmanship: CyberneticCraftsmanship,
    bodyLocation?: ArmourLocationKey[],
    gmValue?: string,
    gmRarity?: string
  ) => void;
  onSelectCustomItem?: (item: CampaignCustomItem<"cybernetic">) => void;
  onCustom?: () => void;
  onClose: () => void;
}

const AVAILABILITY_OPTIONS = [
  "Abundant",
  "Plentiful",
  "Common",
  "Average",
  "Uncommon",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
  "Issued Only",
  "Adeptus Mechanicus Only",
] as const;

function isVariableMeta(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return !normalized || normalized === "\u2014" || normalized === "variable" || normalized === "varies";
}

export function ImplantPicker({
  editable = true,
  customItems = [],
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CyberneticRef | null>(null);
  const [pendingCost, setPendingCost] = useState<CyberneticRef | null>(null);
  const [location, setLocation] = useState<ArmourLocationKey[] | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<CyberneticCraftsmanship>("Common");
  const [gmCost, setGmCost] = useState("");
  const [gmRarity, setGmRarity] = useState("");
  const [assignedValue, setAssignedValue] = useState<string | undefined>();
  const [assignedRarity, setAssignedRarity] = useState<string | undefined>();
  const [showRarityPicker, setShowRarityPicker] = useState(false);

  const normalizedQuery = query.toLowerCase();
  const filtered = CYBERNETICS_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  const resetPicker = () => {
    setSelected(null);
    setPendingCost(null);
    setLocation(null);
    setCraftsmanship("Common");
    setGmCost("");
    setGmRarity("");
    setAssignedValue(undefined);
    setAssignedRarity(undefined);
    setShowRarityPicker(false);
  };
  const selectImplant = (ref: CyberneticRef) => {
    if (!editable) return;
    if (isVariableMeta(ref.value) || isVariableMeta(ref.availability)) {
      setPendingCost(ref);
      setGmCost("");
      setGmRarity("");
      return;
    }
    setSelected(ref);
    setCraftsmanship(defaultCraftsmanship(ref));
  };
  const costNum = Number(gmCost);
  const costValid = gmCost.trim() !== "" && Number.isInteger(costNum) && costNum >= 0;
  const pendingNeedsRarity = pendingCost ? isVariableMeta(pendingCost.availability) : false;
  const canConfirmCost = costValid && (!pendingNeedsRarity || gmRarity !== "");
  const confirmCost = () => {
    if (!pendingCost || !canConfirmCost) return;
    setAssignedValue(formatMoneyInput(gmCost));
    setAssignedRarity(pendingNeedsRarity ? gmRarity : undefined);
    setSelected(pendingCost);
    setPendingCost(null);
    setCraftsmanship(defaultCraftsmanship(pendingCost));
  };
  const implantInfo = (ref: CyberneticRef) => (
    <div className="space-y-3">
      {ref.notes && (
        <div>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            Item Rules
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>
        </div>
      )}
      {availableCraftsmanship(ref).map((quality) => (
        <div key={quality}>
          <p className={`${uiTextLabel} font-semibold mb-1`}>
            {quality}
          </p>
          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
            {craftsmanshipDescription(ref, quality)}
          </p>
        </div>
      ))}
    </div>
  );

  if (pendingCost) {
    if (showRarityPicker) {
      return (
        <OptionPickerScreen
          title="Rarity"
          options={[...AVAILABILITY_OPTIONS]}
          selected={gmRarity}
          onSelect={(value) => { setGmRarity(value); setShowRarityPicker(false); }}
          onClose={() => setShowRarityPicker(false)}
        />
      );
    }
    return (
      <ModalShell
        ariaLabel="Assigned Cost"
        onClose={resetPicker}
        className="max-w-md lg:max-w-lg overflow-y-auto"
      >
        <ModalHeader title="Assigned Cost" onClose={resetPicker} />

        <PickerBody>
          <p className={`text-sm lg:text-base ${uiTextBody}`}>
            <span className="font-medium text-slate-200">{pendingCost.name}</span> has no listed
            cost or availability. Enter the values assigned for this implant.
          </p>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Cost (Thrones) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={gmCost}
              onChange={(e) => setGmCost(sanitizeMoneyInput(e.target.value))}
              placeholder="e.g. 5000"
              className={editableInputClass(true)}
            />
            {gmCost.trim() !== "" && !costValid && (
              <p className="text-xs lg:text-sm text-red-400">Must be a whole number of 0 or more.</p>
            )}
          </div>

          {pendingNeedsRarity && (
            <div className="space-y-1">
              <label className={uiFormLabel}>
                Rarity <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowRarityPicker(true)}
                className={editableInputClass(true) + " appearance-none text-left flex items-center justify-between"}
              >
                <span className={gmRarity ? "" : "text-slate-500"}>{gmRarity || "— Select availability —"}</span>
                <ArrowRight />
              </button>
            </div>
          )}
        </PickerBody>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button type="button" onClick={resetPicker} className={uiPickerBackButton}>
            Back
          </button>
          <Button className="flex-1" onClick={confirmCost} disabled={!canConfirmCost}>
            Continue
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Step 2: Location picker (arm/leg implants only) ───────────────────────
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
              <button type="button"
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

  // ── Step 3: Craftsmanship picker ──────────────────────────────────────────
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
                {location.map((l) => LOCATION_DISPLAY[l]).join(" & ")}
              </Chip>
            </div>
          )}

          <div>
            <p className={`text-xs lg:text-sm ${uiTextMuted} mb-2`}>Select craftsmanship quality:</p>
            <div className="flex gap-2">
              {qualities.map((q) => (
                <button type="button"
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

          <div className={`text-xs lg:text-sm ${uiTextBody} bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed`}>
            {craftsmanshipDescription(selected, craftsmanship)}
          </div>
        </PickerBody>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button type="button" onClick={resetPicker} className={uiPickerBackButton}>
            Back
          </button>
          <Button
            className="flex-1"
            onClick={() => onSelect(selected, craftsmanship, location ?? undefined, assignedValue, assignedRarity)}
            disabled={!editable}
          >
            Install
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Step 1: Search list ───────────────────────────────────────────────────
  return (
    <PickerModal
      title={editable ? "Add Cybernetic" : "View Cybernetics"}
      placeholder="Search implants…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      footer={
        editable && onCustom ? (
          <PickerCustomAction
            onClick={onCustom}
          >
            + Add custom cybernetic
          </PickerCustomAction>
        ) : undefined
      }
    >
      {filteredCustom.map((item) => (
        <PickerRow
          key={`custom-${item.id}`}
          interactive={editable}
          onClick={() => onSelectCustomItem?.(item)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {item.name}
            </span>
            <StatusBadge status={item.status} />
            {item.data.notes && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal
                  title={item.name}
                  content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.data.notes}</p>}
                  as="span"
                />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              value={item.data.value}
              availability={item.data.availability}
              source={item.data.source}
            />
            <Chip className={CRAFTSMANSHIP_STYLE[item.data.craftsmanship]}>
              {item.data.craftsmanship}
            </Chip>
          </div>
        </PickerRow>
      ))}

      {filtered.map((ref) => (
        <PickerRow
          key={ref.id}
          interactive={editable}
          onClick={() => selectImplant(ref)}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
              {ref.name}
            </span>
            {(ref.notes || ref.poor || ref.common || ref.good) && (
              <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                <InfoModal title={ref.name} content={implantInfo(ref)} as="span" />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
            <ItemMetaChips
              bare
              value={isVariableMeta(ref.value) ? undefined : ref.value}
              availability={isVariableMeta(ref.availability) ? undefined : ref.availability}
              source={ref.source}
            />
            {(isVariableMeta(ref.value) || isVariableMeta(ref.availability)) && (
              <span className={uiTextGMNote}>Cost assigned on add</span>
            )}
          </div>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
