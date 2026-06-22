// src/pages/characterSheet/weapons/weaponShared.tsx
// Shared display primitives: StatChip, DamageTypeChip,
// AttachmentPicker, and related pure helpers.

import { useMemo, useState } from "react";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { rarityColour, sourceColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import type { WeaponUpgradeRef } from "../../../data/reference/weaponUpgradeReference";
import { PickerModal } from "../../../ui/PickerModal";
import { formatWeightForDisplay } from "../../../ui/weightFormat";
import { formatMoneyForDisplay } from "../../../ui/moneyFormat";

export const WEAPON_QUALITY_OPTIONS = Object.keys(WEAPON_SPECIAL_RULES).sort((a, b) =>
  a.localeCompare(b)
);

export const DAMAGE_TYPE_OPTIONS = [
  { label: "Impact", value: "I" },
  { label: "Rending", value: "R" },
  { label: "Energy", value: "E" },
  { label: "Explosive", value: "X" },
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

export function WeaponQualitySelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [pending, setPending] = useState("");
  const [parameterValue, setParameterValue] = useState("");
  const available = useMemo(
    () => {
      const selectedBaseNames = new Set(selected.map(baseQualityName));
      return WEAPON_QUALITY_OPTIONS.filter((quality) => !selectedBaseNames.has(quality));
    },
    [selected]
  );
  const pendingQuality = pending && available.includes(pending) ? pending : available[0] ?? "";
  const needsParameter = PARAMETERIZED_WEAPON_QUALITIES.has(pendingQuality);
  const canAdd = Boolean(pendingQuality && (!needsParameter || parameterValue));

  return (
    <div className="col-span-2 space-y-2">
      <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
        Qualities
      </label>
      <div className="flex gap-2">
        <select
          value={pendingQuality}
          onChange={(event) => {
            setPending(event.target.value);
            setParameterValue("");
          }}
          className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-sm lg:text-base text-slate-200 focus:outline-none focus:border-red-500"
        >
          {available.map((quality) => (
            <option key={quality} value={quality}>
              {quality}
            </option>
          ))}
        </select>
        {needsParameter && (
          <input
            type="text"
            inputMode="numeric"
            value={parameterValue}
            onChange={(event) => setParameterValue(sanitizePositiveIntegerInput(event.target.value))}
            aria-label={`${pendingQuality} value`}
            placeholder="Value"
            className="w-20 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-sm lg:text-base text-slate-200 focus:outline-none focus:border-red-500"
          />
        )}
        <button
          type="button"
          onClick={() => {
            if (!canAdd) return;
            const nextQuality = needsParameter
              ? `${pendingQuality} (${parameterValue})`
              : pendingQuality;
            onChange([...selected, nextQuality]);
            setPending("");
            setParameterValue("");
          }}
          disabled={!canAdd}
          className="px-3 lg:px-4 py-1 rounded border border-slate-500 bg-slate-800 text-sm lg:text-base text-slate-100 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => onChange(selected.filter((item) => item !== quality))}
              className="rounded border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-xs lg:text-sm text-slate-200 transition hover:border-red-500 hover:text-red-400"
            >
              {quality} <span aria-hidden="true" className="text-slate-500">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
      <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm lg:text-base font-code text-slate-200 mt-0.5">{value || "—"}</span>
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

export function DamageTypeChip({ damage }: { damage: string }) {
  const damageType = parseDamageType(damage);
  if (!damageType) return null;
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
      <span className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wide">Type</span>
      <span className={`text-sm lg:text-base font-semibold mt-0.5 ${damageType.colour}`}>
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
      <span className="text-[10px] lg:text-xs text-green-400 border border-green-700/50 rounded px-1.5 lg:px-2 py-0.5 font-medium uppercase tracking-wide shrink-0">
        {labels.equipped}
      </span>
    ) : null;
  }
  return (
    <button
      onClick={!disabled || equipped ? onChange : undefined}
      disabled={disabled && !equipped}
      title={equipped ? "Click to stow" : disabled ? "Slots full" : "Click to equip"}
      className={`flex items-center gap-1 shrink-0 group transition ${
        disabled && !equipped ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${
          equipped
            ? "border-green-600 bg-green-500/20"
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
              stroke="#4ade80"
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
          equipped ? "text-green-400" : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        {equipped ? labels.equipped : labels.unequipped}
      </span>
    </button>
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
      {description && <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{description}</p>}
      {ruleNames.map((name) => {
        const desc = WEAPON_SPECIAL_RULES[name];
        return (
          <div key={name}>
            <p className="text-sm lg:text-base font-semibold text-amber-300">{name}</p>
            <p className="text-sm lg:text-base text-slate-300 mt-1 leading-relaxed">{desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Attachment Card ──────────────────────────────────────────────────────────

export function AttachmentCard({
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
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center -translate-y-[1.4px]">
            <InfoModal
              title={upgrade.name}
              content={
                <div className="space-y-2">
                  <p className="text-sm lg:text-base text-slate-300 leading-relaxed">{upgrade.description}</p>
                  <p className="text-xs lg:text-sm text-slate-500 italic">{upgrade.applicableTo}</p>
                </div>
              }
            />
          </span>
          {editable && (
            <button
              onClick={() => onRemove(upgrade.id)}
              className="text-slate-500 hover:text-red-400 leading-none text-sm lg:text-base"
              title={`Remove ${upgrade.name}`}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        <span className="text-[10px] lg:text-xs rounded border border-slate-700 bg-slate-900/40 px-1 lg:px-1.5 py-0.5 text-slate-400">
          ⚖ {displayedWeightModifier}
        </span>
        <span className="text-[10px] lg:text-xs rounded border border-slate-700 bg-slate-900/40 px-1 lg:px-1.5 py-0.5 text-amber-400/80">
          {formatMoneyForDisplay(upgrade.value)}
        </span>
        <span
          className={`text-[10px] lg:text-xs rounded border bg-slate-900/40 px-1 lg:px-1.5 py-0.5 font-code ${sourceColour(upgrade.source)}`}
        >
          {upgrade.source}
        </span>
      </div>
    </div>
  );
}

// ─── Attachment Picker ────────────────────────────────────────────────────────

export function AttachmentPicker({
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
      title={editable ? "Add Attachment" : "View Attachments"}
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
        <button
          key={upgrade.id}
          onClick={editable ? () => onSelect(upgrade.id) : undefined}
          className={`w-full text-left px-4 lg:px-5 py-3 lg:py-4 transition group ${
            editable ? "hover:bg-slate-800" : "cursor-default"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm lg:text-base font-medium text-slate-200 group-hover:text-white">
              {upgrade.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs lg:text-sm shrink-0">
              <span className={rarityColour(upgrade.rarity)}>{upgrade.rarity}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/80">{formatMoneyForDisplay(upgrade.value)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">⚖ {formatWeightModifier(upgrade.weightModifier)}</span>
            </div>
          </div>
          <p className="text-xs lg:text-sm text-slate-400 leading-relaxed">{upgrade.description}</p>
          <p className="text-xs lg:text-sm text-slate-600 mt-1 italic">{upgrade.applicableTo}</p>
        </button>
      ))}
    </PickerModal>
  );
}

function formatWeightModifier(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "â€”" || trimmed === "0") {
    return "0 kg";
  }
  if (/^[+-]?\d+(?:\.\d+)?\s*(?:kg)?$/i.test(trimmed)) {
    return formatWeightForDisplay(trimmed);
  }
  return trimmed;
}
