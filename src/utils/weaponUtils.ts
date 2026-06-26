import type { WeaponCraftsmanship, RangedWeapon, MeleeWeapon } from "../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  type RangedWeaponRef,
  type MeleeWeaponRef,
} from "../data/reference/weaponReference";
import {
  INTEGRATED_RANGED_IDS,
  INTEGRATED_MELEE_IDS,
  INTEGRATED_RANGED_NAMES,
  INTEGRATED_MELEE_NAMES,
} from "../data/reference/integratedWeapons";

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isIntegratedRangedRef(ref: RangedWeaponRef): boolean {
  return INTEGRATED_RANGED_IDS.has(ref.id);
}

export function isIntegratedMeleeRef(ref: MeleeWeaponRef): boolean {
  return INTEGRATED_MELEE_IDS.has(ref.id);
}

export function isIntegratedRangedWeapon(weapon: RangedWeapon): boolean {
  // referenceId is the primary check. The name fallback handles weapons added
  // before referenceId existed — legacy data only has a name, not an id.
  return (
    weapon.integrated === true ||
    (weapon.referenceId ? INTEGRATED_RANGED_IDS.has(weapon.referenceId) : false) ||
    INTEGRATED_RANGED_NAMES.has(normaliseName(weapon.name))
  );
}

export function isIntegratedMeleeWeapon(weapon: MeleeWeapon): boolean {
  // referenceId is the primary check. The name fallback handles weapons added
  // before referenceId existed — legacy data only has a name, not an id.
  return (
    weapon.integrated === true ||
    (weapon.referenceId ? INTEGRATED_MELEE_IDS.has(weapon.referenceId) : false) ||
    INTEGRATED_MELEE_NAMES.has(normaliseName(weapon.name))
  );
}

export const NORMAL_RANGED_REFS = RANGED_WEAPON_REFERENCE.filter((ref) => !isIntegratedRangedRef(ref));
export const NORMAL_MELEE_REFS = MELEE_WEAPON_REFERENCE.filter((ref) => !isIntegratedMeleeRef(ref));
export const INTEGRATED_RANGED_REFS = RANGED_WEAPON_REFERENCE.filter(isIntegratedRangedRef);
export const INTEGRATED_MELEE_REFS = MELEE_WEAPON_REFERENCE.filter(isIntegratedMeleeRef);

export function addSpecialRule(rules: string, rule: string): string {
  const cleaned = rules.trim();
  if (!cleaned || cleaned === "-" || cleaned === "—") return rule;
  const existing = cleaned.split(",").map((entry) => entry.trim().toLowerCase());
  if (existing.includes(rule.toLowerCase())) return cleaned;
  return `${cleaned}, ${rule}`;
}

export function rangedRulesForCraftsmanship(rules: string, craftsmanship: WeaponCraftsmanship): string {
  if (craftsmanship === "Poor") return addSpecialRule(rules, "Unreliable");
  if (craftsmanship === "Good") return addSpecialRule(rules, "Reliable");
  return rules;
}

export function modifyDamageBonus(damage: string, delta: number): string {
  const match = damage.trim().match(/^(\d*d\d+)([+-]\d+)?\s*([IREX])?$/i);
  if (!match) return damage;
  const dice = match[1];
  const bonus = (match[2] ? parseInt(match[2], 10) : 0) + delta;
  const type = match[3] ? ` ${match[3].toUpperCase()}` : "";
  if (bonus === 0) return `${dice}${type}`.trim();
  return `${dice}${bonus > 0 ? "+" : ""}${bonus}${type}`.trim();
}

export function meleeDamageForCraftsmanship(damage: string, craftsmanship: WeaponCraftsmanship): string {
  if (craftsmanship !== "Best") return damage;
  return modifyDamageBonus(damage, 1);
}

type ComparableEntry =
  | { kind: "regular"; weapon: { equipped?: boolean }; name: string }
  | { kind: "cybernetic"; name: string }
  | { kind: "archeotech"; item: { equipped?: boolean }; name: string }
  | { kind: "integrated"; weapon: { equipped?: boolean }; name: string };

export function compareWeaponEntries(a: ComparableEntry, b: ComparableEntry): number {
  if (a.kind === "cybernetic" && b.kind !== "cybernetic") return -1;
  if (b.kind === "cybernetic" && a.kind !== "cybernetic") return 1;
  const aEq =
    a.kind === "regular" || a.kind === "integrated" ? (a.weapon.equipped ? 0 : 1)
    : a.kind === "archeotech" ? (a.item.equipped ? 0 : 1)
    : 0;
  const bEq =
    b.kind === "regular" || b.kind === "integrated" ? (b.weapon.equipped ? 0 : 1)
    : b.kind === "archeotech" ? (b.item.equipped ? 0 : 1)
    : 0;
  if (aEq !== bEq) return aEq - bEq;
  return a.name.localeCompare(b.name);
}
