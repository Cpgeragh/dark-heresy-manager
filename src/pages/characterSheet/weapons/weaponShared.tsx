// src/pages/characterSheet/weapons/weaponShared.tsx
// Shared display primitives: StatChip, DamageTypeChip,
// UpgradePicker, and related pure helpers.

import { useMemo, useState } from "react";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import type { WeaponUpgradeRef } from "../../../data/reference/weaponUpgradeReference";
import { PickerModal, PickerRow } from "../../../ui/PickerModal";
import { ArrowRight } from "../../../ui/PickerArrows";
import { formatWeightForDisplay } from "../../../ui/weightFormat";
import { TrashIcon } from "../../../ui/TrashIcon";
import {
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
} from "../../../ui/editableStyles";
import { uiIconRemoveButton, uiDismissButton } from "../../../ui/buttonStyles";
import { colourEmerald, colourEmeraldPlain, colourMeta } from "../../../ui/colourTokens";

export const WEAPON_QUALITY_OPTIONS = Object.keys(WEAPON_SPECIAL_RULES).sort((a, b) =>
  a.localeCompare(b)
);

export const DAMAGE_TYPE_OPTIONS = [
  { label: "Impact", value: "I" },
  { label: "Rending", value: "R" },
  { label: "Energy", value: "E" },
  { label: "Explosive", value: "X" },
] as const;

export const CUSTOM_AVAILABILITY_OPTIONS = [
  "Abundant",
  "Plentiful",
  "Common",
  "Average",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
] as const;

const PARAMETERIZED_WEAPON_QUALITIES = new Set(["Blast", "Felling", "Haywire", "Proven"]);

function baseQualityName(quality: string): string {
  return quality.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function sanitizeNonNegativeIntegerInput(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export function sanitizePositiveIntegerInput(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

export function sanitizeDiceInput(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^0-9d]/g, "");
  const [first = "", ...rest] = cleaned.split("d");
  return rest.length === 0 ? first : `${first}d${rest.join("")}`;
}

export function isValidDiceInput(value: string): boolean {
  const match = value.match(/^(\d+)d(\d+)$/i);
  if (!match) return false;
  return Number(match[1]) > 0 && Number(match[2]) > 0;
}

export function formatDamageInput(baseDice: string, plusValue: string, type: string): string {
  const plus = Number(plusValue || "0");
  const plusPart = plus > 0 ? `+${plus}` : "";
  return `${baseDice}${plusPart} ${type}`.trim();
}

export function useWeaponQualityPicker(selected: string[], onChange: (next: string[]) => void) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingQuality, setPendingQuality] = useState<string | null>(null);
  const [parameterValue, setParameterValue] = useState("");
  const available = useMemo(
    () => {
      const selectedBaseNames = new Set(selected.map(baseQualityName));
      return WEAPON_QUALITY_OPTIONS.filter((quality) => !selectedBaseNames.has(quality));
    },
    [selected]
  );
  const needsParameter = pendingQuality ? PARAMETERIZED_WEAPON_QUALITIES.has(pendingQuality) : false;
  const canConfirm = Boolean(pendingQuality) && (!needsParameter || parameterValue !== "");

  return {
    showPicker,
    available,
    pendingQuality,
    needsParameter,
    parameterValue,
    canConfirm,
    setParameterValue,
    openPicker: () => setShowPicker(true),
    closePicker: () => setShowPicker(false),
    pickQuality: (quality: string) => {
      setPendingQuality(quality);
      setParameterValue("");
      setShowPicker(false);
    },
    confirmPending: () => {
      if (!pendingQuality || !canConfirm) return;
      const nextQuality = needsParameter ? `${pendingQuality} (${parameterValue})` : pendingQuality;
      onChange([...selected, nextQuality]);
      setPendingQuality(null);
      setParameterValue("");
    },
  };
}

