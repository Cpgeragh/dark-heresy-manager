// src/pages/characterSheet/weapons/weaponHelpers.ts
// Pure stat-calculation helpers (no React, no JSX).

import type { RangedWeapon, MeleeWeapon } from "../../../types/Character";
import type { AmmoRef } from "../../../data/reference/ammoReference";
import {
  WEAPON_UPGRADE_REFERENCE,
  type WeaponUpgradeRef,
} from "../../../data/reference/weaponUpgradeReference";

// ─── Upgrade Stat Modifiers ────────────────────────────────────────────────

export function modifyDamageBonus(damage: string, delta: number): string {
  const dmgMatch = damage.trim().match(/^(\d*d\d+)([+-]\d+)?\s*([IREX])?$/i);
  if (!dmgMatch) return damage;
  const dice = dmgMatch[1];
  const bonus = (dmgMatch[2] ? parseInt(dmgMatch[2]) : 0) + delta;
  const type = dmgMatch[3] ? ` ${dmgMatch[3].toUpperCase()}` : "";
  if (bonus === 0) return `${dice}${type}`.trim();
  return `${dice}${bonus > 0 ? "+" : ""}${bonus}${type}`.trim();
}

export function halveRange(range: string): string {
  const rangeMatch = range.match(/^(\d+)m$/i);
  if (!rangeMatch) return range;
  return `${Math.ceil(parseInt(rangeMatch[1]) / 2)}m`;
}

export function halveClip(clip: string): string {
  const clipVal = parseInt(clip);
  return isNaN(clipVal) ? clip : String(Math.max(1, Math.ceil(clipVal / 2)));
}

export function modifyPen(pen: string, delta: number): string {
  const penVal = parseInt(pen);
  return isNaN(penVal) ? pen : String(Math.max(0, penVal + delta));
}

export function addSpecialRule(rules: string, toAdd: string): string {
  const cleaned = rules.trim();
  if (!cleaned || cleaned === "-" || cleaned === "—" || cleaned === "â€”") return toAdd;
  const existing = cleaned.split(",").map((r) => r.trim().toLowerCase());
  if (existing.includes(toAdd.toLowerCase())) return cleaned;
  return `${cleaned}, ${toAdd}`;
}

function setPenAtLeast(pen: string, value: number): string {
  const penVal = parseInt(pen);
  if (isNaN(penVal)) return String(value);
  return String(Math.max(penVal, value));
}

export function removeSpecialRule(rules: string, toRemove: string): string {
  const result = rules
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r.toLowerCase() !== toRemove.toLowerCase())
    .filter(Boolean)
    .join(", ");
  return result || "—";
}

function formatKg(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0 kg";
  return `${Number(value.toFixed(2))} kg`;
}

