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
  WeaponCraftsmanship,
} from "../../types/Character";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { ARCHEOTECH_REFERENCE } from "../../data/reference/archeotechReference";
import {
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
import { IndependentCardGrid } from "./weapons/IndependentCardGrid";
import { IntegratedWeaponPicker } from "./weapons/IntegratedWeaponPicker";
import {
  isIntegratedRangedWeapon,
  isIntegratedMeleeWeapon,
  NORMAL_RANGED_REFS,
  NORMAL_MELEE_REFS,
  rangedRulesForCraftsmanship,
  meleeDamageForCraftsmanship,
  compareWeaponEntries,
} from "../../utils/weaponUtils";
import { SectionHeader } from "../../ui/SectionHeader";

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
  const archeotechGrenadeItems = (archeotech ?? []).filter((a) => a.type === "Grenade");
  const archeotechMineItems = (archeotech ?? []).filter((a) => a.type === "Mine");
  const archeotechWeaponItems = (archeotech ?? []).filter((a) => a.type === "Weapon");
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
  const cyberneticRangedItems = cyberneticWeaponItems.filter(
    ({ weapon }) => weapon.type === "ranged"
  );
  const cyberneticMeleeItems = cyberneticWeaponItems.filter(
    ({ weapon }) => weapon.type === "melee"
  );

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
    ...normalRangedWeapons.map(({ weapon, index }) => ({
      kind: "regular" as const,
      weapon,
      index,
      name: weapon.name,
    })),
    ...cyberneticRangedItems.map(({ cybernetic, weapon }) => ({
      kind: "cybernetic" as const,
      cybernetic,
      weapon,
      name: weapon.name,
    })),
    ...archeotechRangedItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
  ].sort(compareWeaponEntries);

  const allMeleeEntries = [
    ...normalMeleeWeapons.map(({ weapon, index }) => ({
      kind: "regular" as const,
      weapon,
      index,
      name: weapon.name,
    })),
    ...cyberneticMeleeItems.map(({ cybernetic, weapon }) => ({
      kind: "cybernetic" as const,
      cybernetic,
      weapon,
      name: weapon.name,
    })),
    ...archeotechMeleeWeaponItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
  ].sort(compareWeaponEntries);

  const allGrenadeEntries = [
    ...grenades.map((item) => ({ kind: "regular" as const, item, name: item.name })),
    ...archeotechGrenadeItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...archeotechMineItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
  ].sort((a, b) => {
    const aEq = a.item.equipped ? 0 : 1;
    const bEq = b.item.equipped ? 0 : 1;
    if (aEq !== bEq) return aEq - bEq;
    return a.name.localeCompare(b.name);
  });

  // ── Slot counting ──────────────────────────────────────────────────────────
  const equippedWeaponSlots =
    normalRangedWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    normalMeleeWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
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
    (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
      const specialRules = rangedRulesForCraftsmanship(ref.specialRules, craftsmanship);
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
          specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
          craftsmanship,
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
      onUpdateRanged([
        ...rangedWeapons,
        { ...weapon, craftsmanship: weapon.craftsmanship ?? "Common" },
      ]);
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
            ? {
                ...weapon,
                attachments: (weapon.attachments ?? []).filter((id) => id !== upgradeId),
              }
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
      onUpdateRanged(rangedWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w)));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  // ── Melee handlers ─────────────────────────────────────────────────────────

  const addFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
      const damage = meleeDamageForCraftsmanship(ref.damage, craftsmanship);
      onUpdateMelee([
        ...meleeWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.twoHanded ? `${ref.class} (Two-Handed)` : ref.class,
          damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          rarity: ref.rarity,
          source: ref.source,
          craftsmanship,
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
      onUpdateMelee([
        ...meleeWeapons,
        { ...weapon, craftsmanship: weapon.craftsmanship ?? "Common" },
      ]);
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
            ? {
                ...weapon,
                attachments: (weapon.attachments ?? []).filter((id) => id !== upgradeId),
              }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const updateMeleeQuantity = useCallback(
    (weaponId: string, quantity: number) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w)));
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
      onUpdateRanged(rangedWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const toggleEquipMelee = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const toggleEquipArcheotech = useCallback(
    (id: string) => {
      if (!editable || !onUpdateArcheotech) return;
      onUpdateArcheotech(
        (archeotech ?? []).map((a) => (a.id === id ? { ...a, equipped: !a.equipped } : a))
      );
    },
    [editable, archeotech, onUpdateArcheotech]
  );

  const toggleEquipGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => (g.id === id ? { ...g, equipped: !g.equipped } : g)));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const toggleEquipShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields(
        (shields ?? []).map((s) => (s.id === id ? { ...s, equipped: !s.equipped } : s))
      );
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
            <SectionHeader>Ranged</SectionHeader>
            {!showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
          </div>

          {allRangedEntries.length === 0 && !showCustomRanged && (
            <p className="text-sm lg:text-base text-slate-500 italic">No ranged weapons.</p>
          )}

          {allRangedEntries.map((entry) => {
            if (entry.kind === "cybernetic")
              return (
                <CyberneticWeaponCard
                  key={entry.cybernetic.id}
                  cyberneticName={entry.cybernetic.name}
                  weapon={entry.weapon}
                  strengthBonus={strengthBonus}
                />
              );
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  strengthBonus={strengthBonus}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && slotsRemaining < 1}
                />
              );
            return (
              <RangedCard
                key={entry.weapon.id}
                weapon={entry.weapon}
                editable={editable}
                onRemove={() => removeRanged(entry.index)}
                onAddAttachment={(upgradeId) => addAttachmentToRanged(entry.weapon.id, upgradeId)}
                onRemoveAttachment={(upgradeId) =>
                  removeAttachmentFromRanged(entry.weapon.id, upgradeId)
                }
                onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(entry.weapon.id, entries)}
                onUpdateQuantity={(qty) => updateRangedQuantity(entry.weapon.id, qty)}
                grenades={grenades}
                onUpdateGrenades={onUpdateGrenades}
                archeotechGrenades={archeotechGrenadeItems}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipRanged(entry.weapon.id)}
                slotsDisabled={
                  !entry.weapon.equipped && slotsRemaining < getRangedSlots(entry.weapon)
                }
              />
            );
          })}

          {showCustomRanged && (
            <CustomRangedForm onAdd={addCustomRanged} onCancel={() => setShowCustomRanged(false)} />
          )}
        </section>

        {/* ── MELEE ──────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeader>Melee</SectionHeader>
            {!showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
          </div>

          {allMeleeEntries.length === 0 && !showCustomMelee && (
            <p className="text-sm lg:text-base text-slate-500 italic">No melee weapons.</p>
          )}

          {allMeleeEntries.map((entry) => {
            if (entry.kind === "cybernetic")
              return (
                <CyberneticWeaponCard
                  key={entry.cybernetic.id}
                  cyberneticName={entry.cybernetic.name}
                  weapon={entry.weapon}
                  strengthBonus={strengthBonus}
                />
              );
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  strengthBonus={strengthBonus}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && slotsRemaining < 1}
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
                onRemoveAttachment={(upgradeId) =>
                  removeAttachmentFromMelee(entry.weapon.id, upgradeId)
                }
                onUpdateQuantity={(qty) => updateMeleeQuantity(entry.weapon.id, qty)}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipMelee(entry.weapon.id)}
                slotsDisabled={
                  !entry.weapon.equipped && slotsRemaining < getMeleeSlots(entry.weapon)
                }
              />
            );
          })}

          {showCustomMelee && (
            <CustomMeleeForm onAdd={addCustomMelee} onCancel={() => setShowCustomMelee(false)} />
          )}
        </section>
      </div>

      {/* ── GRENADES & MINES ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Grenades & Mines ({allGrenadeEntries.length})</SectionHeader>
          <button
            onClick={() => setPicker("grenades")}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {allGrenadeEntries.length === 0 && (
          <p className="text-sm lg:text-base text-slate-500 italic">No grenades or mines carried.</p>
        )}

        <IndependentCardGrid
          items={allGrenadeEntries.map((entry) => {
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && equippedGrenadeTypes >= MAX_GRENADE_TYPES}
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
        />
      </section>

      {/* ── INTEGRATED WEAPONS ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Integrated Weapons ({integratedWeaponCount})</SectionHeader>
          <button
            onClick={() => setPicker("integrated")}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {integratedWeaponCount === 0 && (
          <p className="text-sm lg:text-base text-slate-500 italic">No integrated weapons installed.</p>
        )}

        <IndependentCardGrid
          breakpoint="lg"
          items={[
            ...integratedRangedWeapons.map(({ weapon, index }) => (
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
            )),
            ...integratedMeleeWeapons.map(({ weapon, index }) => (
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
            )),
          ]}
        />
      </section>

      {/* ── SHIELDS ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Shields</SectionHeader>
          <button
            onClick={() => setPicker("shields")}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {(shields ?? []).length === 0 && (
          <p className="text-sm lg:text-base text-slate-500 italic">No shields carried.</p>
        )}

        <IndependentCardGrid
          items={[...(shields ?? [])]
            .sort((a, b) => {
              if (a.equipped && !b.equipped) return -1;
              if (!a.equipped && b.equipped) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((item) => (
              <ShieldCard
                key={item.id}
                item={item}
                editable={editable}
                onRemove={() => removeShield(item.id)}
                isEquipped={item.equipped ?? false}
                onToggleEquip={() => toggleEquipShield(item.id)}
                slotsDisabled={!item.equipped && slotsRemaining < 1}
              />
            ))}
        />
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
