// src/pages/characterSheet/weapons/RangedCard.tsx
// RangedPicker, CustomRangedForm, RangedCard — co-located for navigability.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  RangedWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  ArcheotechItem,
  WeaponCraftsmanship,
} from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  type RangedWeaponRef,
} from "../../../data/reference/weaponReference";
import {
  AMMO_REFERENCE,
  RECHARGING_POWER_PACKS_TEXT,
  formatAmmoName,
  isChargePackAmmoName,
  usesUnitAmmoTracking,
} from "../../../data/reference/ammoReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, uiSection } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightForDisplay, formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyForDisplay, formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  AttachmentPicker,
  AttachmentCard,
  EquipToggle,
} from "./weaponShared";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { effectiveRangedStats, getCompatibleUpgrades } from "./weaponHelpers";

const WEAPON_CRAFTSMANSHIP_OPTIONS: WeaponCraftsmanship[] = ["Poor", "Common", "Good", "Best"];

const WEAPON_CRAFTSMANSHIP_STYLE: Record<WeaponCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};

type AmmoTrackingMode = NonNullable<RangedWeapon["ammoTracking"]>;

function rangedCraftsmanshipDescription(craftsmanship: WeaponCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poor ranged weapons are more prone to malfunction. A Poor ranged weapon has the Unreliable quality. If it already has this quality, it jams on any failed roll to hit.";
    case "Good":
      return "Good ranged weapons are more reliable. A Good ranged weapon has the Reliable quality. If it already has this quality, there is no further effect beyond fine workmanship.";
    case "Best":
      return "Best ranged weapons never suffer from jamming or overheating. If a roll would result in either, count it as a miss instead.";
    case "Common":
    default:
      return "Common craftsmanship ranged weapons have no additional modifier.";
  }
}

// ─── Ranged Picker ────────────────────────────────────────────────────────────

