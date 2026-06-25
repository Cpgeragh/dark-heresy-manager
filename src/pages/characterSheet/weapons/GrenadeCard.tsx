// src/pages/characterSheet/weapons/GrenadeCard.tsx
// GrenadePicker and GrenadeCard — co-located for navigability.

import { useState, useEffect } from "react";
import type { GrenadeItem } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { GRENADE_REFERENCE, type GrenadeRef } from "../../../data/reference/weaponReference";
import {
  editableInputClass,
  editableTextareaClass,
  uiActionButtonCompact,
  uiSection,
  uiSectionHeader,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiTextSubtle,
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { PickerModal } from "../../../ui/PickerModal";
import { sourceColour } from "../../../ui/sourceStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  EquipToggle,
  WeaponQualitySelector,
  DAMAGE_TYPE_OPTIONS,
  CUSTOM_AVAILABILITY_OPTIONS,
  formatDamageInput,
  isValidDiceInput,
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
  sanitizePositiveIntegerInput,
} from "./weaponShared";

const CUSTOM_GRENADE_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;
const CUSTOM_GRENADE_TYPE_OPTIONS = ["Grenade", "Mine"] as const;

export const EXPLOSIVE_MISHAPS_CONTENT = (
  <div className="space-y-3">
    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
      Whenever a jam results from throwing a grenade or firing a grenade, something unfortunate has
      happened. Roll on the table below to find out the results.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm lg:text-base border-collapse">
        <thead>
          <tr className={`${uiTextLabel} border-b border-slate-700`}>
            <th className="py-1.5 pr-3 font-medium">Roll</th>
            <th className="py-1.5 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/60">
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>1-5</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">Dud.</span> The explosive or round
              fails to explode and, in the case of grenade launchers, the weapon must be reloaded
              before it can fire.
            </td>
          </tr>
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>6-8</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">"It might be ok…"</span> Nothing
              happens. Roll again on this table next round.
            </td>
          </tr>
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>9-0</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">BOOM!</span> The round or explosive
              detonates immediately. Centre the effect on the character. If this was the result of
              firing a grenade launcher, the grenade detonates in the barrel, having its normal
              effect as well as destroying the weapon.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Grenade Picker ───────────────────────────────────────────────────────────

export function GrenadePicker({
  editable = true,
  strengthBonus,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
}: {
  editable?: boolean;
  strengthBonus: number;
  customLibraryItems?: CampaignCustomItem<"weapon">[];
  onSelect: (ref: GrenadeRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"weapon">) => void;
  onCustom?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = GRENADE_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.weaponKind === "grenade")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  const thrownRange = `${Math.max(0, strengthBonus) * 3}m`;

  return (
    <PickerModal
      title={editable ? "Add Grenade" : "View Grenades"}
      placeholder="Search grenades…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={filtered.length === 0 && filteredCustomLibraryItems.length === 0}
      footer={
        editable && onCustom ? (
          <button
            onClick={onCustom}
            className="w-full text-sm lg:text-base text-red-500 hover:text-red-400 text-center py-1 lg:py-1.5"
          >
            + Add custom grenade or mine
          </button>
        ) : undefined
      }
      filterRow={
        <p className={`text-xs lg:text-sm ${uiTextBody} italic`}>
          Range for all thrown grenades: {thrownRange}
        </p>
      }
    >
      {filteredCustomLibraryItems.map((item) => {
        const data = item.data;
        if (data.weaponKind !== "grenade") return null;
        return (
          <div
            key={`custom-${item.id}`}
            role="button"
            tabIndex={editable ? 0 : -1}
            onClick={editable && onSelectCustom ? () => onSelectCustom(item) : undefined}
            className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
              >
                {item.name}
              </span>
              <span
                className={[
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                  item.status === "published"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : item.status === "draft"
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                      : "border-slate-500/50 bg-slate-800 text-slate-300",
                ].join(" ")}
              >
                {item.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
            </div>
            <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
              <span>{data.type ?? "Grenade"}</span>
              <span>Range {thrownRange}</span>
              <span className={uiTextMuted}>{data.damage !== "—" ? data.damage : "No damage"}</span>
              <span className={uiTextMuted}>Pen {data.pen}</span>
            </div>
            {data.specialRules && data.specialRules !== "—" && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={uiTextLabel}>Qualities</span>
                <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{data.specialRules}</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title={`${data.name} Qualities`} content={<SpecialRulesContent rules={data.specialRules} />} />
                </span>
              </div>
            )}
            {data.description && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={uiTextLabel}>Rules</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title={data.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{data.description}</p>} />
                </span>
              </div>
            )}
          </div>
        );
      })}
      {filtered.map((ref) => (
        <div
          key={ref.id}
          role="button"
          tabIndex={editable ? 0 : -1}
          onClick={editable ? () => onSelect(ref) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <span
            className={`text-sm lg:text-base font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}
          >
            {ref.name}
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
          </div>
          <div className={`flex items-center gap-2 text-xs lg:text-sm ${uiTextMuted} mt-0.5 flex-wrap font-code`}>
            <span>{ref.type ?? "Grenade"}</span>
            <span>Range {thrownRange}</span>
            <span className={uiTextMuted}>{ref.damage !== "—" ? ref.damage : "No damage"}</span>
            <span className={uiTextMuted}>Pen {ref.pen}</span>
          </div>
          {ref.specialRules && ref.specialRules !== "—" && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{ref.specialRules}</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={`${ref.name} Qualities`} content={<SpecialRulesContent rules={ref.specialRules} />} />
              </span>
            </div>
          )}
          {ref.description && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={ref.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.description}</p>} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}

// ─── Grenade Card ─────────────────────────────────────────────────────────────

function isCustomGrenadeType(
  value: string | undefined
): value is (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number] {
  return CUSTOM_GRENADE_TYPE_OPTIONS.includes(value as (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]);
}

function isCustomGrenadeOrigin(
  value: string | undefined
): value is (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number] {
  return CUSTOM_GRENADE_ORIGIN_OPTIONS.includes(value as (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number]);
}

function parseInitialGrenadeDamage(damage: string | undefined): {
  mode: "damage" | "special" | "none";
  base: string;
  plus: string;
  type: (typeof DAMAGE_TYPE_OPTIONS)[number]["value"];
} {
  if (!damage || damage === "—") {
    return { mode: "none", base: "1d10", plus: "0", type: "X" };
  }
  if (damage === "Special") {
    return { mode: "special", base: "1d10", plus: "0", type: "X" };
  }

  const match = damage.trim().match(/^(\d+d\d+)(?:\+(\d+))?\s+([IREX])$/i);
  if (!match) return { mode: "damage", base: "1d10", plus: "0", type: "X" };

  return {
    mode: "damage",
    base: match[1],
    plus: match[2] ?? "0",
    type: match[3].toUpperCase() as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"],
  };
}

export function CustomGrenadeForm({
  title = "Custom Grenade or Mine",
  submitLabel = "Add",
  initialGrenade,
  onAdd,
  onCancel,
}: {
  title?: string;
  submitLabel?: string;
  initialGrenade?: GrenadeItem;
  onAdd: (item: GrenadeItem) => void;
  onCancel: () => void;
}) {
  const initialDamage = parseInitialGrenadeDamage(initialGrenade?.damage);
  const [name, setName] = useState(initialGrenade?.name ?? "");
  const [type, setType] = useState<"" | (typeof CUSTOM_GRENADE_TYPE_OPTIONS)[number]>(
    isCustomGrenadeType(initialGrenade?.type) ? initialGrenade.type : ""
  );
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_GRENADE_ORIGIN_OPTIONS)[number]>(
    isCustomGrenadeOrigin(initialGrenade?.source) ? initialGrenade.source : ""
  );
  const [availability, setAvailability] = useState(initialGrenade?.availability ?? "");
  const [damageMode, setDamageMode] = useState<"damage" | "special" | "none">(initialDamage.mode);
  const [damageBase, setDamageBase] = useState(initialDamage.base);
  const [damagePlus, setDamagePlus] = useState(initialDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    initialDamage.type
  );
  const [pen, setPen] = useState(initialGrenade?.pen ?? "0");
  const [quantity, setQuantity] = useState(initialGrenade?.quantity ? String(initialGrenade.quantity) : "");
  const [weight, setWeight] = useState(initialGrenade?.weight ?? "");
  const [value, setValue] = useState(initialGrenade?.value ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialGrenade?.specialRules && initialGrenade.specialRules !== "—"
      ? initialGrenade.specialRules.split(",").map((rule) => rule.trim()).filter(Boolean)
      : []
  );
  const [description, setDescription] = useState(initialGrenade?.description ?? "");

  const damage =
    damageMode === "none"
      ? "—"
      : damageMode === "special"
        ? "Special"
        : formatDamageInput(damageBase, damagePlus, damageType);
  const canAdd =
    Boolean(name.trim()) &&
    Boolean(type) &&
    Boolean(origin) &&
    Boolean(availability) &&
    (damageMode !== "damage" || isValidDiceInput(damageBase)) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(quantity) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addGrenade = () => {
    if (!canAdd || !type || !origin) return;
    onAdd({
      id: initialGrenade?.id ?? crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      quantity: Number(quantity),
      type,
      class: "Thrown",
      damage,
      pen,
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      description: description.trim() || undefined,
      equipped: initialGrenade?.equipped,
      customLibraryId: initialGrenade?.customLibraryId,
      customLibraryVersionId: initialGrenade?.customLibraryVersionId,
    });
  };

  return (
    <PickerModal
      title={title}
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
            <Button className="flex-1" onClick={addGrenade} disabled={!canAdd}>
              {submitLabel}
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
              <input value={name} onChange={(event) => setName(event.target.value)} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Type <span className="text-red-500">*</span>
              </label>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className={editableInputClass(true) + " mt-0.5"}>
                <option value="">Choose type</option>
                {CUSTOM_GRENADE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(sanitizePositiveIntegerInput(event.target.value))} placeholder="1+" className={editableInputClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_GRENADE_ORIGIN_OPTIONS.map((option) => (
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

        <p className={uiSectionHeader}>Combat</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-3 gap-1.5">
            {(["damage", "special", "none"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDamageMode(option)}
                className={`rounded border px-2 py-1 text-xs lg:text-sm capitalize transition ${
                  damageMode === option
                    ? "border-slate-400 bg-slate-700/70 text-slate-100"
                    : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {option === "none" ? "No damage" : option}
              </button>
            ))}
          </div>
          {damageMode === "damage" && (
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input value={damageBase} onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))} className={editableInputClass(true)} />
                <input type="text" inputMode="numeric" value={damagePlus} onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true)} />
                <select value={damageType} onChange={(event) => setDamageType(event.target.value as typeof damageType)} className={editableInputClass(true)}>
                  {DAMAGE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
              Pen <span className="text-red-500">*</span>
            </label>
            <input type="text" inputMode="numeric" value={pen} onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
          </div>
        </div>

        <p className={uiSectionHeader}>Details</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Weight <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="decimal" value={weight} onChange={(event) => setWeight(sanitizeWeightInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Cost <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={value} onChange={(event) => setValue(sanitizeMoneyInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Availability <span className="text-red-500">*</span>
              </label>
              <select value={availability} onChange={(event) => setAvailability(event.target.value)} className={editableInputClass(true) + " mt-0.5"}>
                <option value="">Choose availability</option>
                {CUSTOM_AVAILABILITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
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
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className={editableTextareaClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}

export function GrenadeCard({
  item,
  editable,
  strengthBonus,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  onUpdateQty,
  isEquipped = false,
  onToggleEquip,
  canEquipMoreTypes = true,
  isStowedCard = false,
}: {
  item: GrenadeItem;
  editable: boolean;
  strengthBonus: number;
  libraryItem?: CampaignCustomItem<"weapon">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  canEquipMoreTypes?: boolean;
  isStowedCard?: boolean;
}) {
  const [expanded, setExpanded] = useState(!isStowedCard && isEquipped);
  useEffect(() => {
    if (!isStowedCard) setExpanded(isEquipped);
  }, [isEquipped, isStowedCard]);

  // ── Stowed overflow card — read-only, always collapsed ────────────────────
  if (isStowedCard) {
    return (
      <div className={uiSection + " opacity-60"}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm lg:text-base font-semibold text-slate-400 truncate">{item.name}</p>
            <p className={`text-xs lg:text-sm ${uiTextSubtle}`}>Stowed · {item.quantity} remaining</p>
          </div>
          <Chip size="sm" className="border-slate-600 bg-slate-800/40 text-slate-300 shrink-0">
            Stowed
          </Chip>
        </div>
      </div>
    );
  }

  // ── Regular card ──────────────────────────────────────────────────────────
  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const rulesDescription = ref?.description ?? item.description;
  const hasInfo = !!rulesDescription;
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const equippedCount = isEquipped ? Math.min(item.quantity, 3) : item.quantity;
  const showMishaps = item.type !== "Mine";
  const thrownRange = `${Math.max(0, strengthBonus) * 3}m`;

  return (
    <div className={uiSection + " space-y-2"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm lg:text-base font-semibold text-slate-200 truncate">{item.name}</p>
            {libraryItem && (
              <span
                className={[
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                  libraryItem.status === "published"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : libraryItem.status === "draft"
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                      : "border-slate-500/50 bg-slate-800 text-slate-300",
                ].join(" ")}
              >
                {libraryItem.status}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className="border-amber-500/60 bg-amber-500/10 text-amber-300">
              Thrown
            </Chip>
            {isEquipped && (
              <Chip size="sm" className="border-emerald-500/60 bg-emerald-500/10 text-emerald-300">
                {equippedCount} ready
              </Chip>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={!isEquipped && !canEquipMoreTypes}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
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
          {editable && expanded && (
            <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
              Remove
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {(canEditDefinition || isDM) && libraryItem && (
            <div className="flex flex-wrap gap-2">
              {canEditDefinition && libraryItem.status !== "archived" && (
                <button type="button" onClick={onEditDefinition} className={uiActionButtonCompact}>
                  Edit Definition
                </button>
              )}
              {isDM && libraryItem.status === "draft" && (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={busyAction === "publish"}
                  className={`${uiActionButtonCompact} disabled:opacity-50`}
                >
                  {busyAction === "publish" ? "Publishing..." : "Publish"}
                </button>
              )}
              {isDM && libraryItem.status !== "archived" && (
                <button
                  type="button"
                  onClick={onArchive}
                  disabled={busyAction === "archive"}
                  className={`${uiActionButtonCompact} disabled:opacity-50`}
                >
                  {busyAction === "archive" ? "Archiving..." : "Archive"}
                </button>
              )}
              {isDM && libraryItem.status === "published" && (
                <button
                  type="button"
                  onClick={onUpdateAllCopies}
                  disabled={busyAction === "updateAll"}
                  className={`${uiActionButtonCompact} disabled:opacity-50`}
                >
                  {busyAction === "updateAll" ? "Updating..." : "Update All Copies"}
                </button>
              )}
            </div>
          )}

          {/* Stat chips */}
          <div className="flex flex-wrap gap-1.5">
            <StatChip label="Range" value={thrownRange} />
            {(!item.damage || item.damage === "—") && (
              <StatChip label="Damage" value="—" />
            )}
            {item.damage && item.damage !== "—" && item.damage !== "Special" && (
              <>
                <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
                <DamageTypeChip damage={item.damage} />
              </>
            )}
            {item.damage === "Special" && (
              <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
                <span className={uiTextLabel}>Damage</span>
                <span className="text-sm lg:text-base font-code text-amber-400 mt-0.5">Special</span>
              </div>
            )}
            <StatChip label="Pen" value={item.pen && item.pen !== "—" ? item.pen : "—"} />
          </div>

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                {hasRules ? item.specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {hasInfo ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{rulesDescription}</p>
                    }
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className={uiTextLabel}>Mishaps</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title="Explosive Mishaps" content={EXPLOSIVE_MISHAPS_CONTENT} />
                </span>
              </div>
            )}
          </div>

          {/* Quantity row */}
          <div className="flex items-center gap-3 pt-1">
            <span className={`text-xs lg:text-sm ${uiTextMuted} uppercase tracking-wide`}>Qty</span>
            <QuantityControl
              quantity={item.quantity}
              editable={editable}
              size="lg"
              onUpdate={onUpdateQty}
            />
            {isEquipped && item.quantity > 3 && (
              <span className={`text-[10px] lg:text-xs ${uiTextMuted} italic ml-1`}>3 ready, rest stowed</span>
            )}
          </div>

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </>
      )}
    </div>
  );
}