export function WeaponQualitySelector({
  selected,
  pendingQuality,
  needsParameter,
  parameterValue,
  canConfirm,
  onParameterValueChange,
  onOpenPicker,
  onConfirmPending,
  onRemove,
}: {
  selected: string[];
  pendingQuality: string | null;
  needsParameter: boolean;
  parameterValue: string;
  canConfirm: boolean;
  onParameterValueChange: (value: string) => void;
  onOpenPicker: () => void;
  onConfirmPending: () => void;
  onRemove: (quality: string) => void;
}) {
  return (
    <div className="col-span-2 space-y-2">
      <label className={uiFormLabel}>
        Qualities
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenPicker}
          className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-sm lg:text-base text-slate-200 text-left flex items-center justify-between"
        >
          <span className={pendingQuality ? "" : "text-slate-500"}>{pendingQuality ?? "Choose quality…"}</span>
          <ArrowRight />
        </button>
        {needsParameter && (
          <input
            type="text"
            inputMode="numeric"
            value={parameterValue}
            onChange={(event) => onParameterValueChange(sanitizePositiveIntegerInput(event.target.value))}
            aria-label={`${pendingQuality} value`}
            placeholder="Value"
            className="w-20 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-sm lg:text-base text-slate-200 focus:outline-none focus:border-red-500"
          />
        )}
        <button
          type="button"
          onClick={onConfirmPending}
          disabled={!canConfirm}
          className="px-3 lg:px-4 py-1 rounded border border-slate-500 bg-slate-800 text-sm lg:text-base text-slate-100 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((quality) => (
            <Chip key={quality} className="border-slate-600 bg-slate-800/80 text-slate-200">
              {quality}
              <button
                type="button"
                onClick={() => onRemove(quality)}
                aria-label={`Remove ${quality}`}
                className={uiDismissButton}
              >
                ×
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

export function StatChip({ label, value, size = "md" }: { label: string; value: string | number; size?: "sm" | "md" }) {
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-1.5 py-0.5 min-w-[32px] lg:min-w-[38px]">
        <span className={uiTextLabel}>{label}</span>
        <span className="text-xs font-code text-slate-200 mt-0.5">{value || "—"}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-2 py-0.5 min-w-[36px] lg:min-w-[44px]">
      <span className={uiTextLabel}>{label}</span>
      <span className="text-xs lg:text-sm font-code text-slate-200 mt-0.5">{value || "—"}</span>
    </div>
  );
}

// ─── Damage Type Helpers ──────────────────────────────────────────────────────

export function parseDamageType(
  damage: string
): { letter: string; label: string; colour: string } | null {
  const letter = damage.trim().slice(-1).toUpperCase();
  switch (letter) {
    case "I":
      return { letter: "I", label: "Impact", colour: "text-blue-400" };
    case "R":
      return { letter: "R", label: "Rending", colour: "text-red-400" };
    case "E":
      return { letter: "E", label: "Energy", colour: "text-orange-400" };
    case "X":
      return { letter: "X", label: "Explosive", colour: "text-yellow-400" };
    default:
      return null;
  }
}

export function DamageTypeChip({ damage, size = "md" }: { damage: string; size?: "sm" | "md" }) {
  const damageType = parseDamageType(damage);
  if (!damageType) return null;
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-1.5 py-0.5 min-w-[32px] lg:min-w-[38px]">
        <span className={uiTextLabel}>Type</span>
        <span className={`text-xs font-code mt-0.5 ${damageType.colour}`}>
          {damageType.label}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded border border-slate-700 px-2 py-0.5 min-w-[36px] lg:min-w-[44px]">
      <span className={uiTextLabel}>Type</span>
      <span className={`text-xs lg:text-sm font-code mt-0.5 ${damageType.colour}`}>
        {damageType.label}
      </span>
    </div>
  );
}

export function computeMeleeTotalDamage(damage: string, sb: number): string {
  const base = damage.replace(/\s*[IREX]$/i, "").trim();
  const match = base.match(/^(\d*d\d+)([+-]\d+)?$/i);
  if (!match) return base;
  const dice = match[1];
  const mod = match[2] ? parseInt(match[2], 10) : 0;
  const total = mod + sb;
  if (total === 0) return dice;
  return `${dice}${total > 0 ? "+" : ""}${total}`;
}

// ─── Equip Toggle ─────────────────────────────────────────────────────────────

