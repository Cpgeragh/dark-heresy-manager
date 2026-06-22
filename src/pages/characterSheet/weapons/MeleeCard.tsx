// src/pages/characterSheet/weapons/MeleeCard.tsx
// MeleePicker, CustomMeleeForm, MeleeCard — co-located for navigability.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import {
  MELEE_WEAPON_REFERENCE,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import { editableInputClass, editableTextareaClass, uiSection, uiSectionHeader } from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { sourceColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import {
  StatChip,
  DamageTypeChip,
  computeMeleeTotalDamage,
  SpecialRulesContent,
  AttachmentPicker,
  AttachmentCard,
  EquipToggle,
  WeaponQualitySelector,
  DAMAGE_TYPE_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
} from "./weaponShared";
import { effectiveMeleeStats, getCompatibleUpgrades } from "./weaponHelpers";

const WEAPON_CRAFTSMANSHIP_OPTIONS: WeaponCraftsmanship[] = ["Poor", "Common", "Good", "Best"];

const WEAPON_CRAFTSMANSHIP_STYLE: Record<WeaponCraftsmanship, string> = {
  Poor: "border-red-500/70 bg-red-500/15 text-red-300",
  Common: "border-slate-500 bg-slate-800 text-slate-200",
  Good: "border-emerald-500/70 bg-emerald-500/15 text-emerald-300",
  Best: "border-amber-400 bg-amber-500/20 text-amber-300",
};

const CUSTOM_MELEE_CLASS_OPTIONS = ["Melee", "Melee (Two-Handed)", "Melee / Thrown"] as const;
const CUSTOM_WEAPON_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

function meleeCraftsmanshipDescription(craftsmanship: WeaponCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poor melee weapons incur a -10 penalty to Tests made to attack.";
    case "Good":
      return "Good melee weapons add a +5 bonus to Tests made to attack.";
    case "Best":
      return "Best melee weapons add a +10 bonus to Tests made to attack and add 1 to the Damage they inflict.";
    case "Common":
    default:
      return "Common craftsmanship melee weapons have no additional modifier.";
  }
}

function hasMultipleMeleeProfiles(damage?: string): boolean {
  return !!damage && /\bLow:\s|\bHigh:\s|;/.test(damage);
}

function displayMeleeDamage(damage: string): string {
  return hasMultipleMeleeProfiles(damage) ? damage : damage.replace(/\s*[IREX]$/i, "").trim();
}

// ─── Melee Picker ─────────────────────────────────────────────────────────────

