// src/pages/characterSheet/weapons/weaponShared.tsx
// Shared display primitives: StatChip, DamageTypeChip, SpecialRulesModal,
// AttachmentPicker, and related pure helpers.

import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { rarityColour, sourceColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import type { WeaponUpgradeRef } from "../../../data/reference/weaponUpgradeReference";

// ─── Stat Chip ────────────────────────────────────────────────────────────────

export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-mono text-slate-200 mt-0.5">{value || "—"}</span>
    </div>
  );
}

// ─── Damage Type Helpers ──────────────────────────────────────────────────────

export function parseDamageType(
  damage: string
): { letter: string; label: string; colour: string } | null {
  const letter = damage.trim().slice(-1).toUpperCase();
  switch (letter) {
    case "I": return { letter: "I", label: "Impact",    colour: "text-blue-400" };
    case "R": return { letter: "R", label: "Rending",   colour: "text-red-400" };
    case "E": return { letter: "E", label: "Energy",    colour: "text-orange-400" };
    case "X": return { letter: "X", label: "Explosive", colour: "text-yellow-400" };
    default:  return null;
  }
}

export function DamageTypeChip({ damage }: { damage: string }) {
  const damageType = parseDamageType(damage);
  if (!damageType) return null;
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">Type</span>
      <span className={`text-sm font-semibold mt-0.5 ${damageType.colour}`}>{damageType.label}</span>
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

// ─── Special Rules Modal ──────────────────────────────────────────────────────

export function SpecialRulesModal({
  rules,
  onClose,
}: {
  rules: string;
  onClose: () => void;
}) {
  const ruleNames = rules
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Special Rules</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-500 font-mono">{rules}</p>
          {ruleNames.map((name) => {
            const desc = WEAPON_SPECIAL_RULES[name];
            return (
              <div key={name}>
                <p className="text-sm font-semibold text-amber-300">{name}</p>
                {desc ? (
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{desc}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic mt-1">
                    No description available — consult the source book.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
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
  return (
    <div className="bg-slate-800/60 rounded border border-slate-700 px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{upgrade.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <InfoModal
            title={upgrade.name}
            content={
              <div className="space-y-2">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {upgrade.description}
                </p>
                <p className="text-xs text-slate-500 italic">
                  {upgrade.applicableTo}
                </p>
              </div>
            }
          />
          {editable && (
            <button
              onClick={() => onRemove(upgrade.id)}
              className="text-slate-500 hover:text-red-400 leading-none text-sm"
              title={`Remove ${upgrade.name}`}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {upgrade.weightModifier !== "—" && (
          <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-slate-400">
            ⚖ {upgrade.weightModifier}
          </span>
        )}
        <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-amber-400/80 font-mono">
          ₮ {upgrade.value}
        </span>
        <span
          className={`text-[10px] rounded border bg-slate-900/40 px-1 py-0.5 font-mono ${sourceColour(upgrade.source)}`}
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
  onSelect,
  onClose,
}: {
  compatibleUpgrades: WeaponUpgradeRef[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Attachment</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {compatibleUpgrades.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">
              No compatible upgrades available.
            </p>
          )}
          {compatibleUpgrades.map((upgrade) => (
            <button
              key={upgrade.id}
              onClick={() => onSelect(upgrade.id)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {upgrade.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <span className={rarityColour(upgrade.rarity)}>{upgrade.rarity}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-400/80 font-mono">₮ {upgrade.value}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{upgrade.weightModifier}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{upgrade.description}</p>
              <p className="text-xs text-slate-600 mt-1 italic">{upgrade.applicableTo}</p>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
