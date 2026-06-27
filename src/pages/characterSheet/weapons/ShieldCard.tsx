// src/pages/characterSheet/weapons/ShieldCard.tsx
// ShieldPicker and ShieldCard — co-located for navigability.

import { useState, useEffect } from "react";
import type { ShieldItem } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { SHIELD_REFERENCE, type ShieldRef } from "../../../data/reference/weaponReference";
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
} from "../../../ui/editableStyles";
import { Button } from "../../../ui/Button";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal } from "../../../ui/PickerModal";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { sourceColour } from "../../../ui/sourceStyles";
import { formatWeightInput, sanitizeWeightInput } from "../../../ui/weightFormat";
import { formatMoneyInput, sanitizeMoneyInput } from "../../../ui/moneyFormat";
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
} from "./weaponShared";

const CUSTOM_SHIELD_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

// ─── Shield Picker ────────────────────────────────────────────────────────────

export function ShieldPicker({
  editable = true,
  customLibraryItems = [],
  onSelect,
  onSelectCustom,
  onCustom,
  onClose,
}: {
  editable?: boolean;
  customLibraryItems?: CampaignCustomItem<"armour">[];
  onSelect: (ref: ShieldRef) => void;
  onSelectCustom?: (item: CampaignCustomItem<"armour">) => void;
  onCustom?: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase();
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(normalizedQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredCustomLibraryItems = customLibraryItems
    .filter((item) => item.data.armourKind === "shield")
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PickerModal
      title={editable ? "Add Shield" : "View Shields"}
      placeholder="Search shields…"
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
            + Add custom shield
          </button>
        ) : undefined
      }
    >
      {filteredCustomLibraryItems.map((item) => {
        const data = item.data;
        if (data.armourKind !== "shield") return null;
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
              <StatChip size="sm" label="AP" value={String(data.ap)} />
              {data.locations && <StatChip size="sm" label="Location" value={data.locations} />}
              {data.damage && <StatChip size="sm" label="Dmg" value={data.damage} />}
              {data.pen && <StatChip size="sm" label="Pen" value={data.pen} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <ItemMetaChips weight={data.weight} value={data.value} availability={data.availability} source={data.source} />
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
            {data.notes && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={uiTextLabel}>Rules</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title={data.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{data.notes}</p>} />
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
            <StatChip size="sm" label="AP" value={String(ref.ap)} />
            {ref.locations && <StatChip size="sm" label="Location" value={ref.locations} />}
            {ref.damage && <StatChip size="sm" label="Dmg" value={ref.damage} />}
            {ref.pen && <StatChip size="sm" label="Pen" value={ref.pen} />}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <ItemMetaChips weight={ref.weight} value={ref.value} availability={ref.availability} source={ref.source} />
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
          {ref.notes && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={uiTextLabel}>Rules</span>
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={ref.name} content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ref.notes}</p>} />
              </span>
            </div>
          )}
        </div>
      ))}
    </PickerModal>
  );
}

// ─── Shield Card ──────────────────────────────────────────────────────────────

function isCustomShieldOrigin(
  value: string | undefined
): value is (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number] {
  return CUSTOM_SHIELD_ORIGIN_OPTIONS.includes(value as (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number]);
}

function parseInitialShieldDamage(damage: string | undefined): {
  base: string;
  plus: string;
  type: (typeof DAMAGE_TYPE_OPTIONS)[number]["value"];
} {
  const match = damage?.trim().match(/^(\d+d\d+)(?:\+(\d+))?\s+([IREX])$/i);
  if (!match) return { base: "1d10", plus: "0", type: "I" };

  return {
    base: match[1],
    plus: match[2] ?? "0",
    type: match[3].toUpperCase() as (typeof DAMAGE_TYPE_OPTIONS)[number]["value"],
  };
}

