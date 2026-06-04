// src/pages/characterSheet/WeaponsTab.tsx
// Orchestration layer: state management and layout for all weapon categories.
// Card components, pickers and helpers live in ./weapons/.

import { useState, useCallback } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  CyberneticItem,
  ShieldItem,
} from "../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  type RangedWeaponRef,
  type MeleeWeaponRef,
  type GrenadeRef,
  type ShieldRef,
} from "../../data/reference/weaponReference";
import { RangedCard, RangedPicker, CustomRangedForm } from "./weapons/RangedCard";
import { MeleeCard, MeleePicker, CustomMeleeForm } from "./weapons/MeleeCard";
import { GrenadeCard, GrenadePicker } from "./weapons/GrenadeCard";
import { ShieldCard, ShieldPicker } from "./weapons/ShieldCard";
import { CyberneticWeaponCard } from "./weapons/CyberneticWeaponCard";
import { PickerModal } from "../../ui/PickerModal";
import { uiSectionHeader } from "../../ui/editableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeaponsTabProps {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  grenades: GrenadeItem[];
  editable: boolean;
  strengthBonus: number;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
  onUpdateGrenades: (next: GrenadeItem[]) => void;
  cybernetics?: CyberneticItem[];
  shields?: ShieldItem[];
  onUpdateShields?: (next: ShieldItem[]) => void;
}

type PickerTarget = "ranged" | "melee" | "integrated" | "grenades" | "shields" | null;

const INTEGRATED_RANGED_IDS = new Set([
  "lw-lathe-laspistol",
  "lw-lathe-lasrifle",
  "lw-lathe-lasblaster",
  "lw-phased-plasma-rifle",
  "lw-catalytic-mass-driver",
  "lw-heavy-catalytic-mass-driver",
]);

const INTEGRATED_MELEE_IDS = new Set([
  "lw-coil-whip",
  "lw-lathes-arc-welder",
]);

const INTEGRATED_RANGED_NAMES = new Set([
  "lathe laspistol",
  "lathe-laspistol",
  "lathe lasrifle",
  "lathe-lasrifle",
  "lathe lasblaster",
  "lathe-lasblaster",
  "phased plasma rifle",
  "catalytic mass driver",
  "heavy catalytic mass driver",
]);

const INTEGRATED_MELEE_NAMES = new Set([
  "coil whip",
  "coil-whip",
  "lathes arc welder",
  "lathes arc-welder",
]);

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function isIntegratedRangedRef(ref: RangedWeaponRef): boolean {
  return INTEGRATED_RANGED_IDS.has(ref.id);
}

function isIntegratedMeleeRef(ref: MeleeWeaponRef): boolean {
  return INTEGRATED_MELEE_IDS.has(ref.id);
}

function isIntegratedRangedWeapon(weapon: RangedWeapon): boolean {
  return (
    (weapon.referenceId ? INTEGRATED_RANGED_IDS.has(weapon.referenceId) : false) ||
    INTEGRATED_RANGED_NAMES.has(normaliseName(weapon.name))
  );
}

function isIntegratedMeleeWeapon(weapon: MeleeWeapon): boolean {
  return (
    (weapon.referenceId ? INTEGRATED_MELEE_IDS.has(weapon.referenceId) : false) ||
    INTEGRATED_MELEE_NAMES.has(normaliseName(weapon.name))
  );
}

const NORMAL_RANGED_REFS = RANGED_WEAPON_REFERENCE.filter((ref) => !isIntegratedRangedRef(ref));
const NORMAL_MELEE_REFS = MELEE_WEAPON_REFERENCE.filter((ref) => !isIntegratedMeleeRef(ref));
const INTEGRATED_RANGED_REFS = RANGED_WEAPON_REFERENCE.filter(isIntegratedRangedRef);
const INTEGRATED_MELEE_REFS = MELEE_WEAPON_REFERENCE.filter(isIntegratedMeleeRef);

