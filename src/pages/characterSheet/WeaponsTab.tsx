// src/pages/characterSheet/WeaponsTab.tsx

import { useState, useCallback } from "react";
import type { RangedWeapon, MeleeWeapon, AmmoItem, GrenadeItem, CyberneticItem, ShieldItem } from "../../types/Character";
import { CYBERNETICS_REFERENCE, type CyberneticWeapon } from "../../data/reference/cyberneticsReference";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  GRENADE_REFERENCE,
  SHIELD_REFERENCE,
  type RangedWeaponRef,
  type MeleeWeaponRef,
  type GrenadeRef,
  type ShieldRef,
} from "../../data/reference/weaponReference";
import { WEAPON_SPECIAL_RULES } from "../../data/reference/weaponSpecialRules";
import {
  AMMO_REFERENCE,
  type AmmoRef,
} from "../../data/reference/ammoReference";
import {
  WEAPON_UPGRADE_REFERENCE,
  type WeaponUpgradeRef,
} from "../../data/reference/weaponUpgradeReference";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";
import { sourceColour } from "../../ui/sourceStyles";
import { InfoModal } from "../../components/InfoModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeaponsTabProps {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  ammo: AmmoItem[];
  grenades: GrenadeItem[];
  editable: boolean;
  strengthBonus: number;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
  onUpdateAmmo: (next: AmmoItem[]) => void;
  onUpdateGrenades: (next: GrenadeItem[]) => void;
  cybernetics?: CyberneticItem[];
  shields?: ShieldItem[];
  onUpdateShields?: (next: ShieldItem[]) => void;
}

type PickerTarget = "ranged" | "melee" | "ammo" | "grenades" | "shields" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rarityColour(rarity: string | undefined): string {
  switch (rarity) {
    case "Plentiful":
    case "Abundant":   return "text-slate-400";
    case "Common":     return "text-green-400";
    case "Average":    return "text-slate-300";
    case "Scarce":     return "text-yellow-400";
    case "Rare":       return "text-orange-400";
    case "Very Rare":  return "text-red-400";
    case "Extremely Rare": return "text-purple-400";
    case "Near Unique":    return "text-pink-400";
    case "Issued Only":    return "text-cyan-400";
    default:           return "text-slate-400";
  }
}

// ─── Attachment Stat Helpers ─────────────────────────────────────────────────

function modifyDamageBonus(damage: string, delta: number): string {
  const m = damage.trim().match(/^(\d*d\d+)([+-]\d+)?\s*([IREX])?$/i);
  if (!m) return damage;
  const dice = m[1];
  const bonus = (m[2] ? parseInt(m[2]) : 0) + delta;
  const type = m[3] ? ` ${m[3].toUpperCase()}` : "";
  if (bonus === 0) return `${dice}${type}`.trim();
  return `${dice}${bonus > 0 ? "+" : ""}${bonus}${type}`.trim();
}

function halveRange(range: string): string {
  const m = range.match(/^(\d+)m$/i);
  if (!m) return range;
  return `${Math.ceil(parseInt(m[1]) / 2)}m`;
}

function halveClip(clip: string): string {
  const n = parseInt(clip);
  return isNaN(n) ? clip : String(Math.max(1, Math.ceil(n / 2)));
}

function modifyPen(pen: string, delta: number): string {
  const n = parseInt(pen);
  return isNaN(n) ? pen : String(Math.max(0, n + delta));
}

function removeSpecialRule(rules: string, toRemove: string): string {
  const result = rules
    .split(",")
    .map(r => r.trim())
    .filter(r => r.toLowerCase() !== toRemove.toLowerCase())
    .filter(Boolean)
    .join(", ");
  return result || "—";
}

function effectiveRangedStats(
  weapon: RangedWeapon,
  attachmentRefs: WeaponUpgradeRef[]
): { damage: string; range: string; clip: string; pen: string; specialRules: string } {
  let damage = weapon.damage ?? "";
  let range = weapon.range ?? "";
  let clip = weapon.clip ?? "";
  let pen = weapon.pen ?? "";
  let specialRules = weapon.specialRules ?? "";
  for (const ref of attachmentRefs) {
    if (ref.id === "cr-compact") {
      damage = modifyDamageBonus(damage, -1);
      range = halveRange(range);
      clip = halveClip(clip);
    } else if (ref.id === "cr-extra-grip") {
      range = halveRange(range);
    } else if (ref.id === "cr-overcharge-pack") {
      damage = modifyDamageBonus(damage, +1);
      clip = halveClip(clip);
    }
  }
  return { damage, range, clip, pen, specialRules };
}

function effectiveMeleeStats(
  weapon: MeleeWeapon,
  attachmentRefs: WeaponUpgradeRef[]
): { pen: string; specialRules: string } {
  let pen = weapon.pen ?? "";
  let specialRules = weapon.specialRules ?? "";
  for (const ref of attachmentRefs) {
    if (ref.id === "cr-mono") {
      pen = modifyPen(pen, +2);
      specialRules = removeSpecialRule(specialRules, "Primitive");
    }
  }
  return { pen, specialRules };
}