export function CustomShieldForm({
  title = "Custom Shield",
  submitLabel = "Add",
  initialShield,
  onAdd,
  onCancel,
}: {
  title?: string;
  submitLabel?: string;
  initialShield?: ShieldItem;
  onAdd: (item: ShieldItem) => void;
  onCancel: () => void;
}) {
  const initialDamage = parseInitialShieldDamage(initialShield?.damage);
  const [name, setName] = useState(initialShield?.name ?? "");
  const [origin, setOrigin] = useState<"" | (typeof CUSTOM_SHIELD_ORIGIN_OPTIONS)[number]>(
    isCustomShieldOrigin(initialShield?.source) ? initialShield.source : ""
  );
  const [availability, setAvailability] = useState(initialShield?.availability ?? "");
  const [ap, setAp] = useState(initialShield?.ap !== undefined ? String(initialShield.ap) : "");
  const [locations, setLocations] = useState(initialShield?.locations ?? "");
  const [damageBase, setDamageBase] = useState(initialDamage.base);
  const [damagePlus, setDamagePlus] = useState(initialDamage.plus);
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPE_OPTIONS)[number]["value"]>(
    initialDamage.type
  );
  const [pen, setPen] = useState(initialShield?.pen ?? "0");
  const [weight, setWeight] = useState(initialShield?.weight ?? "");
  const [value, setValue] = useState(initialShield?.value ?? "");
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialShield?.specialRules && initialShield.specialRules !== "—"
      ? initialShield.specialRules.split(",").map((rule) => rule.trim()).filter(Boolean)
      : []
  );
  const [notes, setNotes] = useState(initialShield?.notes ?? "");

  const canAdd =
    Boolean(name.trim()) &&
    Boolean(origin) &&
    Boolean(availability) &&
    Boolean(ap) &&
    Boolean(locations.trim()) &&
    isValidDiceInput(damageBase) &&
    Boolean(damagePlus) &&
    Boolean(pen) &&
    Boolean(weight.trim()) &&
    Boolean(value);

  const addShield = () => {
    if (!canAdd || !origin) return;
    onAdd({
      id: initialShield?.id ?? crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      ap: Number(ap),
      locations: locations.trim(),
      damage: formatDamageInput(damageBase, damagePlus, damageType),
      pen,
      specialRules: selectedQualities.length > 0 ? selectedQualities.join(", ") : undefined,
      notes: notes.trim() || undefined,
      weight: formatWeightInput(weight),
      value: formatMoneyInput(value),
      availability,
      source: origin,
      equipped: initialShield?.equipped,
      customLibraryId: initialShield?.customLibraryId,
      customLibraryVersionId: initialShield?.customLibraryVersionId,
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
            <Button className="flex-1" onClick={addShield} disabled={!canAdd}>
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
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Locations <span className="text-red-500">*</span>
              </label>
              <input value={locations} onChange={(event) => setLocations(event.target.value)} placeholder="Arm & Body" className={editableInputClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>

        <p className={uiSectionHeader}>Origin</p>
        <div className={uiSection + " space-y-3"}>
          <div className="grid grid-cols-2 gap-1.5">
            {CUSTOM_SHIELD_ORIGIN_OPTIONS.map((option) => (
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                AP <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={ap} onChange={(event) => setAp(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Pen <span className="text-red-500">*</span>
              </label>
              <input type="text" inputMode="numeric" value={pen} onChange={(event) => setPen(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true) + " mt-0.5"} />
            </div>
            <div className="col-span-2">
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Bash Damage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                <input value={damageBase} onChange={(event) => setDamageBase(sanitizeDiceInput(event.target.value))} className={editableInputClass(true)} />
                <input type="text" inputMode="numeric" value={damagePlus} onChange={(event) => setDamagePlus(sanitizeNonNegativeIntegerInput(event.target.value))} className={editableInputClass(true)} />
                <select value={damageType} onChange={(event) => setDamageType(event.target.value as typeof damageType)} className={editableInputClass(true)}>
                  {DAMAGE_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
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
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={editableTextareaClass(true) + " mt-0.5"} />
            </div>
          </div>
        </div>
      </div>
    </PickerModal>
  );
}

export function ShieldCard({
  item,
  editable,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
}: {
  item: ShieldItem;
  editable: boolean;
  libraryItem?: CampaignCustomItem<"armour">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className={uiSection + " space-y-3"}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</p>
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
          <p className={`text-xs lg:text-sm ${uiTextMuted}`}>
            Shield{item.locations ? ` · ${item.locations}` : ""}
          </p>
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
          {libraryItem && (
            <CustomItemActionButtons
              className="flex flex-wrap gap-2"
              libraryItem={libraryItem}
              isDM={isDM}
              canEditDefinition={canEditDefinition}
              busyAction={busyAction}
              onEditDefinition={onEditDefinition}
              onPublish={onPublish}
              onArchive={onArchive}
              onUpdateAllCopies={onUpdateAllCopies}
            />
          )}

          {/* Stats — AP chip in cyan to distinguish from weapon damage */}
          <div className="flex flex-wrap gap-1.5">
            <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
              <span className="text-[10px] lg:text-xs text-cyan-500 uppercase tracking-wide">AP</span>
              <span className="text-sm lg:text-base font-code text-cyan-300 mt-0.5">{item.ap}</span>
            </div>
            {item.damage && (
              <StatChip label="Bash" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {item.damage && <DamageTypeChip damage={item.damage} />}
            {item.pen && <StatChip label="Pen" value={item.pen} />}
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
              {item.notes ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{item.notes}</p>}
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
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
