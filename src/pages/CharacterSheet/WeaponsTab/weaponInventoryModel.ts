import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import {
  CYBERNETICS_REFERENCE,
  type CyberneticWeapon,
} from "../../../data/reference/cyberneticsReference";
import type {
  ArcheotechItem,
  CyberneticItem,
  GrenadeItem,
  MeleeWeapon,
  RangedWeapon,
  ShieldItem,
} from "../../../types/Character";
import {
  compareWeaponEntries,
  isIntegratedMeleeWeapon,
  isIntegratedRangedWeapon,
} from "../weapons/weaponHelpers";

export const MAX_WEAPON_SLOTS = 4;
export const MAX_GRENADE_TYPES = 2;

export type RangedInventoryEntry =
  | { kind: "regular"; weapon: RangedWeapon; index: number; name: string }
  | { kind: "integrated"; weapon: RangedWeapon; index: number; name: string }
  | { kind: "cybernetic"; cybernetic: CyberneticItem; weapon: CyberneticWeapon; name: string }
  | { kind: "archeotech"; item: ArcheotechItem; name: string };

export type MeleeInventoryEntry =
  | { kind: "regular"; weapon: MeleeWeapon; index: number; name: string }
  | { kind: "integrated"; weapon: MeleeWeapon; index: number; name: string }
  | { kind: "cybernetic"; cybernetic: CyberneticItem; weapon: CyberneticWeapon; name: string }
  | { kind: "archeotech"; item: ArcheotechItem; name: string };

export type ExplosiveInventoryEntry =
  | { kind: "regular"; item: GrenadeItem; name: string }
  | { kind: "archeotech"; item: ArcheotechItem; name: string };

export interface WeaponInventoryModelInput {
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  grenades: GrenadeItem[];
  cybernetics?: CyberneticItem[];
  shields?: ShieldItem[];
  archeotech?: ArcheotechItem[];
}

export interface WeaponInventoryModel {
  allRangedEntries: RangedInventoryEntry[];
  allMeleeEntries: MeleeInventoryEntry[];
  allGrenadeEntries: ExplosiveInventoryEntry[];
  sortedShields: ShieldItem[];
  archeotechShieldItems: ArcheotechItem[];
  archeotechGrenadeItems: ArcheotechItem[];
  equippedWeaponSlots: number;
  slotsRemaining: number;
  equippedGrenadeTypes: number;
}

export function getRangedSlots(weapon: RangedWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("heavy") ? 2 : 1;
}

export function getMeleeSlots(weapon: MeleeWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("two-handed") ? 2 : 1;
}

function compareEquippedThenName(
  a: { equipped?: boolean; name: string },
  b: { equipped?: boolean; name: string }
): number {
  if (a.equipped && !b.equipped) return -1;
  if (!a.equipped && b.equipped) return 1;
  return a.name.localeCompare(b.name);
}

export function buildWeaponInventoryModel({
  rangedWeapons,
  meleeWeapons,
  grenades,
  cybernetics,
  shields,
  archeotech,
}: WeaponInventoryModelInput): WeaponInventoryModel {
  const archeotechItems = archeotech ?? [];
  const archeotechGrenadeItems = archeotechItems.filter((item) => item.type === "Grenade");
  const archeotechMineItems = archeotechItems.filter((item) => item.type === "Mine");
  const archeotechWeaponItems = archeotechItems.filter((item) => item.type === "Weapon");
  const archeotechIntegratedWeaponItems = archeotechItems.filter(
    (item) => item.type === "Integrated Weapon"
  );
  const archeotechShieldItems = archeotechItems
    .filter((item) => item.type === "Shield")
    .sort(compareEquippedThenName);

  const archeotechWeaponClass = (item: ArcheotechItem) =>
    item.weaponClass ??
    ARCHEOTECH_REFERENCE.find((reference) => reference.id === item.referenceId)?.weaponClass;
  const archeotechRangedItems = archeotechWeaponItems.filter(
    (item) => archeotechWeaponClass(item) !== "Melee"
  );
  const archeotechMeleeWeaponItems = archeotechWeaponItems.filter(
    (item) => archeotechWeaponClass(item) === "Melee"
  );
  const archeotechIntegratedRangedItems = archeotechIntegratedWeaponItems.filter(
    (item) => archeotechWeaponClass(item) !== "Melee" && item.equipped
  );
  const archeotechIntegratedMeleeItems = archeotechIntegratedWeaponItems.filter(
    (item) => archeotechWeaponClass(item) === "Melee" && item.equipped
  );

  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((cybernetic) => {
    const reference = CYBERNETICS_REFERENCE.find((entry) => entry.id === cybernetic.referenceId);
    return reference?.weapon ? [{ cybernetic, weapon: reference.weapon }] : [];
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
  const equippedIntegratedRanged = rangedWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedRangedWeapon(weapon) && weapon.equipped);
  const normalMeleeWeapons = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => !isIntegratedMeleeWeapon(weapon));
  const equippedIntegratedMelee = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedMeleeWeapon(weapon) && weapon.equipped);

  const allRangedEntries: RangedInventoryEntry[] = [
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
    ...archeotechIntegratedRangedItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...equippedIntegratedRanged.map(({ weapon, index }) => ({
      kind: "integrated" as const,
      weapon,
      index,
      name: weapon.name,
    })),
  ].sort(compareWeaponEntries);

  const allMeleeEntries: MeleeInventoryEntry[] = [
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
    ...archeotechIntegratedMeleeItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...equippedIntegratedMelee.map(({ weapon, index }) => ({
      kind: "integrated" as const,
      weapon,
      index,
      name: weapon.name,
    })),
  ].sort(compareWeaponEntries);

  const allGrenadeEntries: ExplosiveInventoryEntry[] = [
    ...grenades.map((item) => ({ kind: "regular" as const, item, name: item.name })),
    ...archeotechGrenadeItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...archeotechMineItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
  ].sort((a, b) => compareEquippedThenName(a.item, b.item));

  const equippedWeaponSlots =
    normalRangedWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    normalMeleeWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
    archeotechRangedItems.filter((item) => item.equipped).length +
    archeotechMeleeWeaponItems.filter((item) => item.equipped).length +
    archeotechIntegratedWeaponItems.filter((item) => item.equipped).length +
    archeotechShieldItems.filter((item) => item.equipped).length +
    equippedIntegratedRanged.reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    equippedIntegratedMelee.reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
    (shields ?? []).filter((item) => item.equipped).length;

  return {
    allRangedEntries,
    allMeleeEntries,
    allGrenadeEntries,
    sortedShields: [...(shields ?? [])].sort(compareEquippedThenName),
    archeotechShieldItems,
    archeotechGrenadeItems,
    equippedWeaponSlots,
    slotsRemaining: MAX_WEAPON_SLOTS - equippedWeaponSlots,
    equippedGrenadeTypes:
      grenades.filter((item) => item.equipped).length +
      [...archeotechGrenadeItems, ...archeotechMineItems].filter((item) => item.equipped).length,
  };
}