export function RangedPicker({
  editable = true,
  onSelect,
  onCustom,
  onClose,
  references = RANGED_WEAPON_REFERENCE,
  title = "Add Ranged Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  onSelect: (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: RangedWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RangedWeaponRef | null>(null);
  const [craftsmanship, setCraftsmanship] = useState<WeaponCraftsmanship>("Common");
  const filtered = references
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const modalTitle = editable ? title : title.replace(/^Add\b/, "View");

  function resetPicker() {
    setSelected(null);
    setCraftsmanship("Common");
  }

  const craftDialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const d = craftDialogRef.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, [selected]);

  if (selected) {
    return createPortal(
      <dialog
        ref={craftDialogRef}
        onClose={resetPicker}
        onClick={(e) => { if (e.target === craftDialogRef.current) resetPicker(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md lg:max-w-lg bg-slate-900 border border-slate-500 rounded-xl shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-slate-700">
          <h3 className="text-sm lg:text-base font-semibold text-slate-200">{selected.name}</h3>
          <button
            onClick={resetPicker}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            {"\u00D7"}
          </button>
        </div>

        <div className="px-4 lg:px-5 py-4 lg:py-5 space-y-4">
          <div>
            <p className="text-xs lg:text-sm text-slate-400 mb-2">Select weapon craftsmanship:</p>
            <div className="flex gap-2">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setCraftsmanship(q)}
                  className={[
                    "flex-1 py-1.5 lg:py-2 rounded border text-sm lg:text-base font-medium transition",
                    craftsmanship === q
                      ? WEAPON_CRAFTSMANSHIP_STYLE[q]
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs lg:text-sm text-slate-400 bg-slate-800/60 rounded p-3 lg:p-4 leading-relaxed">
            {rangedCraftsmanshipDescription(craftsmanship)}
          </div>
        </div>

        <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-slate-700 flex gap-2">
          <button
            onClick={resetPicker}
            className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
          >
            Back
          </button>
          <Button className="flex-1" onClick={() => onSelect(selected, craftsmanship)}>
            Add Weapon
          </Button>
        </div>
      </dialog>,
      document.body
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      placeholder={placeholder}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0}
      footer={
        editable && showCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom weapon
          </button>
        ) : undefined
      }
    >
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => setSelected(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} rarity={ref.rarity} source={ref.source} />
          </div>
          <div className="flex items-center gap-2 text-xs lg:text-sm text-slate-500 mt-0.5 flex-wrap font-code">
            <span>{ref.class}</span>
            <span>{ref.range}</span>
            <span>{ref.rof}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
            <span>Clip {ref.clip}</span>
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Qualities</span>
              <span className="text-xs lg:text-sm text-slate-400 italic">{ref.specialRules}</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Rules</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={ref.name} content={<SpecialRulesContent rules="" description={ref.description} />} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}

// ─── Custom Ranged Form ───────────────────────────────────────────────────────

export function CustomRangedForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: RangedWeapon) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Omit<RangedWeapon, "id" | "custom">>({
    name: "",
    class: "",
    damage: "",
    pen: "",
    range: "",
    rof: "",
    clip: "",
    rld: "",
    weight: "",
    value: "",
    specialRules: "",
  });

  const makeFieldSetter = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({
      ...prev,
      [k]:
        k === "weight"
          ? sanitizeWeightInput(e.target.value)
          : k === "value"
            ? sanitizeMoneyInput(e.target.value)
            : e.target.value,
    }));

  return (
    <div className="border border-red-700/30 bg-slate-900/60 rounded-lg p-4 lg:p-5 space-y-3">
      <p className="text-xs lg:text-sm font-semibold text-red-500 uppercase tracking-wide">
        Custom Ranged Weapon
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            "name",
            "class",
            "range",
            "rof",
            "damage",
            "pen",
            "clip",
            "rld",
            "weight",
            "value",
            "specialRules",
          ] as const
        ).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              {k === "rld" ? "Reload" : k}
            </label>
            <input
              type="text"
              inputMode={k === "weight" ? "decimal" : k === "value" ? "numeric" : undefined}
              value={fields[k] ?? ""}
              onChange={makeFieldSetter(k)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              custom: true,
              ...fields,
              weight: formatWeightInput(fields.weight ?? ""),
              value: formatMoneyInput(fields.value ?? ""),
            })
          }
          disabled={!fields.name?.trim()}
        >
          Add
        </Button>
        <button
          onClick={onCancel}
          className="px-4 lg:px-5 py-1.5 lg:py-2 rounded border border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Ammo Entry Row ───────────────────────────────────────────────────────────

