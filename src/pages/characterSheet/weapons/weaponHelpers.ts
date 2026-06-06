// src/pages/characterSheet/weapons/weaponHelpers.ts
// Pure stat-calculation helpers (no React, no JSX).

import type { RangedWeapon, MeleeWeapon } from "../../../types/Character";
import type { AmmoRef } from "../../../data/reference/ammoReference";
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

// ─── Effective Stats (after attachments) ─────────────────────────────────────

export function effectiveRangedStats(
  weapon: RangedWeapon,
  attachmentRefs: WeaponUpgradeRef[],
  loadedAmmoRef?: AmmoRef
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