function getCompatibleUpgrades(
  weaponClass: string,
  weaponName: string,
  isMelee: boolean,
  currentIds: string[]
): WeaponUpgradeRef[] {
  const cls = weaponClass.toLowerCase();
  const name = weaponName.toLowerCase();
  const hasSight = currentIds.some(
    id => id === "cr-red-dot-laser-sight" || id === "cr-telescopic-sight"
  );
  return WEAPON_UPGRADE_REFERENCE.filter(u => {
    if (currentIds.includes(u.id)) return false;
    switch (u.id) {
      case "cr-compact":
        return !isMelee && (cls === "pistol" || cls === "basic");
      case "cr-exterminator":
        return true;
      case "cr-extra-grip":
        return !isMelee && cls === "basic";
      case "cr-fire-selector":
        return !isMelee && (cls === "pistol" || cls === "basic");
      case "cr-melee-attachment":
        return !isMelee && cls === "basic";
      case "cr-mono":
        return isMelee;
      case "cr-overcharge-pack":
        return !isMelee && (cls === "pistol" || cls === "basic");
      case "cr-red-dot-laser-sight":
        return !isMelee && !hasSight && (cls === "pistol" || cls === "basic");
      case "cr-silencer":
        return !isMelee && (
          name.includes("stub") || name.includes("hand cannon") ||
          name.includes("autogun") || name.includes("hunting rifle")
        );
      case "cr-telescopic-sight":
        return !isMelee && !hasSight && cls === "basic";
      default:
        return false;
    }
  });
}

// ─── Special Rules Modal ──────────────────────────────────────────────────────

function SpecialRulesModal({
  rules,
  onClose,
}: {
  rules: string;
  onClose: () => void;
}) {
  const ruleNames = rules
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))  // strip parenthetical (e.g. "Blast (4)")
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

// ─── Attachment Picker ────────────────────────────────────────────────────────

