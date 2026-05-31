// src/pages/characterSheet/weapons/weaponHelpers.ts
// Pure stat-calculation helpers (no React, no JSX).

import type { RangedWeapon, MeleeWeapon } from "../../../types/Character";
import {
  WEAPON_UPGRADE_REFERENCE,
  type WeaponUpgradeRef,
} from "../../../data/reference/weaponUpgradeReference";

// ─── Attachment Stat Modifiers ────────────────────────────────────────────────

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

export function removeSpecialRule(rules: string, toRemove: string): string {
  const result = rules
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r.toLowerCase() !== toRemove.toLowerCase())
    .filter(Boolean)
    .join(", ");
  return result || "—";
}

// ─── Effective Stats (after attachments) ─────────────────────────────────────

export function effectiveRangedStats(
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

export function effectiveMeleeStats(
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

// ─── Compatible Upgrades ──────────────────────────────────────────────────────

export function getCompatibleUpgrades(
  weaponClass: string,
  weaponName: string,
  isMelee: boolean,
  currentIds: string[]
): WeaponUpgradeRef[] {
  const cls = weaponClass.toLowerCase();
  const name = weaponName.toLowerCase();
  const hasSight = currentIds.some(
    (id) => id === "cr-red-dot-laser-sight" || id === "cr-telescopic-sight"
  );
  return WEAPON_UPGRADE_REFERENCE.filter((u) => {
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