export function MeleePicker({
  editable = true,
  onSelect,
  onCustom,
  onClose,
  references = MELEE_WEAPON_REFERENCE,
  title = "Add Melee Weapon",
  placeholder = "Search weapons…",
  showCustom = true,
}: {
  editable?: boolean;
  onSelect: (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship) => void;
  onCustom: () => void;
  onClose: () => void;
  references?: MeleeWeaponRef[];
  title?: string;
  placeholder?: string;
  showCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MeleeWeaponRef | null>(null);
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
            {meleeCraftsmanshipDescription(craftsmanship)}
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
            <span>{ref.twoHanded ? "Two-Handed" : ref.class}</span>
            <span>{ref.damage}</span>
            <span>Pen {ref.pen}</span>
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

// ─── Custom Melee Form ────────────────────────────────────────────────────────

export function CustomMeleeForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: MeleeWeapon) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [weaponClass, setWeaponClass] = useState("");
  const [craftsmanship, setCraftsmanship] = useState<"" | WeaponCraftsmanship>("");
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_WEAPON_ORIGIN_OPTIONS)[number]>("");
  const [damageBase, setDamageBase] = useState("1d10");
  const [damagePlus, setDamagePlus] = useState("0");
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>("R");
  const [pen, setPen] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(weaponClass) &&
    Boolean(craftsmanship) &&
    Boolean(origin) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addWeapon = () => {
    if (!canAdd || !craftsmanship || !origin) return;
    onAdd({
      id: crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      class: weaponClass,
      craftsmanship,
      source: origin,
      damage: formatDamageInput(damageBase, damagePlus, damageType),
      pen,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      description: description.trim() || undefined,
      quantity: weaponClass.toLowerCase().includes("thrown") ? 1 : undefined,
    });
  };

  return (
    <PickerModal
      title="Custom Melee Weapon"
      query=""
      onQueryChange={() => {}}
      onClose={onCancel}
      isEmpty={false}
      hideSearch
      maxHeight="max-h-[92vh]"
      footer={
        <div className="space-y-2">
          {!canAdd && (
            <p className="text-xs lg:text-sm text-slate-300"><span className="text-red-500">*</span> Required</p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addWeapon} disabled={!canAdd}>
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
      }
    >
      <div className="p-4 lg:p-5 space-y-4">
        <p className={uiSectionHeader}>Identity</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={weaponClass}
                onChange={(event) => setWeaponClass(event.target.value)}
                className={editableInputClass(true) + " mt-0.5"}
              >
                <option value="">Choose class</option>
                {CUSTOM_MELEE_CLASS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Craftsmanship & Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="space-y-1">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Craftsmanship <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEAPON_CRAFTSMANSHIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCraftsmanship(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    craftsmanship === option
                      ? WEAPON_CRAFTSMANSHIP_STYLE[option]
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Origin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CUSTOM_WEAPON_ORIGIN_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOrigin(option)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    origin === option
                      ? `${sourceColour(option)} bg-slate-800/70 font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Combat</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input
                  type="text"
                  value={damageBase}
                  onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))}
                  placeholder="1d10"
                  className={editableInputClass(true)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={damagePlus}
                  onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))}
                  placeholder="Plus"
                  className={editableInputClass(true)}
                />
                <select
                  value={damageType}
                  onChange={(event) =>
                    setDamageType(event.target.value as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"])
                  }
                  className={editableInputClass(true)}
                >
                  {DAMAGE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Pen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pen}
                onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Weight <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Cost <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))}
                className={editableInputClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Rules</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <WeaponQualitySelector selected={selectedQualities} onChange={setSelectedQualities} />

            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Rules
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className={editableTextareaClass(true) + " mt-0.5"}
              />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}

// ─── Melee Card ───────────────────────────────────────────────────────────────

export function MeleeCard({
  weapon,
  editable,
  strengthBonus,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
  onUpdateQuantity,
  allowAttachments = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
}: {
  weapon: MeleeWeapon;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
  onUpdateQuantity: (qty: number) => void;
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

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    attachmentIds.includes(upgrade.id)
  );
  const weaponRef = weapon.referenceId
    ? MELEE_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : undefined;
  // Prefer reference specialRules as source of truth; avoids stale stored character data
  const baseWeapon = weaponRef ? { ...weapon, specialRules: weaponRef.specialRules } : weapon;
  const effective = effectiveMeleeStats(baseWeapon, attachmentRefs);
  const hasMultipleProfiles = hasMultipleMeleeProfiles(weapon.damage);
  const addableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, true, attachmentIds);
  const viewableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, true, []);
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
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-" && rulesText !== "â€”"
  );
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;
  const craftsmanship = weapon.craftsmanship ?? "Common";
  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");

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
          <div className="flex flex-wrap gap-1.5">
            {weapon.damage && <StatChip label="Damage" value={displayMeleeDamage(weapon.damage)} />}
            {weapon.damage && !hasMultipleProfiles && <DamageTypeChip damage={weapon.damage} />}
            {effective.pen && <StatChip label="Pen" value={effective.pen} />}
            <StatChip label="SB" value={`+${strengthBonus}`} />
            {weapon.damage && !hasMultipleProfiles && (
              <StatChip
                label="Total"
                value={computeMeleeTotalDamage(weapon.damage, strengthBonus)}
              />
            )}
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
                  content={meleeCraftsmanshipDescription(craftsmanship)}
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

          {isThrown && (
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Quantity</span>
              <QuantityControl
                quantity={weapon.quantity ?? 1}
                editable={editable}
                size="sm"
                onUpdate={onUpdateQuantity}
              />
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
        </>
      )}
    </div>
  );
}