function AttachmentPicker({
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {compatibleUpgrades.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No compatible upgrades available.</p>
          )}
          {compatibleUpgrades.map(upgrade => (
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

// ─── Reference Picker ─────────────────────────────────────────────────────────

function RangedPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: RangedWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = RANGED_WEAPON_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Ranged Weapon</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search weapons…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <span className="text-xs text-slate-500 shrink-0">{ref.class}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {ref.range} · {ref.rof} · {ref.damage} · Pen {ref.pen} · Clip {ref.clip}
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom weapon
          </button>
        </div>
      </div>
    </div>
  );
}

function MeleePicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: MeleeWeaponRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = MELEE_WEAPON_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Melee Weapon</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search weapons…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <span className="text-xs text-slate-500 shrink-0">
                  {ref.twoHanded ? "Two-Handed" : ref.class}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {ref.damage} · Pen {ref.pen}
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom weapon
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ammo Picker ─────────────────────────────────────────────────────────────

function AmmoPicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (ref: AmmoRef) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = AMMO_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.compatibleWith.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Ammunition</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search by name or weapon type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-400/80 font-mono">₮ {ref.cost}</span>
                  <span className="text-slate-500">×</span>
                  <span className="text-slate-200 font-mono">{ref.purchaseAmount}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 text-left">{ref.compatibleWith}</p>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-700">
          <button
            onClick={onCustom}
            className="w-full text-sm text-amber-400 hover:text-amber-300 text-center py-1"
          >
            + Add custom ammunition
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grenade Picker ───────────────────────────────────────────────────────────

function GrenadePicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: GrenadeRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = GRENADE_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Grenade</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search grenades…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <p className="px-4 pt-2 pb-1 text-xs text-slate-500 italic border-b border-slate-800">
          Range for all thrown grenades: SBx3 (Strength Bonus × 3 metres)
        </p>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs shrink-0">
                  <span className={rarityColour(ref.rarity)}>{ref.rarity}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-400/80 font-mono">₮ {ref.value}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {ref.damage !== "—" ? `${ref.damage}` : "No damage"} · Pen {ref.pen} · {ref.specialRules}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shield Picker ────────────────────────────────────────────────────────────

function ShieldPicker({
  onSelect,
  onClose,
}: {
  onSelect: (ref: ShieldRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = SHIELD_REFERENCE.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Add Shield</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>
        <div className="px-4 py-2 border-b border-slate-800">
          <input
            type="text"
            autoFocus
            placeholder="Search shields…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={editableInputClass(true)}
          />
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-slate-800">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">No matches.</p>
          )}
          {filtered.map((ref) => (
            <button
              key={ref.id}
              onClick={() => onSelect(ref)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {ref.name}
                </span>
                <span className="text-xs text-cyan-400 shrink-0 font-mono">AP {ref.ap}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {ref.locations} · {ref.damage} · Pen {ref.pen} · {ref.specialRules}
              </div>
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

// ─── Custom Weapon Forms ──────────────────────────────────────────────────────

function CustomRangedForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: RangedWeapon) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Omit<RangedWeapon, "id" | "custom">>({
    name: "", class: "", damage: "", pen: "", range: "", rof: "", clip: "", rld: "", specialRules: "",
  });

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Custom Ranged Weapon</p>
      <div className="grid grid-cols-2 gap-2">
        {(["name","class","range","rof","damage","pen","clip","rld","specialRules"] as const).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs text-slate-400 capitalize">{k === "rld" ? "Reload" : k}</label>
            <input
              type="text"
              value={fields[k] ?? ""}
              onChange={set(k)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAdd({ id: crypto.randomUUID(), custom: true, ...fields })}
          disabled={!fields.name?.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CustomMeleeForm({
  onAdd,
  onCancel,
}: {
  onAdd: (w: MeleeWeapon) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<Omit<MeleeWeapon, "id" | "custom">>({
    name: "", class: "", damage: "", pen: "", specialRules: "",
  });

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Custom Melee Weapon</p>
      <div className="grid grid-cols-2 gap-2">
        {(["name","class","damage","pen","specialRules"] as const).map((k) => (
          <div key={k} className={k === "name" || k === "specialRules" ? "col-span-2" : ""}>
            <label className="text-xs text-slate-400 capitalize">{k}</label>
            <input
              type="text"
              value={fields[k] ?? ""}
              onChange={set(k)}
              className={editableInputClass(true) + " mt-0.5"}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAdd({ id: crypto.randomUUID(), custom: true, ...fields })}
          disabled={!fields.name?.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-mono text-slate-200 mt-0.5">{value || "—"}</span>
    </div>
  );
}

function computeMeleeTotalDamage(damage: string, sb: number): string {
  const base = damage.replace(/\s*[IREX]$/i, "").trim();
  const match = base.match(/^(\d*d\d+)([+-]\d+)?$/i);
  if (!match) return base;
  const dice = match[1];
  const mod = match[2] ? parseInt(match[2], 10) : 0;
  const total = mod + sb;
  if (total === 0) return dice;
  return `${dice}${total > 0 ? "+" : ""}${total}`;
}

function parseDamageType(damage: string): { letter: string; label: string; colour: string } | null {
  const letter = damage.trim().slice(-1).toUpperCase();
  switch (letter) {
    case "I": return { letter: "I", label: "Impact",    colour: "text-blue-400" };
    case "R": return { letter: "R", label: "Rending",   colour: "text-red-400" };
    case "E": return { letter: "E", label: "Energy",    colour: "text-orange-400" };
    case "X": return { letter: "X", label: "Explosive", colour: "text-yellow-400" };
    default:  return null;
  }
}

function DamageTypeChip({ damage }: { damage: string }) {
  const dt = parseDamageType(damage);
  if (!dt) return null;
  return (
    <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">Type</span>
      <span className={`text-sm font-semibold mt-0.5 ${dt.colour}`}>{dt.label}</span>
    </div>
  );
}

function RangedCard({
  weapon,
  editable,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter(u => attachmentIds.includes(u.id));
  const effective = effectiveRangedStats(weapon, attachmentRefs);
  const compatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, attachmentIds);
  const hasRules = !!(effective.specialRules?.trim());

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          {weapon.class && (
            <p className="text-xs text-slate-500">{weapon.class}</p>
          )}
        </div>
        {editable && (
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 shrink-0">
            Remove
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="flex flex-wrap gap-1.5">
        {effective.range && <StatChip label="Range" value={effective.range} />}
        {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
        {effective.damage && <StatChip label="Damage" value={effective.damage.replace(/\s*[IREX]$/i, "").trim()} />}
        {effective.damage && <DamageTypeChip damage={effective.damage} />}
        {effective.pen && <StatChip label="Pen" value={effective.pen} />}
        {effective.clip && <StatChip label="Clip" value={effective.clip} />}
        {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
      </div>

      {/* Special rules */}
      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{effective.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {/* Weight / Value / Rarity / Source */}
      {(weapon.weight || weapon.value || weapon.rarity || weapon.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {weapon.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {weapon.weight}</span>}
          {weapon.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">₮ {weapon.value}</span>}
          {weapon.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(weapon.rarity)}`}>{weapon.rarity}</span>}
          {weapon.source && <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(weapon.source)}`}>{weapon.source}</span>}
        </div>
      )}

      {/* Attachments */}
      {(attachmentRefs.length > 0 || (editable && compatible.length > 0)) && (
        <div className="border-t border-slate-800 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Attachments</span>
            {editable && compatible.length > 0 && (
              <button
                onClick={() => setShowAttachPicker(true)}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                + Add
              </button>
            )}
          </div>
          {attachmentRefs.length === 0 ? (
            <p className="text-xs text-slate-600 italic">None fitted</p>
          ) : (
            <div className="space-y-1.5">
              {attachmentRefs.map(u => (
                <div
                  key={u.id}
                  className="bg-slate-800/60 rounded border border-slate-700 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-300">{u.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <InfoModal
                        title={u.name}
                        content={
                          <div className="space-y-2">
                            <p className="text-sm text-slate-300 leading-relaxed">{u.description}</p>
                            <p className="text-xs text-slate-500 italic">{u.applicableTo}</p>
                          </div>
                        }
                      />
                      {editable && (
                        <button
                          onClick={() => onRemoveAttachment(u.id)}
                          className="text-slate-500 hover:text-red-400 leading-none text-sm"
                          title={`Remove ${u.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.weightModifier !== "—" && (
                      <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-slate-400">
                        ⚖ {u.weightModifier}
                      </span>
                    )}
                    <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-amber-400/80 font-mono">
                      ₮ {u.value}
                    </span>
                    <span className={`text-[10px] rounded border bg-slate-900/40 px-1 py-0.5 font-mono ${sourceColour(u.source)}`}>
                      {u.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRules && effective.specialRules && (
        <SpecialRulesModal
          rules={effective.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}

      {showAttachPicker && (
        <AttachmentPicker
          compatibleUpgrades={compatible}
          onSelect={(id) => { onAddAttachment(id); setShowAttachPicker(false); }}
          onClose={() => setShowAttachPicker(false)}
        />
      )}
    </div>
  );
}

function MeleeCard({
  weapon,
  editable,
  strengthBonus,
  onRemove,
  onAddAttachment,
  onRemoveAttachment,
}: {
  weapon: MeleeWeapon;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => void;
  onAddAttachment: (upgradeId: string) => void;
  onRemoveAttachment: (upgradeId: string) => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const attachmentIds = weapon.attachments ?? [];
  const attachmentRefs = WEAPON_UPGRADE_REFERENCE.filter(u => attachmentIds.includes(u.id));
  const effective = effectiveMeleeStats(weapon, attachmentRefs);
  const compatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, true, attachmentIds);
  const hasRules = !!(effective.specialRules?.trim());

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          {weapon.class && (
            <p className="text-xs text-slate-500">{weapon.class}</p>
          )}
        </div>
        {editable && (
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300 shrink-0">
            Remove
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weapon.damage && <StatChip label="Damage" value={weapon.damage.replace(/\s*[IREX]$/i, "").trim()} />}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {effective.pen && <StatChip label="Pen" value={effective.pen} />}
        <StatChip label="SB" value={`+${strengthBonus}`} />
        {weapon.damage && (
          <StatChip label="Total" value={computeMeleeTotalDamage(weapon.damage, strengthBonus)} />
        )}
      </div>

      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{effective.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {/* Weight / Value / Rarity / Source */}
      {(weapon.weight || weapon.value || weapon.rarity || weapon.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {weapon.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {weapon.weight}</span>}
          {weapon.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">₮ {weapon.value}</span>}
          {weapon.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(weapon.rarity)}`}>{weapon.rarity}</span>}
          {weapon.source && <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(weapon.source)}`}>{weapon.source}</span>}
        </div>
      )}

      {/* Attachments */}
      {(attachmentRefs.length > 0 || (editable && compatible.length > 0)) && (
        <div className="border-t border-slate-800 pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Attachments</span>
            {editable && compatible.length > 0 && (
              <button
                onClick={() => setShowAttachPicker(true)}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                + Add
              </button>
            )}
          </div>
          {attachmentRefs.length === 0 ? (
            <p className="text-xs text-slate-600 italic">None fitted</p>
          ) : (
            <div className="space-y-1.5">
              {attachmentRefs.map(u => (
                <div
                  key={u.id}
                  className="bg-slate-800/60 rounded border border-slate-700 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-300">{u.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <InfoModal
                        title={u.name}
                        content={
                          <div className="space-y-2">
                            <p className="text-sm text-slate-300 leading-relaxed">{u.description}</p>
                            <p className="text-xs text-slate-500 italic">{u.applicableTo}</p>
                          </div>
                        }
                      />
                      {editable && (
                        <button
                          onClick={() => onRemoveAttachment(u.id)}
                          className="text-slate-500 hover:text-red-400 leading-none text-sm"
                          title={`Remove ${u.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.weightModifier !== "—" && (
                      <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-slate-400">
                        ⚖ {u.weightModifier}
                      </span>
                    )}
                    <span className="text-[10px] rounded border border-slate-700 bg-slate-900/40 px-1 py-0.5 text-amber-400/80 font-mono">
                      ₮ {u.value}
                    </span>
                    <span className={`text-[10px] rounded border bg-slate-900/40 px-1 py-0.5 font-mono ${sourceColour(u.source)}`}>
                      {u.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRules && effective.specialRules && (
        <SpecialRulesModal
          rules={effective.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}

      {showAttachPicker && (
        <AttachmentPicker
          compatibleUpgrades={compatible}
          onSelect={(id) => { onAddAttachment(id); setShowAttachPicker(false); }}
          onClose={() => setShowAttachPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Ammo Card ────────────────────────────────────────────────────────────────

function AmmoCard({
  item,
  editable,
  onRemove,
  onUpdateAmount,
}: {
  item: AmmoItem;
  editable: boolean;
  onRemove: () => void;
  onUpdateAmount: (amount: number) => void;
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState("");

  const startQtyEdit = () => {
    setQtyDraft(String(item.amount));
    setEditingQty(true);
  };

  const commitQtyEdit = () => {
    const val = parseInt(qtyDraft, 10);
    onUpdateAmount(!isNaN(val) && val >= 0 ? val : item.amount);
    setEditingQty(false);
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitQtyEdit();
    if (e.key === "Escape") setEditingQty(false);
  };
  return (
    <div className={sectionContainerClass(editable)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          {item.compatibleWith && (
            <span className="inline-block mt-0.5 text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              {item.compatibleWith}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(item.description || item.compatibleWith) && (
            <InfoModal
              title={item.name}
              content={
                <div className="space-y-2">
                  {item.compatibleWith && (
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Used with: </span>
                      {item.compatibleWith}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              }
            />
          )}
          {editable && (
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Qty</span>
        <div className="flex items-center gap-1.5">
          {editable && (
            <button
              onClick={() => onUpdateAmount(Math.max(0, item.amount - 1))}
              className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm leading-none flex items-center justify-center"
            >
              −
            </button>
          )}
          {editingQty ? (
            <input
              type="text"
              autoFocus
              value={qtyDraft}
              onChange={(e) => setQtyDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={commitQtyEdit}
              onKeyDown={handleQtyKeyDown}
              className="font-mono text-lg text-slate-100 w-16 text-center bg-slate-800 border border-slate-600 rounded focus:outline-none focus:border-indigo-500"
            />
          ) : (
            <span
              onClick={startQtyEdit}
              title="Click to set amount"
              className="font-mono text-lg text-slate-100 min-w-[2.5rem] text-center cursor-pointer hover:text-white hover:underline decoration-slate-500 decoration-dotted underline-offset-2"
            >
              {item.amount}
            </span>
          )}
          {editable && (
            <button
              onClick={() => onUpdateAmount(item.amount + 1)}
              className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm leading-none flex items-center justify-center"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Weight / Value / Rarity / Source */}
      {(item.weight || item.value || item.rarity || item.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-2">
          {item.weight && (
            <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
              ⚖ {item.weight}
            </span>
          )}
          {item.value && (() => {
            const parts = item.value!.split(" / ");
            if (parts.length === 2) {
              return (
                <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5">
                  <span className="text-amber-400/80 font-mono">₮ {parts[0]}</span>
                  <span className="text-slate-500"> × </span>
                  <span className="text-slate-200 font-mono">{parts[1]}</span>
                </span>
              );
            }
            return (
              <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
                ₮ {item.value}
              </span>
            );
          })()}
          {item.rarity && (
            <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity)}`}>
              {item.rarity}
            </span>
          )}
          {item.source && (
            <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}>
              {item.source}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grenade Card ─────────────────────────────────────────────────────────────

function GrenadeCard({
  item,
  editable,
  onRemove,
  onUpdateQty,
}: {
  item: GrenadeItem;
  editable: boolean;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState("");

  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const hasInfo = !!(ref?.description);

  const startQtyEdit = () => {
    setQtyDraft(String(item.quantity));
    setEditingQty(true);
  };
  const commitQtyEdit = () => {
    const val = parseInt(qtyDraft, 10);
    onUpdateQty(!isNaN(val) && val >= 0 ? val : item.quantity);
    setEditingQty(false);
  };
  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitQtyEdit();
    if (e.key === "Escape") setEditingQty(false);
  };

  return (
    <div className={sectionContainerClass(editable) + " space-y-2"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs text-slate-500">Thrown · Range SBx3</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasInfo && (
            <button
              onClick={() => setShowInfo(true)}
              title="View rules"
              className="text-slate-500 hover:text-slate-300 text-sm transition"
            >
              ⓘ
            </button>
          )}
          {editable && (
            <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Stat chips */}
      {(item.damage && item.damage !== "—") || (item.pen && item.pen !== "—") ? (
        <div className="flex flex-wrap gap-1.5">
          {item.damage && item.damage !== "—" && item.damage !== "Special" && (
            <>
              <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
              <DamageTypeChip damage={item.damage} />
            </>
          )}
          {item.damage === "Special" && (
            <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Damage</span>
              <span className="text-sm font-mono text-amber-400 mt-0.5">Special</span>
            </div>
          )}
          {item.pen && item.pen !== "—" && (
            <StatChip label="Pen" value={item.pen} />
          )}
        </div>
      ) : null}

      {/* Special rules */}
      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{item.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {/* Quantity row */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">Qty</span>
        <div className="flex items-center gap-1.5">
          {editable && (
            <button
              onClick={() => onUpdateQty(Math.max(0, item.quantity - 1))}
              className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm leading-none flex items-center justify-center"
            >
              −
            </button>
          )}
          {editingQty ? (
            <input
              type="text"
              autoFocus
              value={qtyDraft}
              onChange={(e) => setQtyDraft(e.target.value.replace(/\D/g, ""))}
              onBlur={commitQtyEdit}
              onKeyDown={handleQtyKeyDown}
              className="font-mono text-lg text-slate-100 w-16 text-center bg-slate-800 border border-slate-600 rounded focus:outline-none focus:border-indigo-500"
            />
          ) : (
            <span
              onClick={startQtyEdit}
              title="Click to set quantity"
              className="font-mono text-lg text-slate-100 min-w-[2.5rem] text-center cursor-pointer hover:text-white hover:underline decoration-slate-500 decoration-dotted underline-offset-2"
            >
              {item.quantity}
            </span>
          )}
          {editable && (
            <button
              onClick={() => onUpdateQty(item.quantity + 1)}
              className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm leading-none flex items-center justify-center"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Weight / Value / Rarity / Source */}
      {(item.weight || item.value || item.rarity || item.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {item.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {item.weight}</span>}
          {item.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-amber-400/80 font-mono">₮ {item.value}</span>}
          {item.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity)}`}>{item.rarity}</span>}
          {item.source && <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}>{item.source}</span>}
        </div>
      )}

      {showRules && item.specialRules && (
        <SpecialRulesModal rules={item.specialRules} onClose={() => setShowRules(false)} />
      )}

      {showInfo && ref?.description && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">{item.name}</h3>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-slate-300 leading-relaxed">{ref.description}</p>
            </div>
            <div className="px-4 py-3 border-t border-slate-700">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Ammo Form ─────────────────────────────────────────────────────────

function CustomAmmoForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: AmmoItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [compatibleWith, setCompatibleWith] = useState("");
  const [amount, setAmount] = useState(0);
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");
  const [rarity, setRarity] = useState("");

  return (
    <div className="border border-amber-500/30 bg-slate-900/60 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
        Custom Ammunition
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-slate-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hellfire Rounds"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400">
            Compatible With{" "}
            <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={compatibleWith}
            onChange={(e) => setCompatibleWith(e.target.value)}
            placeholder="e.g. Bolt, SP Pistol"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400">Starting Amount</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">
            Weight <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 0.5 kg"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">
            Value <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 30 Thrones"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-400">
            Rarity <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            placeholder="e.g. Scarce"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onAdd({
              id: crypto.randomUUID(),
              name: name.trim(),
              compatibleWith: compatibleWith.trim() || undefined,
              amount,
              weight: weight.trim() || undefined,
              value: value.trim() || undefined,
              rarity: rarity.trim() || undefined,
            })
          }
          disabled={!name.trim()}
          className="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm text-slate-900 font-semibold"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Cybernetic Weapon Card ───────────────────────────────────────────────────

function CyberneticWeaponCard({
  cyberneticName,
  weapon,
}: {
  cyberneticName: string;
  weapon: CyberneticWeapon;
}) {
  const [showRules, setShowRules] = useState(false);
  const hasRules = !!(weapon.specialRules?.trim());

  return (
    <div className="border border-cyan-700/40 bg-cyan-900/10 rounded-lg p-3 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          <span className="text-[10px] uppercase tracking-wide text-cyan-400 border border-cyan-700/50 rounded px-1.5 py-0.5 font-medium">
            Cybernetic
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {cyberneticName}{weapon.class ? ` · ${weapon.class}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weapon.type === "ranged" && weapon.range && <StatChip label="Range"  value={weapon.range} />}
        {weapon.type === "ranged" && weapon.rof   && <StatChip label="RoF"    value={weapon.rof}   />}
        {weapon.damage && (
          <StatChip label="Damage" value={weapon.damage.replace(/\s*[IREX]$/i, "").trim()} />
        )}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {weapon.pen    && <StatChip label="Pen"    value={weapon.pen}    />}
        {weapon.type === "ranged" && weapon.clip && <StatChip label="Clip"   value={weapon.clip}   />}
        {weapon.type === "ranged" && weapon.rld  && <StatChip label="Reload" value={weapon.rld}    />}
      </div>

      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{weapon.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {showRules && weapon.specialRules && (
        <SpecialRulesModal
          rules={weapon.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
}

// ─── Shield Card ──────────────────────────────────────────────────────────────

function ShieldCard({
  item,
  editable,
  onRemove,
}: {
  item: ShieldItem;
  editable: boolean;
  onRemove: () => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");

  return (
    <div className={sectionContainerClass(editable) + " space-y-3"}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          <p className="text-xs text-slate-500">
            Shield{item.locations ? ` · ${item.locations}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.notes && (
            <InfoModal
              title={item.name}
              content={<p className="text-sm text-slate-300 leading-relaxed">{item.notes}</p>}
            />
          )}
          {editable && (
            <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-300">
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-1.5">
        {/* AP chip — cyan to distinguish from weapon damage */}
        <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 py-1 min-w-[52px]">
          <span className="text-[10px] text-cyan-500 uppercase tracking-wide">AP</span>
          <span className="text-sm font-mono text-cyan-300 mt-0.5">{item.ap}</span>
        </div>
        {item.damage && (
          <StatChip label="Bash" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
        )}
        {item.damage && <DamageTypeChip damage={item.damage} />}
        {item.pen && <StatChip label="Pen" value={item.pen} />}
      </div>

      {/* Special rules */}
      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">{item.specialRules}</span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {/* Weight / Value / Rarity / Source */}
      {(item.weight || item.value || item.rarity || item.source) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {item.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {item.weight}</span>}
          {item.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-amber-400/80 font-mono">₮ {item.value}</span>}
          {item.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(item.rarity)}`}>{item.rarity}</span>}
          {item.source && <span className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(item.source)}`}>{item.source}</span>}
        </div>
      )}

      {showRules && item.specialRules && (
        <SpecialRulesModal rules={item.specialRules} onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeaponsTab({
  rangedWeapons,
  meleeWeapons,
  ammo,
  grenades,
  editable,
  strengthBonus,
  onUpdateRanged,
  onUpdateMelee,
  onUpdateAmmo,
  onUpdateGrenades,
  cybernetics,
  shields,
  onUpdateShields,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);

  // ── Cybernetic weapons ─────────────────────────────────────────────────────
  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((c) => {
    const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
    if (!ref?.weapon) return [];
    return [{ cybernetic: c, weapon: ref.weapon }];
  });
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);
  const [showCustomAmmo, setShowCustomAmmo] = useState(false);

  // ── Grenade handlers ───────────────────────────────────────────────────────

  const addFromGrenadeRef = useCallback(
    (ref: GrenadeRef) => {
      if (!editable) return;
      onUpdateGrenades([
        ...grenades,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          class: ref.class,
          damage: ref.damage,
          pen: ref.pen,
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, grenades, onUpdateGrenades]
  );

  const removeGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.filter((g) => g.id !== id));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const updateGrenadeQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => (g.id === id ? { ...g, quantity } : g)));
    },
    [editable, grenades, onUpdateGrenades]
  );

  // ── Add handlers ───────────────────────────────────────────────────────────

  const addFromRangedRef = useCallback(
    (ref: RangedWeaponRef) => {
      if (!editable) return;
      onUpdateRanged([
        ...rangedWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.class,
          range: ref.range,
          rof: ref.rof,
          damage: ref.damage,
          pen: String(ref.pen),
          clip: String(ref.clip),
          rld: ref.reload,
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef) => {
      if (!editable) return;
      onUpdateMelee([
        ...meleeWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.twoHanded ? "Melee (Two-Handed)" : ref.class,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addCustomRanged = useCallback(
    (w: RangedWeapon) => {
      if (!editable) return;
      onUpdateRanged([...rangedWeapons, w]);
      setShowCustomRanged(false);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addCustomMelee = useCallback(
    (w: MeleeWeapon) => {
      if (!editable) return;
      onUpdateMelee([...meleeWeapons, w]);
      setShowCustomMelee(false);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  // ── Remove handlers ────────────────────────────────────────────────────────

  const removeRanged = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...rangedWeapons];
      next.splice(index, 1);
      onUpdateRanged(next);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeMelee = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...meleeWeapons];
      next.splice(index, 1);
      onUpdateMelee(next);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addFromAmmoRef = useCallback(
    (ref: AmmoRef) => {
      if (!editable) return;
      const numericAmount = Number(ref.purchaseAmount);
      onUpdateAmmo([
        ...ammo,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          compatibleWith: ref.compatibleWith,
          amount: Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 1,
          value: `${ref.cost} / ${ref.purchaseAmount}`,
          rarity: ref.rarity,
          source: ref.source,
          description: ref.description,
        },
      ]);
      setPicker(null);
    },
    [editable, ammo, onUpdateAmmo]
  );

  const addCustomAmmo = useCallback(
    (item: AmmoItem) => {
      if (!editable) return;
      onUpdateAmmo([...ammo, item]);
      setShowCustomAmmo(false);
    },
    [editable, ammo, onUpdateAmmo]
  );

  const removeAmmo = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateAmmo(ammo.filter((a) => a.id !== id));
    },
    [editable, ammo, onUpdateAmmo]
  );

  const updateAmmoAmount = useCallback(
    (id: string, amount: number) => {
      if (!editable) return;
      onUpdateAmmo(ammo.map((a) => (a.id === id ? { ...a, amount } : a)));
    },
    [editable, ammo, onUpdateAmmo]
  );

  const addAttachmentToRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map(w =>
        w.id === weaponId
          ? { ...w, attachments: [...(w.attachments ?? []), upgradeId] }
          : w
      ));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeAttachmentFromRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map(w =>
        w.id === weaponId
          ? { ...w, attachments: (w.attachments ?? []).filter(id => id !== upgradeId) }
          : w
      ));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addAttachmentToMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map(w =>
        w.id === weaponId
          ? { ...w, attachments: [...(w.attachments ?? []), upgradeId] }
          : w
      ));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const removeAttachmentFromMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map(w =>
        w.id === weaponId
          ? { ...w, attachments: (w.attachments ?? []).filter(id => id !== upgradeId) }
          : w
      ));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addFromShieldRef = useCallback(
    (ref: ShieldRef) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields([
        ...(shields ?? []),
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          ap: ref.ap,
          locations: ref.locations,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          notes: ref.notes,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
        },
      ]);
      setPicker(null);
    },
    [editable, shields, onUpdateShields]
  );

  const removeShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields((shields ?? []).filter((s) => s.id !== id));
    },
    [editable, shields, onUpdateShields]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 text-slate-300">
      <h2 className="text-xl font-semibold">Weapons</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── RANGED ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">Ranged</h3>
            {editable && !showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {rangedWeapons.length === 0 && !showCustomRanged && (
            <p className="text-sm text-slate-500 italic">No ranged weapons.</p>
          )}

          {rangedWeapons.map((w, i) => (
            <RangedCard
              key={w.id}
              weapon={w}
              editable={editable}
              onRemove={() => removeRanged(i)}
              onAddAttachment={(upgradeId) => addAttachmentToRanged(w.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromRanged(w.id, upgradeId)}
            />
          ))}

          {showCustomRanged && (
            <CustomRangedForm
              onAdd={addCustomRanged}
              onCancel={() => setShowCustomRanged(false)}
            />
          )}
        </section>

        {/* ── MELEE ──────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">Melee</h3>
            {editable && !showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {meleeWeapons.length === 0 && !showCustomMelee && (
            <p className="text-sm text-slate-500 italic">No melee weapons.</p>
          )}

          {meleeWeapons.map((w, i) => (
            <MeleeCard
              key={w.id}
              weapon={w}
              editable={editable}
              strengthBonus={strengthBonus}
              onRemove={() => removeMelee(i)}
              onAddAttachment={(upgradeId) => addAttachmentToMelee(w.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromMelee(w.id, upgradeId)}
            />
          ))}

          {showCustomMelee && (
            <CustomMeleeForm
              onAdd={addCustomMelee}
              onCancel={() => setShowCustomMelee(false)}
            />
          )}
        </section>

      </div>

      {/* ── SHIELDS ─────────────────────────────────────────────────────── */}
      {((shields ?? []).length > 0 || editable) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200">
              Shields
            </h3>
            {editable && (
              <button
                onClick={() => setPicker("shields")}
                className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {(shields ?? []).length === 0 && (
            <p className="text-sm text-slate-500 italic">No shields carried.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(shields ?? []).map((item) => (
              <ShieldCard
                key={item.id}
                item={item}
                editable={editable}
                onRemove={() => removeShield(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── AMMUNITION ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200">
            Ammunition ({ammo.length})
          </h3>
          {editable && !showCustomAmmo && (
            <button
              onClick={() => setPicker("ammo")}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
        </div>

        {ammo.length === 0 && !showCustomAmmo && (
          <p className="text-sm text-slate-500 italic">No ammunition tracked.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ammo.map((item) => (
            <AmmoCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeAmmo(item.id)}
              onUpdateAmount={(amount) => updateAmmoAmount(item.id, amount)}
            />
          ))}
        </div>

        {showCustomAmmo && (
          <CustomAmmoForm
            onAdd={addCustomAmmo}
            onCancel={() => setShowCustomAmmo(false)}
          />
        )}
      </section>

      {/* ── GRENADES ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200">
            Grenades ({grenades.length})
          </h3>
          {editable && (
            <button
              onClick={() => setPicker("grenades")}
              className="text-xs px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
        </div>

        {grenades.length === 0 && (
          <p className="text-sm text-slate-500 italic">No grenades carried.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {grenades.map((item) => (
            <GrenadeCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeGrenade(item.id)}
              onUpdateQty={(qty) => updateGrenadeQty(item.id, qty)}
            />
          ))}
        </div>
      </section>

      {/* ── CYBERNETIC WEAPONS ──────────────────────────────────────────── */}
      {cyberneticWeaponItems.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-slate-200">Cybernetic Weapons</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granted by installed implants — managed in the Cybernetics tab.
              Melee damage shown before Strength Bonus.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cyberneticWeaponItems.map(({ cybernetic, weapon }) => (
              <CyberneticWeaponCard
                key={cybernetic.id}
                cyberneticName={cybernetic.name}
                weapon={weapon}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Pickers ─────────────────────────────────────────────────────── */}
      {picker === "ranged" && (
        <RangedPicker
          onSelect={addFromRangedRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomRanged(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "melee" && (
        <MeleePicker
          onSelect={addFromMeleeRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomMelee(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "ammo" && (
        <AmmoPicker
          onSelect={addFromAmmoRef}
          onCustom={() => {
            setPicker(null);
            setShowCustomAmmo(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "grenades" && (
        <GrenadePicker
          onSelect={addFromGrenadeRef}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "shields" && (
        <ShieldPicker
          onSelect={addFromShieldRef}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
