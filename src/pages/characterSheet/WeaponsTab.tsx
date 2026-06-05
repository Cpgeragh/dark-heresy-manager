// src/pages/characterSheet/WeaponsTab.tsx
// Orchestration layer: state management and layout for all weapon categories.
// Card components, pickers and helpers live in ./weapons/.

import { useState, useCallback, Fragment } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  CyberneticItem,
  ShieldItem,
  ArcheotechItem,
} from "../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { ARCHEOTECH_REFERENCE } from "../../data/reference/archeotechReference";
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
import { ArcheotechWeaponCard } from "./weapons/ArcheotechWeaponCard";
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
  archeotech?: ArcheotechItem[];
  onUpdateArcheotech?: (next: ArcheotechItem[]) => void;
}

type PickerTarget = "ranged" | "melee" | "integrated" | "grenades" | "shields" | null;

const INTEGRATED_RANGED_IDS = new Set([
  "lw-lathe-laspistol",
  "lw-lathe-lasrifle",
  "lw-lathe-lasblaster",
  "lw-phased-plasma-rifle",
  "lw-catalytic-mass-driver",
  "lw-heavy-catalytic-mass-driver",
  "lw-graviton-pulse-launcher",
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
  "graviton pulse launcher",
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
  editable = true,
  onSelectRanged,
  onSelectMelee,
  onClose,
}: {
  editable?: boolean;
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
          onClick={editable ? () => onSelectRanged(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}>
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
          onClick={editable ? () => onSelectMelee(ref) : undefined}
          className={`w-full text-left px-4 py-3 transition group ${editable ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium text-slate-200 ${editable ? "group-hover:text-white" : ""}`}>
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

// ─── Slot System ─────────────────────────────────────────────────────────────

const MAX_WEAPON_SLOTS = 4;
const MAX_GRENADE_TYPES = 2;

function getRangedSlots(weapon: RangedWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("heavy") ? 2 : 1;
}
function getMeleeSlots(weapon: MeleeWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("two-handed") ? 2 : 1;
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
  archeotech,
  onUpdateArcheotech,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);

  // ── Archeotech weapons ─────────────────────────────────────────────────────
  const archeotechGrenadeItems = (archeotech ?? []).filter(
    (a) => a.type === "Grenade"
  );
  const archeotechMineItems = (archeotech ?? []).filter(
    (a) => a.type === "Mine"
  );
  const archeotechWeaponItems = (archeotech ?? []).filter(
    (a) => a.type === "Weapon"
  );
  const archeotechRangedItems = archeotechWeaponItems.filter((a) => {
    const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === a.referenceId);
    return ref?.weaponClass !== "Melee";
  });
  const archeotechMeleeWeaponItems = archeotechWeaponItems.filter((a) => {
    const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === a.referenceId);
    return ref?.weaponClass === "Melee";
  });

  // ── Cybernetic weapons ─────────────────────────────────────────────────────
  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((c) => {
    const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
    if (!ref?.weapon) return [];
    return [{ cybernetic: c, weapon: ref.weapon }];
  });
  const cyberneticRangedItems = cyberneticWeaponItems.filter(({ weapon }) => weapon.type === "ranged");
  const cyberneticMeleeItems  = cyberneticWeaponItems.filter(({ weapon }) => weapon.type === "melee");

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

  // ── Unified sorted lists ───────────────────────────────────────────────────
  const allRangedEntries = [
    ...normalRangedWeapons.map(({ weapon, index }) => ({ kind: "regular" as const, weapon, index, name: weapon.name })),
    ...cyberneticRangedItems.map(({ cybernetic, weapon }) => ({ kind: "cybernetic" as const, cybernetic, weapon, name: weapon.name })),
    ...archeotechRangedItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
  ].sort((a, b) => {
    if (a.kind === "cybernetic" && b.kind !== "cybernetic") return -1;
    if (b.kind === "cybernetic" && a.kind !== "cybernetic") return 1;
    const aEq = a.kind === "regular" ? (a.weapon.equipped ? 0 : 1) : a.kind === "archeotech" ? (a.item.equipped ? 0 : 1) : 0;
    const bEq = b.kind === "regular" ? (b.weapon.equipped ? 0 : 1) : b.kind === "archeotech" ? (b.item.equipped ? 0 : 1) : 0;
    if (aEq !== bEq) return aEq - bEq;
    return a.name.localeCompare(b.name);
  });

  const allMeleeEntries = [
    ...normalMeleeWeapons.map(({ weapon, index }) => ({ kind: "regular" as const, weapon, index, name: weapon.name })),
    ...cyberneticMeleeItems.map(({ cybernetic, weapon }) => ({ kind: "cybernetic" as const, cybernetic, weapon, name: weapon.name })),
    ...archeotechMeleeWeaponItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
  ].sort((a, b) => {
    if (a.kind === "cybernetic" && b.kind !== "cybernetic") return -1;
    if (b.kind === "cybernetic" && a.kind !== "cybernetic") return 1;
    const aEq = a.kind === "regular" ? (a.weapon.equipped ? 0 : 1) : a.kind === "archeotech" ? (a.item.equipped ? 0 : 1) : 0;
    const bEq = b.kind === "regular" ? (b.weapon.equipped ? 0 : 1) : b.kind === "archeotech" ? (b.item.equipped ? 0 : 1) : 0;
    if (aEq !== bEq) return aEq - bEq;
    return a.name.localeCompare(b.name);
  });

  const allGrenadeEntries = [
    ...grenades.map((item) => ({ kind: "regular" as const, item, name: item.name })),
    ...archeotechGrenadeItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
    ...archeotechMineItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
  ].sort((a, b) => {
    const aEq = a.item.equipped ? 0 : 1;
    const bEq = b.item.equipped ? 0 : 1;
    if (aEq !== bEq) return aEq - bEq;
    return a.name.localeCompare(b.name);
  });

  // ── Slot counting ──────────────────────────────────────────────────────────
  const equippedWeaponSlots =
    normalRangedWeapons.filter(({ weapon }) => weapon.equipped).reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    normalMeleeWeapons.filter(({ weapon }) => weapon.equipped).reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
    archeotechRangedItems.filter((a) => a.equipped).length +
    archeotechMeleeWeaponItems.filter((a) => a.equipped).length +
    (shields ?? []).filter((s) => s.equipped).length;
  const slotsRemaining = MAX_WEAPON_SLOTS - equippedWeaponSlots;
  const equippedGrenadeTypes =
    grenades.filter((g) => g.equipped).length +
    [...archeotechGrenadeItems, ...archeotechMineItems].filter((a) => a.equipped).length;

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
          type: ref.type,
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

  // ── Equip toggle handlers ──────────────────────────────────────────────────

  const toggleEquipRanged = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map((w) => w.id === id ? { ...w, equipped: !w.equipped } : w));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const toggleEquipMelee = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => w.id === id ? { ...w, equipped: !w.equipped } : w));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const toggleEquipArcheotech = useCallback(
    (id: string) => {
      if (!editable || !onUpdateArcheotech) return;
      onUpdateArcheotech((archeotech ?? []).map((a) => a.id === id ? { ...a, equipped: !a.equipped } : a));
    },
    [editable, archeotech, onUpdateArcheotech]
  );

  const toggleEquipGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => g.id === id ? { ...g, equipped: !g.equipped } : g));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const toggleEquipShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields((shields ?? []).map((s) => s.id === id ? { ...s, equipped: !s.equipped } : s));
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
            {!showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
          </div>

          {allRangedEntries.length === 0 && !showCustomRanged && (
            <p className="text-sm text-slate-500 italic">No ranged weapons.</p>
          )}

          {allRangedEntries.map((entry) => {
            if (entry.kind === "cybernetic") return (
              <CyberneticWeaponCard
                key={entry.cybernetic.id}
                cyberneticName={entry.cybernetic.name}
                weapon={entry.weapon}
                strengthBonus={strengthBonus}
              />
            );
            if (entry.kind === "archeotech") return (
              <ArcheotechWeaponCard
                key={entry.item.id}
                item={entry.item}
                strengthBonus={strengthBonus}
                editable={editable}
                isEquipped={entry.item.equipped ?? false}
                onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                slotsDisabled={!(entry.item.equipped) && slotsRemaining < 1}
              />
            );
            return (
              <RangedCard
                key={entry.weapon.id}
                weapon={entry.weapon}
                editable={editable}
                onRemove={() => removeRanged(entry.index)}
                onAddAttachment={(upgradeId) => addAttachmentToRanged(entry.weapon.id, upgradeId)}
                onRemoveAttachment={(upgradeId) => removeAttachmentFromRanged(entry.weapon.id, upgradeId)}
                onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(entry.weapon.id, entries)}
                onUpdateQuantity={(qty) => updateRangedQuantity(entry.weapon.id, qty)}
                grenades={grenades}
                onUpdateGrenades={onUpdateGrenades}
                archeotechGrenades={archeotechGrenadeItems}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipRanged(entry.weapon.id)}
                slotsDisabled={!(entry.weapon.equipped) && slotsRemaining < getRangedSlots(entry.weapon)}
              />
            );
          })}

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
            {!showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
          </div>

          {allMeleeEntries.length === 0 && !showCustomMelee && (
            <p className="text-sm text-slate-500 italic">No melee weapons.</p>
          )}

          {allMeleeEntries.map((entry) => {
            if (entry.kind === "cybernetic") return (
              <CyberneticWeaponCard
                key={entry.cybernetic.id}
                cyberneticName={entry.cybernetic.name}
                weapon={entry.weapon}
                strengthBonus={strengthBonus}
              />
            );
            if (entry.kind === "archeotech") return (
              <ArcheotechWeaponCard
                key={entry.item.id}
                item={entry.item}
                strengthBonus={strengthBonus}
                editable={editable}
                isEquipped={entry.item.equipped ?? false}
                onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                slotsDisabled={!(entry.item.equipped) && slotsRemaining < 1}
              />
            );
            return (
              <MeleeCard
                key={entry.weapon.id}
                weapon={entry.weapon}
                editable={editable}
                strengthBonus={strengthBonus}
                onRemove={() => removeMelee(entry.index)}
                onAddAttachment={(upgradeId) => addAttachmentToMelee(entry.weapon.id, upgradeId)}
                onRemoveAttachment={(upgradeId) => removeAttachmentFromMelee(entry.weapon.id, upgradeId)}
                onUpdateQuantity={(qty) => updateMeleeQuantity(entry.weapon.id, qty)}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipMelee(entry.weapon.id)}
                slotsDisabled={!(entry.weapon.equipped) && slotsRemaining < getMeleeSlots(entry.weapon)}
              />
            );
          })}

          {showCustomMelee && (
            <CustomMeleeForm
              onAdd={addCustomMelee}
              onCancel={() => setShowCustomMelee(false)}
            />
          )}
        </section>

      </div>

      {/* ── GRENADES & MINES ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Grenades & Mines ({allGrenadeEntries.length})
          </h3>
          <button
            onClick={() => setPicker("grenades")}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {allGrenadeEntries.length === 0 && (
          <p className="text-sm text-slate-500 italic">No grenades or mines carried.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          {allGrenadeEntries.map((entry) => {
            if (entry.kind === "archeotech") return (
              <ArcheotechWeaponCard
                key={entry.item.id}
                item={entry.item}
                editable={editable}
                isEquipped={entry.item.equipped ?? false}
                onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                slotsDisabled={!(entry.item.equipped) && equippedGrenadeTypes >= MAX_GRENADE_TYPES}
              />
            );
            const item = entry.item;
            const isEquipped = !!item.equipped;
            const stowedCount = isEquipped ? Math.max(0, item.quantity - 3) : 0;
            return (
              <Fragment key={item.id}>
                <GrenadeCard
                  item={item}
                  editable={editable}
                  onRemove={() => removeGrenade(item.id)}
                  onUpdateQty={(qty) => updateGrenadeQty(item.id, qty)}
                  isEquipped={isEquipped}
                  onToggleEquip={() => toggleEquipGrenade(item.id)}
                  canEquipMoreTypes={isEquipped || equippedGrenadeTypes < MAX_GRENADE_TYPES}
                />
                {isEquipped && stowedCount > 0 && (
                  <GrenadeCard
                    item={{ ...item, quantity: stowedCount }}
                    editable={false}
                    onRemove={() => {}}
                    onUpdateQty={() => {}}
                    isStowedCard
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </section>

      {/* ── INTEGRATED WEAPONS ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>
            Integrated Weapons ({integratedWeaponCount})
          </h3>
          <button
            onClick={() => setPicker("integrated")}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {integratedWeaponCount === 0 && (
          <p className="text-sm text-slate-500 italic">No integrated weapons installed.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
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
              archeotechGrenades={archeotechGrenadeItems}
              allowAttachments={false}
              forceExpanded
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
              forceExpanded
            />
          ))}
        </div>
      </section>

      {/* ── SHIELDS ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={uiSectionHeader}>Shields</h3>
          <button
            onClick={() => setPicker("shields")}
            className="text-xs px-3 py-1 rounded border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {(shields ?? []).length === 0 && (
          <p className="text-sm text-slate-500 italic">No shields carried.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          {[...(shields ?? [])].sort((a, b) => {
            if (a.equipped && !b.equipped) return -1;
            if (!a.equipped && b.equipped) return 1;
            return a.name.localeCompare(b.name);
          }).map((item) => (
            <ShieldCard
              key={item.id}
              item={item}
              editable={editable}
              onRemove={() => removeShield(item.id)}
              isEquipped={item.equipped ?? false}
              onToggleEquip={() => toggleEquipShield(item.id)}
              slotsDisabled={!(item.equipped) && slotsRemaining < 1}
            />
          ))}
        </div>
      </section>

      {/* ── Pickers ───────────────────────────────────────────────────────── */}
      {picker === "ranged" && (
        <RangedPicker
          editable={editable}
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
          editable={editable}
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
          editable={editable}
          onSelectRanged={addFromRangedRef}
          onSelectMelee={addFromMeleeRef}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "grenades" && (
        <GrenadePicker
          editable={editable}
          onSelect={addFromGrenadeRef}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "shields" && (
        <ShieldPicker
          editable={editable}
          onSelect={addFromShieldRef}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