function AmmoEntryRow({
  entry,
  editable,
  clipSize,
  ammoTracking,
  weightKg,
  onSetLoaded,
  onRemove,
  onUpdateClips,
  onUpdateRounds,
  onSetLooseRounds,
}: {
  entry: WeaponAmmoEntry;
  editable: boolean;
  clipSize?: string;
  ammoTracking: AmmoTrackingMode;
  weightKg?: number;
  onSetLoaded: () => void;
  onRemove: () => void;
  onUpdateClips: (qty: number) => void;
  onUpdateRounds: (qty: number) => void;
  onSetLooseRounds: (qty: number) => void;
}) {
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  const displayName = formatAmmoName(ammoRef?.name ?? entry.name);
  const isChargePack = isChargePackAmmoName(displayName);
  const hasAmmoInfo = !!ammoRef?.description || isChargePack;
  const clipSizeNumber = parseFloat(clipSize ?? "0") || 0;
  const looseRoundCount = entry.rounds + entry.clips * (clipSizeNumber || 1);
  const clipSizeLabel =
    clipSize && clipSize !== "0" && clipSize !== "—" && clipSize !== "N/A"
      ? `${clipSize}/clip`
      : undefined;
  const visibleClipSizeLabel = ammoTracking === "clip" ? clipSizeLabel : undefined;

  return (
    <div className="rounded bg-slate-800/60 px-2.5 lg:px-3 py-2 lg:py-2.5 space-y-1.5">
      {/* Name row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={editable ? onSetLoaded : undefined}
            title={entry.loaded ? "Loaded" : "Mark as loaded"}
            className={`w-2 h-2 rounded-full shrink-0 transition ${
              entry.loaded
                ? "bg-green-400"
                : editable
                  ? "bg-slate-600 hover:bg-green-500"
                  : "bg-slate-600"
            }`}
          />
          <span className="text-xs lg:text-sm text-slate-200 truncate">{displayName}</span>
          {hasAmmoInfo && (
            <span className="inline-flex items-center -translate-y-[1.4px]">
              <InfoModal
                title={displayName}
                content={
                  <div className="space-y-2">
                    {ammoRef?.description && (
                      <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{ammoRef.description}</p>
                    )}
                    {isChargePack && (
                      <div className="space-y-1">
                        <p className="text-sm lg:text-base font-semibold text-slate-100">Recharging Power Packs</p>
                        <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                          {RECHARGING_POWER_PACKS_TEXT}
                        </p>
                      </div>
                    )}
                  </div>
                }
              />
            </span>
          )}
          {entry.loaded && (
            <span className="text-[10px] lg:text-xs text-green-500 uppercase tracking-wide shrink-0">
              Loaded
            </span>
          )}
        </div>
        {editable && (
          <button
            onClick={onRemove}
            className="text-xs lg:text-sm text-red-400 hover:text-red-300 shrink-0 leading-none"
          >
            ×
          </button>
        )}
      </div>

      {(ammoRef || visibleClipSizeLabel || weightKg !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] lg:text-xs">
          {visibleClipSizeLabel && (
            <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-slate-400">
              {visibleClipSizeLabel}
            </span>
          )}
          {ammoRef && (
            <>
              <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-amber-400/80">
                {formatMoneyForDisplay(ammoRef.cost)}
              </span>
              <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-slate-400">
                per {ammoRef.purchaseAmount}
              </span>
            </>
          )}
          <span className="rounded border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-slate-400">
            ⚖ {formatWeightForDisplay(formatWeight(weightKg ?? 0))}
          </span>
        </div>
      )}

      {/* Count */}
      <div className="flex items-center gap-4">
        {ammoTracking === "loose" ? (
          <div className="flex items-center gap-1.5">
            <span className="w-16 lg:w-[4.5rem] text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">
              Rounds
            </span>
            <QuantityControl
              quantity={looseRoundCount}
              editable={editable}
              size="sm"
              onUpdate={onSetLooseRounds}
            />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-16 lg:w-[4.5rem] text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">
                Clips
              </span>
              <QuantityControl
                quantity={entry.clips}
                editable={editable}
                size="sm"
                onUpdate={onUpdateClips}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-16 lg:w-[4.5rem] text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">
                Rounds
              </span>
              <QuantityControl
                quantity={entry.rounds}
                editable={editable}
                size="sm"
                onUpdate={onUpdateRounds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

function AmmoPicker({
  compatibleIds,
  existingNames,
  editable = true,
  onSelect,
  onClose,
}: {
  compatibleIds?: string[];
  existingNames: Set<string>;
  editable?: boolean;
  onSelect: (name: string, referenceId?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");

  const pool = compatibleIds
    ? AMMO_REFERENCE.filter((a) => compatibleIds.includes(a.id))
    : AMMO_REFERENCE;

  const options = query.trim()
    ? pool.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : pool;

  return (
    <PickerModal
      title={editable ? "Add Ammo Type" : "View Ammo Types"}
      placeholder="Search ammo…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
      footer={
        editable ? (
          <div className="space-y-2">
            <p className="text-xs lg:text-sm text-slate-500">Custom / unlisted ammo</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ammo name…"
                className="flex-1 text-sm lg:text-base bg-slate-800 border border-slate-600 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={() => {
                  if (customName.trim()) {
                    onSelect(customName.trim());
                    onClose();
                  }
                }}
                disabled={!customName.trim() || existingNames.has(customName.trim())}
              >
                Add
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {options.map((ammo) => (
        <button
          key={ammo.id}
          onClick={
            editable
              ? () => {
                  onSelect(formatAmmoName(ammo.name), ammo.id);
                  onClose();
                }
              : undefined
          }
          disabled={editable && existingNames.has(formatAmmoName(ammo.name))}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            editable ? "hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white">
              {formatAmmoName(ammo.name)}
            </span>
            <div className="flex items-center gap-1.5 text-xs lg:text-sm shrink-0">
              <span className="text-slate-500">{ammo.rarity}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/80">{formatMoneyForDisplay(ammo.cost)}</span>
              <span className="text-slate-500">/ {ammo.purchaseAmount}</span>
            </div>
          </div>
          {ammo.description && (
            <p className="text-xs lg:text-sm text-slate-500 mt-0.5 line-clamp-2">{ammo.description}</p>
          )}
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Ammo Weight ─────────────────────────────────────────────────────────────
// CR rule: a full clip weighs 10% of the weapon's weight.

function calcEntryWeight(
  weaponWeight: string | undefined,
  clip: string | undefined,
  entry: WeaponAmmoEntry,
  ammoTracking: AmmoTrackingMode
): number {
  const weaponKg = parseFloat(weaponWeight ?? "0");
  if (!weaponKg) return 0;
  const clipSize = parseFloat(clip ?? "1") || 1;
  const clipWeight = weaponKg * 0.1;
  if (ammoTracking === "loose") {
    return (entry.rounds + entry.clips * clipSize) * (clipWeight / clipSize);
  }
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  if (ammoRef?.id === "cr-hot-shot-charge") {
    return entry.clips * clipWeight;
  }
  if (usesUnitAmmoTracking(ammoRef)) {
    return entry.clips * (clipWeight / clipSize);
  }
  return entry.clips * clipWeight + (entry.rounds / clipSize) * clipWeight;
}

function formatWeight(kg: number): string {
  // Drop trailing zeros: 0.700 → "0.7", 0.500 → "0.5", 1.000 → "1"
  return parseFloat(kg.toFixed(2)).toString();
}

// ─── Ranged Card ──────────────────────────────────────────────────────────────

export function RangedCard({
  weapon,
  editable,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateAmmoEntries,
  onUpdateQuantity,
  grenades,
  onUpdateGrenades,
  archeotechGrenades,
  allowAttachments = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
  onUpdateAmmoEntries: (entries: WeaponAmmoEntry[]) => void;
  onUpdateQuantity: (qty: number) => void;
  grenades?: GrenadeItem[];
  onUpdateGrenades?: (next: GrenadeItem[]) => void;
  archeotechGrenades?: ArcheotechItem[];
  allowAttachments?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showAttachPicker, setShowAttachPicker] = useState(false);
  const [showAmmoPicker, setShowAmmoPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    attachmentIds.includes(upgrade.id)
  );
  // Resolve reference data first — source of truth for stats, avoids stale stored character data
  const weaponRef = weapon.referenceId
    ? RANGED_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : RANGED_WEAPON_REFERENCE.find(
        (r) => r.name === weapon.name && (!weapon.source || r.source === weapon.source)
      );
  const craftsmanship = weapon.craftsmanship ?? "Common";
  const baseSpecialRules =
    craftsmanship === "Common"
      ? (weaponRef?.specialRules ?? weapon.specialRules)
      : (weapon.specialRules ?? weaponRef?.specialRules);
  const baseWeapon = weaponRef ? { ...weapon, specialRules: baseSpecialRules } : weapon;
  const ammoTracking: AmmoTrackingMode = weapon.ammoTracking ?? weaponRef?.ammoTracking ?? "clip";
  const ammoEntries = weapon.ammoEntries ?? [];
  const loadedAmmoEntry = ammoEntries.find((entry) => entry.loaded);
  const loadedAmmoRef = loadedAmmoEntry?.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedAmmoEntry.referenceId)
    : undefined;
  const effective = effectiveRangedStats(baseWeapon, attachmentRefs, loadedAmmoRef);
  const addableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, attachmentIds);
  const viewableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, []);
  const visibleCompatible = allowAttachments
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];

  const rulesText = effective.specialRules?.trim() ?? "";
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-" && rulesText !== "â€”"
  );
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;

  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");
  const isGrenadeLauncher =
    weapon.referenceId === "cr-grenade-launcher" || weapon.referenceId === "cr-rpg-launcher";
  const hasAmmo = !isThrown && !isGrenadeLauncher && !!(weaponRef?.ammoType || weapon.custom);

  const existingAmmoNames = new Set(ammoEntries.map((e) => formatAmmoName(e.name)));

  // ── Ammo helpers ────────────────────────────────────────────────────────────

  function handleAddAmmo(name: string, referenceId?: string) {
    const isFirst = ammoEntries.length === 0;
    const ammoRef = referenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === referenceId)
      : undefined;
    const usesUnitTracking = ammoTracking === "clip" && usesUnitAmmoTracking(ammoRef);
    onUpdateAmmoEntries([
      ...ammoEntries,
      {
        id: crypto.randomUUID(),
        referenceId,
        name,
        clips: usesUnitTracking ? 1 : 0,
        rounds: 0,
        loaded: isFirst,
      },
    ]);
  }

  function handleRemoveAmmo(entryId: string) {
    const next = ammoEntries.filter((e) => e.id !== entryId);
    // If we removed the loaded entry, mark the first remaining one as loaded
    const removedWasLoaded = ammoEntries.find((e) => e.id === entryId)?.loaded ?? false;
    if (removedWasLoaded && next.length > 0) {
      next[0] = { ...next[0], loaded: true };
    }
    onUpdateAmmoEntries(next);
  }

  function handleSetLoaded(entryId: string) {
    onUpdateAmmoEntries(ammoEntries.map((e) => ({ ...e, loaded: e.id === entryId })));
  }

  function handleUpdateEntry(entryId: string, patch: Partial<WeaponAmmoEntry>) {
    onUpdateAmmoEntries(ammoEntries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)));
  }

  return (
    <div className={uiSection + " space-y-3"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => !forceExpanded && setExpanded((e) => !e)}
          disabled={forceExpanded}
        >
          <p className="text-sm lg:text-base font-semibold text-slate-200">{weapon.name}</p>
          {weapon.class && <p className="text-xs lg:text-sm text-slate-500">{weapon.class}</p>}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          {!forceExpanded && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-slate-400 hover:text-slate-200 transition"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {editable && (expanded || forceExpanded) && (
            <button onClick={onRemove} className="text-xs lg:text-sm text-red-400 hover:text-red-300 shrink-0">
              Remove
            </button>
          )}
        </div>
      </div>

      {(expanded || forceExpanded) && (
        <>
          {/* Stats grid */}
          <div className="flex flex-wrap gap-1.5">
            {effective.range && <StatChip label="Range" value={effective.range} />}
            {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
            {effective.damage && (
              <StatChip label="Damage" value={effective.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {effective.damage && <DamageTypeChip damage={effective.damage} />}
            {effective.pen && <StatChip label="Pen" value={effective.pen} />}
            {effective.clip && <StatChip label="Clip" value={effective.clip} />}
            {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Qualities</span>
              <span className="text-xs lg:text-sm text-slate-400 italic">
                {hasQualities ? rulesText : "-"}
              </span>
              {hasQualityModal && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${weapon.name} Qualities`}
                    content={<SpecialRulesContent rules={effective.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Rules</span>
              {hasItemRules ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${weapon.name} Rules`}
                    content={<SpecialRulesContent rules="" description={rulesDescription} />}
                  />
                </span>
              ) : (
                <span className="text-xs lg:text-sm text-slate-600 italic">-</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">
                Craftsmanship
              </span>
              <span className="text-xs lg:text-sm text-slate-400 italic">{craftsmanship}</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal
                  title={`${craftsmanship} Weapon`}
                  content={rangedCraftsmanshipDescription(craftsmanship)}
                />
              </span>
            </div>
          </div>

          {/* Weight / Value / Rarity / Source */}
          <ItemMetaChips
            weight={effective.weight}
            value={weapon.value}
            rarity={weapon.rarity}
            source={weapon.source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />

          {/* Thrown weapon: quantity counter */}
          {isThrown && (
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Quantity</span>
              <QuantityControl
                quantity={weapon.quantity ?? 0}
                editable={editable}
                size="sm"
                onUpdate={onUpdateQuantity}
              />
            </div>
          )}

          {/* Grenade launcher: ammo drawn from grenade inventory */}
          {isGrenadeLauncher && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Grenades</span>
              {(grenades ?? []).filter((g) => g.type !== "Mine").length === 0 &&
              (archeotechGrenades ?? []).length === 0 ? (
                <p className="text-xs lg:text-sm text-slate-600 italic">
                  No grenades — add via the Grenades & Mines section below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {(grenades ?? [])
                    .filter((g) => g.type !== "Mine")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="rounded bg-slate-800/60 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs lg:text-sm text-slate-200 truncate">{g.name}</span>
                        <QuantityControl
                          quantity={g.quantity}
                          editable={editable}
                          size="sm"
                          onUpdate={(qty) =>
                            onUpdateGrenades?.(
                              (grenades ?? []).map((x) =>
                                x.id === g.id ? { ...x, quantity: qty } : x
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  {(archeotechGrenades ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="rounded bg-amber-900/20 border border-amber-700/30 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs lg:text-sm text-slate-200 truncate">{g.name}</span>
                      <span className="text-[10px] lg:text-xs text-amber-400 border border-amber-700/50 rounded px-1.5 py-0.5">
                        Archeotech
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular weapon: ammo entries */}
          {hasAmmo && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Ammo</span>
                <button
                  onClick={() => setShowAmmoPicker(true)}
                  className="text-xs lg:text-sm text-red-500 hover:text-red-400"
                >
                  {editable ? "+ Add" : "View"}
                </button>
              </div>

              {ammoEntries.length === 0 ? (
                <p className="text-xs lg:text-sm text-slate-600 italic">No ammo tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {ammoEntries.map((entry) => (
                    <AmmoEntryRow
                      key={entry.id}
                      entry={entry}
                      editable={editable}
                      clipSize={effective.clip}
                      ammoTracking={ammoTracking}
                      weightKg={calcEntryWeight(effective.weight, effective.clip, entry, ammoTracking)}
                      onSetLoaded={() => handleSetLoaded(entry.id)}
                      onRemove={() => handleRemoveAmmo(entry.id)}
                      onUpdateClips={(qty) => handleUpdateEntry(entry.id, { clips: qty })}
                      onUpdateRounds={(qty) => handleUpdateEntry(entry.id, { rounds: qty })}
                      onSetLooseRounds={(qty) => handleUpdateEntry(entry.id, { clips: 0, rounds: qty })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {(attachmentRefs.length > 0 || visibleCompatible.length > 0) && (
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">
                  Attachments
                </span>
                {(editable ? visibleCompatible.length > 0 : attachmentRefs.length > 0 || visibleCompatible.length > 0) && (
                  <button
                    onClick={() => setShowAttachPicker(true)}
                    className="text-xs lg:text-sm text-red-500 hover:text-red-400"
                  >
                    {editable ? "+ Add" : "View"}
                  </button>
                )}
              </div>
              {attachmentRefs.length === 0 ? (
                <p className="text-xs lg:text-sm text-slate-600 italic">None fitted</p>
              ) : (
                <div className="space-y-1.5">
                  {attachmentRefs.map((upgrade) => (
                    <AttachmentCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      editable={editable}
                      onRemove={onRemoveAttachment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {showAttachPicker && (
            <AttachmentPicker
              compatibleUpgrades={visibleCompatible}
              editable={editable}
              onSelect={(id) => {
                onAddAttachment(id);
                setShowAttachPicker(false);
              }}
              onClose={() => setShowAttachPicker(false)}
            />
          )}

          {showAmmoPicker && (
            <AmmoPicker
              compatibleIds={weaponRef?.compatibleAmmoIds}
              existingNames={existingAmmoNames}
              editable={editable}
              onSelect={handleAddAmmo}
              onClose={() => setShowAmmoPicker(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
