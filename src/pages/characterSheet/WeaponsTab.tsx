// src/pages/characterSheet/WeaponsTab.tsx

import { useState, useCallback } from "react";
import type { RangedWeapon, MeleeWeapon } from "../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  type RangedWeaponRef,
  type MeleeWeaponRef,
} from "../../data/reference/weaponReference";
import { WEAPON_SPECIAL_RULES } from "../../data/reference/weaponSpecialRules";
import {
  editableInputClass,
  sectionContainerClass,
} from "../../ui/editableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeaponsTabProps {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  editable: boolean;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
}

type PickerTarget = "ranged" | "melee" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rarityColour(rarity: string | undefined): string {
  switch (rarity) {
    case "Plentiful":
    case "Abundant":
    case "Common":     return "text-slate-400";
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
  );

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
  );

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
      <span className={`text-sm font-semibold mt-0.5 ${dt.colour}`} title={dt.label}>{dt.letter}</span>
    </div>
  );
}

function RangedCard({
  weapon,
  editable,
  onRemove,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const hasRules = !!(weapon.specialRules?.trim());

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
        {weapon.range && <StatChip label="Range" value={weapon.range} />}
        {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
        {weapon.damage && <StatChip label="Damage" value={weapon.damage} />}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
        {weapon.clip && <StatChip label="Clip" value={weapon.clip} />}
        {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
      </div>

      {/* Special rules */}
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

      {/* Weight / Value / Rarity */}
      {(weapon.weight || weapon.value || weapon.rarity) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {weapon.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {weapon.weight}</span>}
          {weapon.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">₮ {weapon.value}</span>}
          {weapon.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(weapon.rarity)}`}>{weapon.rarity}</span>}
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

function MeleeCard({
  weapon,
  editable,
  onRemove,
}: {
  weapon: MeleeWeapon;
  editable: boolean;
  onRemove: () => void;
}) {
  const [showRules, setShowRules] = useState(false);
  const hasRules = !!(weapon.specialRules?.trim());

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
        {weapon.damage && <StatChip label="Damage" value={weapon.damage} />}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
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

      {/* Weight / Value / Rarity */}
      {(weapon.weight || weapon.value || weapon.rarity) && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
          {weapon.weight && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">⚖ {weapon.weight}</span>}
          {weapon.value  && <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">₮ {weapon.value}</span>}
          {weapon.rarity && <span className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(weapon.rarity)}`}>{weapon.rarity}</span>}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeaponsTab({
  rangedWeapons,
  meleeWeapons,
  editable,
  onUpdateRanged,
  onUpdateMelee,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);

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
              onRemove={() => removeMelee(i)}
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
    </div>
  );
}