function IntegratedWeaponPicker({
  onSelectRanged,
  onSelectMelee,
  onClose,
}: {
  onSelectRanged: (ref: RangedWeaponRef) => void;
  onSelectMelee: (ref: MeleeWeaponRef) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const ranged = INTEGRATED_RANGED_REFS.filter((ref) => ref.name.toLowerCase().includes(q));
  const melee = INTEGRATED_MELEE_REFS.filter((ref) => ref.name.toLowerCase().includes(q));
  const isEmpty = ranged.length === 0 && melee.length === 0;

  return (
    <PickerModal
      title="Add Integrated Weapon"
      placeholder="Search integrated weapons..."
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={isEmpty}
    >
      {ranged.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelectRanged(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            <span className="text-xs text-slate-500 shrink-0">{ref.class}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.range} · {ref.rof} · {ref.damage} · Pen {ref.pen}
          </div>
        </button>
      ))}
      {melee.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelectMelee(ref)}
          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white">
              {ref.name}
            </span>
            <span className="text-xs text-slate-500 shrink-0">{ref.class}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {ref.damage} · Pen {ref.pen}
          </div>
        </button>
      ))}
    </PickerModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeaponsTab({
  rangedWeapons,
  meleeWeapons,
  grenades,
  editable,
  strengthBonus,
  onUpdateRanged,
  onUpdateMelee,
  onUpdateGrenades,
  cybernetics,
  shields,
  onUpdateShields,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);

  // ── Cybernetic weapons ─────────────────────────────────────────────────────
  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((c) => {
    const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
    if (!ref?.weapon) return [];
    return [{ cybernetic: c, weapon: ref.weapon }];
  });

  const normalRangedWeapons = rangedWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => !isIntegratedRangedWeapon(weapon));
  const integratedRangedWeapons = rangedWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedRangedWeapon(weapon));
  const normalMeleeWeapons = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => !isIntegratedMeleeWeapon(weapon));
  const integratedMeleeWeapons = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedMeleeWeapon(weapon));
  const integratedWeaponCount = integratedRangedWeapons.length + integratedMeleeWeapons.length;

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

  // ── Ranged handlers ────────────────────────────────────────────────────────

  const addFromRangedRef = useCallback(
    (ref: RangedWeaponRef) => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
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
          quantity: isThrown ? 1 : undefined,
        },
      ]);
      setPicker(null);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addCustomRanged = useCallback(
    (weapon: RangedWeapon) => {
      if (!editable) return;
      onUpdateRanged([...rangedWeapons, weapon]);
      setShowCustomRanged(false);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeRanged = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...rangedWeapons];
      next.splice(index, 1);
      onUpdateRanged(next);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addAttachmentToRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, attachments: [...(weapon.attachments ?? []), upgradeId] }
            : weapon
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeAttachmentFromRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, attachments: (weapon.attachments ?? []).filter((id) => id !== upgradeId) }
            : weapon
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedAmmoEntries = useCallback(
    (weaponId: string, entries: WeaponAmmoEntry[]) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) => (w.id === weaponId ? { ...w, ammoEntries: entries } : w))
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedQuantity = useCallback(
    (weaponId: string, quantity: number) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w))
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  // ── Melee handlers ─────────────────────────────────────────────────────────

  const addFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef) => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
      onUpdateMelee([
        ...meleeWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.twoHanded ? `${ref.class} (Two-Handed)` : ref.class,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
          quantity: isThrown ? 1 : undefined,
        },
      ]);
      setPicker(null);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addCustomMelee = useCallback(
    (weapon: MeleeWeapon) => {
      if (!editable) return;
      onUpdateMelee([...meleeWeapons, weapon]);
      setShowCustomMelee(false);
    },
    [editable, meleeWeapons, onUpdateMelee]
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

  const addAttachmentToMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, attachments: [...(weapon.attachments ?? []), upgradeId] }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const removeAttachmentFromMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, attachments: (weapon.attachments ?? []).filter((id) => id !== upgradeId) }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const updateMeleeQuantity = useCallback(
    (weaponId: string, quantity: number) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w))
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  // ── Shield handlers ────────────────────────────────────────────────────────

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── RANGED ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={uiSectionHeader}>Ranged</h3>
            {editable && !showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {normalRangedWeapons.length === 0 && !showCustomRanged && (
            <p className="text-sm text-slate-500 italic">No ranged weapons.</p>
          )}

          {normalRangedWeapons.map(({ weapon, index }) => (
            <RangedCard
              key={weapon.id}
              weapon={weapon}
              editable={editable}
              onRemove={() => removeRanged(index)}
              onAddAttachment={(upgradeId) => addAttachmentToRanged(weapon.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromRanged(weapon.id, upgradeId)}
              onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(weapon.id, entries)}
              onUpdateQuantity={(qty) => updateRangedQuantity(weapon.id, qty)}
              grenades={grenades}
              onUpdateGrenades={onUpdateGrenades}
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
            <h3 className={uiSectionHeader}>Melee</h3>
            {editable && !showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                + Add
              </button>
            )}
          </div>

          {normalMeleeWeapons.length === 0 && !showCustomMelee && (
            <p className="text-sm text-slate-500 italic">No melee weapons.</p>
          )}

          {normalMeleeWeapons.map(({ weapon, index }) => (
            <MeleeCard
              key={weapon.id}
              weapon={weapon}
              editable={editable}
              strengthBonus={strengthBonus}
              onRemove={() => removeMelee(index)}
              onAddAttachment={(upgradeId) => addAttachmentToMelee(weapon.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromMelee(weapon.id, upgradeId)}
              onUpdateQuantity={(qty) => updateMeleeQuantity(weapon.id, qty)}
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

      {/* ── GRENADES ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Grenades ({grenades.length})
          </h3>
          {editable && (
            <button
              onClick={() => setPicker("grenades")}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
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

      {/* ── INTEGRATED WEAPONS ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Integrated Weapons ({integratedWeaponCount})
          </h3>
          {editable && (
            <button
              onClick={() => setPicker("integrated")}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              + Add
            </button>
          )}
        </div>

        {integratedWeaponCount === 0 && (
          <p className="text-sm text-slate-500 italic">No integrated weapons installed.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {integratedRangedWeapons.map(({ weapon, index }) => (
            <RangedCard
              key={weapon.id}
              weapon={weapon}
              editable={editable}
              onRemove={() => removeRanged(index)}
              onAddAttachment={(upgradeId) => addAttachmentToRanged(weapon.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromRanged(weapon.id, upgradeId)}
              onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(weapon.id, entries)}
              onUpdateQuantity={(qty) => updateRangedQuantity(weapon.id, qty)}
              grenades={grenades}
              onUpdateGrenades={onUpdateGrenades}
              allowAttachments={false}
            />
          ))}
          {integratedMeleeWeapons.map(({ weapon, index }) => (
            <MeleeCard
              key={weapon.id}
              weapon={weapon}
              editable={editable}
              strengthBonus={strengthBonus}
              onRemove={() => removeMelee(index)}
              onAddAttachment={(upgradeId) => addAttachmentToMelee(weapon.id, upgradeId)}
              onRemoveAttachment={(upgradeId) => removeAttachmentFromMelee(weapon.id, upgradeId)}
              onUpdateQuantity={(qty) => updateMeleeQuantity(weapon.id, qty)}
              allowAttachments={false}
            />
          ))}
        </div>
      </section>

      {/* ── SHIELDS ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>Shields</h3>
          {editable && (
            <button
              onClick={() => setPicker("shields")}
              className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
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

      {/* ── CYBERNETIC WEAPONS ───────────────────────────────────────────── */}
      {cyberneticWeaponItems.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className={uiSectionHeader}>
              Cybernetic Weapons
            </h3>
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

      {/* ── Pickers ───────────────────────────────────────────────────────── */}
      {picker === "ranged" && (
        <RangedPicker
          onSelect={addFromRangedRef}
          references={NORMAL_RANGED_REFS}
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
          references={NORMAL_MELEE_REFS}
          onCustom={() => {
            setPicker(null);
            setShowCustomMelee(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "integrated" && (
        <IntegratedWeaponPicker
          onSelectRanged={addFromRangedRef}
          onSelectMelee={addFromMeleeRef}
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