function parseKg(value?: string): number {
  const match = value?.trim().match(/^(\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  return match ? Number(match[1]) : 0;
}

function parseWeightModifier(modifier: string): { multiplier: number; flatKg: number } {
  const trimmed = modifier.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "â€”" || trimmed === "0") {
    return { multiplier: 1, flatKg: 0 };
  }

  const multiplier = trimmed.match(/^(?:×|x|Ã—)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/i);
  if (multiplier) {
    const numerator = Number(multiplier[1]);
    const denominator = Number(multiplier[2]);
    return { multiplier: denominator > 0 ? numerator / denominator : 1, flatKg: 0 };
  }

  const flat = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  if (flat) return { multiplier: 1, flatKg: Number(flat[1]) };

  return { multiplier: 1, flatKg: 0 };
}

export function effectiveWeaponWeight(
  weight: string | undefined,
  upgradeRefs: WeaponUpgradeRef[]
): string {
  const baseWeight = parseKg(weight);
  const modifiers = upgradeRefs.map((ref) => parseWeightModifier(ref.weightModifier));
  const multiplier = modifiers.reduce((total, modifier) => total * modifier.multiplier, 1);
  const flatKg = modifiers.reduce((total, modifier) => total + modifier.flatKg, 0);
  return formatKg(baseWeight * multiplier + flatKg);
}

// ─── Effective Stats (after upgrades) ─────────────────────────────────────

export function effectiveRangedStats(
  weapon: RangedWeapon,
  upgradeRefs: WeaponUpgradeRef[],
  loadedAmmoRef?: AmmoRef
): { damage: string; range: string; clip: string; pen: string; specialRules: string; weight: string } {
  let damage = weapon.damage ?? "";
  let range = weapon.range ?? "";
  let clip = weapon.clip ?? "";
  let pen = weapon.pen ?? "";
  let specialRules = weapon.specialRules ?? "";
  const weight = effectiveWeaponWeight(weapon.weight, upgradeRefs);
  for (const ref of upgradeRefs) {
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
  switch (loadedAmmoRef?.id) {
    case "cr-dumdum-bullets":
      damage = modifyDamageBonus(damage, +2);
      break;
    case "cr-hot-shot-charge":
      damage = modifyDamageBonus(damage, +1);
      pen = setPenAtLeast(pen, 4);
      clip = "1";
      specialRules = removeSpecialRule(specialRules, "Reliable");
      break;
    case "cr-man-stopper-bullets":
      pen = modifyPen(pen, +3);
      break;
    case "dh-cryptus-shotgun-shells":
      specialRules = addSpecialRule(specialRules, "Sanctified");
      break;
    case "dh-psybolt-ammunition":
      specialRules = addSpecialRule(specialRules, "Sanctified");
      break;
    case "lw-purity-round":
      specialRules = addSpecialRule(specialRules, "Haywire (2)");
      break;
    default:
      break;
  }
  return { damage, range, clip, pen, specialRules, weight };
}

export function effectiveMeleeStats(
  weapon: MeleeWeapon,
  upgradeRefs: WeaponUpgradeRef[]
): { pen: string; specialRules: string; weight: string } {
  let pen = weapon.pen ?? "";
  let specialRules = weapon.specialRules ?? "";
  const weight = effectiveWeaponWeight(weapon.weight, upgradeRefs);
  for (const ref of upgradeRefs) {
    if (ref.id === "cr-mono") {
      pen = modifyPen(pen, +2);
      specialRules = removeSpecialRule(specialRules, "Primitive");
    }
  }
  return { pen, specialRules, weight };
}

// ─── Compatible Upgrades ──────────────────────────────────────────────────────

export function getCompatibleUpgrades(
  weaponClass: string,
  weaponName: string,
  isMelee: boolean,
  currentIds: string[],
  ammoType?: string,
): WeaponUpgradeRef[] {
  const cls = weaponClass.toLowerCase();
  const name = weaponName.toLowerCase();
  const hasSight = currentIds.some(
    (id) => id === "cr-red-dot-laser-sight" || id === "cr-telescopic-sight"
  );
  return WEAPON_UPGRADE_REFERENCE.filter((upgrade) => {
    if (upgrade.isCreationComponent) return false;
    if (currentIds.includes(upgrade.id)) return false;
    switch (upgrade.id) {
      case "cr-compact":
        return !isMelee && (cls === "pistol" || cls === "basic");
      case "cr-exterminator":
        return true;
      case "cr-extra-grip":
        return !isMelee && cls === "basic";
      case "cr-fire-selector":
        return !isMelee && (cls === "pistol" || cls === "basic");
      case "cr-melee-upgrade":
        return !isMelee && cls === "basic";
      case "cr-mono":
        return isMelee;
      case "cr-overcharge-pack": {
        const ammoLower = ammoType?.toLowerCase() ?? "";
        const isLas = ammoLower === "las" || ammoLower.includes("charge pack");
        return !isMelee && (cls === "pistol" || cls === "basic") && isLas;
      }
      case "cr-red-dot-laser-sight":
        return !isMelee && !hasSight && (cls === "pistol" || cls === "basic");
      case "cr-silencer":
        return (
          !isMelee &&
          (name.includes("stub") ||
            name.includes("hand cannon") ||
            name.includes("autogun") ||
            name.includes("hunting rifle"))
        );
      case "cr-telescopic-sight":
        return !isMelee && !hasSight && cls === "basic";
      default:
        return false;
    }
  });
}