export function EquipToggle({
  equipped,
  disabled,
  editable,
  onChange,
  labels = { equipped: "Equipped", unequipped: "Equip" },
}: {
  equipped: boolean;
  disabled: boolean;
  editable: boolean;
  onChange: () => void;
  labels?: { equipped: string; unequipped: string };
}) {
  if (!editable) {
    return equipped ? (
      <Chip size="sm" className={`${colourEmerald} uppercase tracking-wide shrink-0`}>
        {labels.equipped}
      </Chip>
    ) : null;
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled || equipped) onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled || equipped) onChange();
        }
      }}
      title={equipped ? "Click to stow" : disabled ? "Slots full" : "Click to equip"}
      className={`flex items-center gap-1 shrink-0 group transition ${
        disabled && !equipped ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${
          equipped
            ? colourEmerald
            : "border-slate-600 group-hover:border-slate-400"
        }`}
      >
        {equipped && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 10 10"
            fill="none"
            className="w-2 h-2"
          >
            <path
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M1.5 5l2.5 2.5 4.5-4.5"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-[10px] lg:text-xs uppercase tracking-wide ${
          equipped ? colourEmeraldPlain : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        {equipped ? labels.equipped : labels.unequipped}
      </span>
    </span>
  );
}

// ─── Special Rules Modal ──────────────────────────────────────────────────────

export function SpecialRulesContent({
  rules,
  description,
}: {
  rules: string;
  description?: string;
}) {
  const ruleNames = rules
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  return (
    <div className="space-y-4">
      {description && <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{description}</p>}
      {ruleNames.map((name) => {
        const desc = WEAPON_SPECIAL_RULES[name];
        return (
          <div key={name}>
            <p className="text-sm lg:text-base font-semibold text-amber-300">{name}</p>
            <p className={`text-sm lg:text-base ${uiTextBody} mt-1 leading-relaxed`}>{desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Upgrade Card ──────────────────────────────────────────────────────────

export function UpgradeCard({
  upgrade,
  editable,
  onRemove,
}: {
  upgrade: WeaponUpgradeRef;
  editable: boolean;
  onRemove: (upgradeId: string) => void;
}) {
  const displayedWeightModifier = formatWeightModifier(upgrade.weightModifier);

  return (
    <div className="bg-slate-800/60 rounded border border-slate-500 px-2 lg:px-3 py-1.5 lg:py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs lg:text-sm font-medium text-slate-300">{upgrade.name}</span>
        {editable && (
          <button
            onClick={() => onRemove(upgrade.id)}
            className={uiIconRemoveButton}
            aria-label={`Remove ${upgrade.name}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        <Chip size="sm" className={colourMeta}>
          <span className="leading-none">{"\u2696"}</span>
          <span className="leading-none">{displayedWeightModifier}</span>
        </Chip>
        <ItemMetaChips value={upgrade.value} availability={upgrade.availability} source={upgrade.source} size="sm" bare />
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={uiTextLabel}>Rules</span>
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title={upgrade.name}
            content={
              <div className="space-y-2">
                <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{upgrade.description}</p>
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>{upgrade.applicableTo}</p>
              </div>
            }
          />
        </span>
      </div>
    </div>
  );
}

// ─── Upgrade Picker ────────────────────────────────────────────────────────

export function UpgradePicker({
  compatibleUpgrades,
  editable = true,
  onSelect,
  onClose,
}: {
  compatibleUpgrades: WeaponUpgradeRef[];
  editable?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={editable ? "Add Upgrade" : "View Upgrades"}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={compatibleUpgrades.length === 0}
      emptyMessage="No compatible upgrades available."
      hideSearch
      footer={
        <button
          onClick={onClose}
          className="w-full py-1.5 lg:py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm lg:text-base text-slate-100"
        >
          Cancel
        </button>
      }
    >
      {compatibleUpgrades.map((upgrade) => (
        <PickerRow
          key={upgrade.id}
          interactive={editable}
          onClick={() => onSelect(upgrade.id)}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`${uiItemName} group-hover:text-white`}>
              {upgrade.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs lg:text-sm shrink-0">
              <Chip className={colourMeta}>
                <span className="leading-none">{"\u2696"}</span>
                <span className="leading-none">{formatWeightModifier(upgrade.weightModifier)}</span>
              </Chip>
              <ItemMetaChips value={upgrade.value} availability={upgrade.availability} source={upgrade.source} bare />
            </div>
          </div>
          <p className={`text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{upgrade.description}</p>
          <p className={`text-xs lg:text-sm ${uiTextPlaceholder} mt-1`}>{upgrade.applicableTo}</p>
        </PickerRow>
      ))}
    </PickerModal>
  );
}

function formatWeightModifier(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "0") {
    return "0 kg";
  }
  if (/^[+-]?\d+(?:\.\d+)?\s*(?:kg)?$/i.test(trimmed)) {
    return formatWeightForDisplay(trimmed);
  }
  return trimmed;
}
