// src/pages/CharacterSheet/weapons/weaponHelpers.ts
// Pure stat-calculation helpers (no React, no JSX).

import type { RangedWeapon, MeleeWeapon, WeaponCraftsmanship } from "../../../types/Character";
import type { AmmoRef } from "../../../data/reference/ammoReference";
import {
  WEAPON_UPGRADE_REFERENCE,
  type WeaponUpgradeRef,
} from "../../../data/reference/weaponUpgradeReference";
import {
  RANGED_WEAPON_REFERENCE,
  MELEE_WEAPON_REFERENCE,
  type RangedWeaponRef,
  type MeleeWeaponRef,
} from "../../../data/reference/weaponReference";
import {
  INTEGRATED_RANGED_IDS,
  INTEGRATED_MELEE_IDS,
  INTEGRATED_RANGED_NAMES,
  INTEGRATED_MELEE_NAMES,
} from "../../../data/reference/integratedWeapons";
import {
  colourAmberFaint,
  colourCyan,
  colourFuchsia,
  colourLime,
  colourOrange,
  colourSky,
  colourTealLight,
  colourViolet,
} from "../../../ui/styles/colourTokens";

// ─── Integrated Weapon Classification ─────────────────────────────────────

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

function reduceRangeByPercent(range: string, percent: number): string {
  const rangeMatch = range.match(/^(\d+)m$/i);
  if (!rangeMatch) return range;
  const reduced = Number(rangeMatch[1]) * (1 - percent / 100);
  return `${Number.isInteger(reduced) ? reduced : reduced.toFixed(1)}m`;
}

function reduceRangeAtMost(range: string, maximum: number): string {
  const rangeMatch = range.match(/^(\d+)m$/i);
  if (!rangeMatch) return range;
  return `${Math.min(parseInt(rangeMatch[1]), maximum)}m`;
}

function setDamageType(damage: string, type: string): string {
  const damageMatch = damage.trim().match(/^(\d*d\d+)([+-]\d+)?\s*[IREX]?$/i);
  if (!damageMatch) return damage;
  return `${damageMatch[1]}${damageMatch[2] ?? ""} ${type}`;
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
  if (!cleaned || cleaned === "-" || cleaned === "—") return toAdd;
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

function multiplyClip(clip: string, multiplier: number): string {
  const numeric = Number.parseFloat(clip);
  return Number.isFinite(numeric) ? String(numeric * multiplier) : clip;
}

function addThrones(value: string | undefined, amount: number): string {
  const parsed = Number.parseInt((value ?? "").replace(/[^\d]/g, ""), 10);
  return `${(Number.isFinite(parsed) ? parsed : 0) + amount} Thrones`;
}

function parseWeightModifier(modifier: string): { multiplier: number; flatKg: number } {
  const trimmed = modifier.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed === "0") {
    return { multiplier: 1, flatKg: 0 };
  }

  const multiplier = trimmed.match(/^(?:×|x)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/i);
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
): { damage: string; range: string; clip: string; pen: string; specialRules: string; weight: string; value: string } {
  let damage = weapon.damage ?? "";
  let range = weapon.range ?? "";
  let clip = weapon.clip ?? "";
  let pen = weapon.pen ?? "";
  let specialRules = weapon.specialRules ?? "";
  let weight = effectiveWeaponWeight(weapon.weight, upgradeRefs);
  let value = weapon.value ?? "";
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
    } else if (ref.id === "ih-forearm-weapon-mounting") {
      range = reduceRangeByPercent(range, 30);
    }
  }
  if (
    weapon.referenceId === "ih-irontalon-pistol" &&
    loadedAmmoRef &&
    loadedAmmoRef.id !== "ih-irontalon-fragmenting-ammunition"
  ) {
    specialRules = removeSpecialRule(removeSpecialRule(specialRules, "Primitive"), "Tearing");
  }
  const loadedModifiers = loadedAmmoRef?.loadedWeaponModifiers;
  if (loadedModifiers?.clipMultiplier) {
    clip = multiplyClip(clip, loadedModifiers.clipMultiplier);
  }
  if (loadedModifiers?.weightKg) {
    weight = formatKg(parseKg(weight) + loadedModifiers.weightKg);
  }
  if (loadedModifiers?.valueThrones) {
    value = addThrones(value, loadedModifiers.valueThrones);
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
    case "ih-blazer-shotgun-shells":
      range = reduceRangeAtMost(range, 15);
      damage = setDamageType(damage, "E");
      specialRules = addSpecialRule(addSpecialRule(specialRules, "Flame"), "Primitive");
      break;
    case "ih-psycannon-bolts":
    case "ih-blessed-ammunition":
      specialRules = addSpecialRule(specialRules, "Holy");
      break;
    case "lw-purity-round":
      specialRules = addSpecialRule(specialRules, "Haywire (2)");
      break;
    default:
      break;
  }
  return { damage, range, clip, pen, specialRules, weight, value };
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
    } else if (ref.id === "ih-sanctified-weapon") {
      specialRules = addSpecialRule(specialRules, "Sanctified");
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
  ammoTracking?: string,
  specialRules?: string,
  craftsmanship?: string,
): WeaponUpgradeRef[] {
  const cls = weaponClass.toLowerCase();
  const name = weaponName.toLowerCase();
  const ammoLower = ammoType?.toLowerCase() ?? "";
  const isLas = ammoLower.includes("charge pack") || ammoLower.includes("las");
  const isSolidProjectile = ["bullets", "shells", "shot"].some((type) => ammoLower.includes(type));
  const isBolt = ammoLower.includes("bolt");
  const isPrimitive = ammoLower.includes("arrow") || ammoLower.includes("quarrel");
  const isMelta = ammoLower.includes("melta");
  const hasIntegralCanister = ammoLower.includes("plasma flask") || ammoLower.includes("melta canister");
  const hasPrimitiveQuality = /(?:^|,)\s*primitive\b/i.test(specialRules ?? "");
  const goodOrBetter = craftsmanship === "Good" || craftsmanship === "Best";
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
      case "ih-duplus-ammo-clips":
        return !isMelee && ammoTracking !== "unit" && (cls === "basic" || cls === "pistol" || isSolidProjectile || isLas);
      case "ih-forearm-weapon-mounting":
        return !isMelee && cls === "pistol" && (isPrimitive || isLas || isSolidProjectile || isBolt || isMelta);
      case "ih-targeter":
        return !isMelee && (cls === "heavy" || isLas || isSolidProjectile || isBolt);
      case "ih-tripod-and-bipods":
        return !isMelee && (cls === "basic" || cls === "heavy" || hasIntegralCanister);
      case "ih-sanctified-weapon":
        return isMelee && goodOrBetter && (hasPrimitiveQuality || currentIds.includes("cr-mono") || name.includes("chain"));
      default:
        return false;
    }
  });
}

// ─── Craftsmanship ─────────────────────────────────────────────────────────

export function rangedCraftsmanshipDescription(craftsmanship: WeaponCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poor ranged weapons are more prone to malfunction. A Poor ranged weapon has the Unreliable quality. If it already has this quality, it jams on any failed roll to hit.";
    case "Good":
      return "Good ranged weapons are more reliable. A Good ranged weapon has the Reliable quality. If it already has the Unreliable quality, the two qualities cancel and the weapon has neither.";
    case "Best":
      return "Best ranged weapons never suffer from jamming or overheating. If a roll would result in either, count it as a miss instead.";
    case "Common":
    default:
      return "Common craftsmanship ranged weapons have no additional modifier.";
  }
}

export function rangedRulesForCraftsmanship(rules: string, craftsmanship: WeaponCraftsmanship): string {
  if (craftsmanship === "Poor") return addSpecialRule(rules, "Unreliable");
  if (craftsmanship === "Good") {
    const hasUnreliable = rules.split(",").some((entry) => entry.trim().toLowerCase() === "unreliable");
    if (hasUnreliable) return removeSpecialRule(removeSpecialRule(rules, "Unreliable"), "Reliable");
    return addSpecialRule(rules, "Reliable");
  }
  return rules;
}

// ─── Weapon Class & Ammo Family Display ───────────────────────────────────

export type AmmoTrackingMode = NonNullable<RangedWeapon["ammoTracking"]>;

const WEAPON_CLASS_STYLES: Record<string, { active: string; inactive: string }> = {
  Pistol: { active: colourSky, inactive: "border-sky-500/30 bg-sky-500/5 text-sky-400/50" },
  Basic:  { active: colourTealLight, inactive: "border-teal-500/30 bg-teal-500/5 text-teal-400/50" },
  Heavy:  { active: colourViolet, inactive: "border-violet-500/30 bg-violet-500/5 text-violet-400/50" },
  Thrown: { active: colourAmberFaint, inactive: "border-amber-500/30 bg-amber-500/5 text-amber-400/50" },
  Exotic: { active: colourFuchsia, inactive: "border-fuchsia-500/30 bg-fuchsia-500/5 text-fuchsia-400/50" },
};

const slateFallbackStyle = "border-slate-500/70 bg-slate-700/40 text-slate-300";

export function weaponClassChip(cls?: string): { label: string; active: string; inactive: string } | undefined {
  if (!cls) return undefined;
  const n = cls.toLowerCase();
  for (const [key, style] of Object.entries(WEAPON_CLASS_STYLES)) {
    if (n.includes(key.toLowerCase())) return { label: key, ...style };
  }
  return { label: cls, active: slateFallbackStyle, inactive: "border-slate-500/30 bg-slate-700/20 text-slate-400/50" };
}

export function ammoFamilyChip(ammoType?: string): { label: string; className: string } | undefined {
  if (!ammoType) return undefined;
  const normalized = ammoType.toLowerCase();
  if (normalized === "las" || normalized.includes("charge pack")) {
    return { label: "Las", className: "border-red-500/60 bg-red-500/10 text-red-300" };
  }
  if (normalized === "bolt" || normalized.includes("bolt")) {
    return { label: "Bolt", className: colourAmberFaint };
  }
  if (normalized === "solid projectile" || normalized.includes("bullet")) {
    return {
      label: "Solid Projectile",
      className: slateFallbackStyle,
    };
  }
  if (normalized === "shell" || normalized.includes("shell") || normalized === "shot") {
    return { label: "Shell", className: colourLime };
  }
  if (normalized === "flame" || normalized.includes("fuel")) {
    return { label: "Flame", className: colourOrange };
  }
  if (normalized === "melta" || normalized.includes("melta")) {
    return { label: "Melta", className: colourViolet };
  }
  if (normalized === "plasma" || normalized.includes("plasma")) {
    return { label: "Plasma", className: colourSky };
  }
  if (normalized === "launcher" || normalized.includes("grenade")) {
    return { label: "Launcher", className: "border-yellow-500/60 bg-yellow-500/10 text-yellow-300" };
  }
  if (normalized === "primitive" || normalized.includes("arrow") || normalized.includes("quarrel")) {
    return { label: "Primitive", className: "border-stone-500/70 bg-stone-700/30 text-stone-300" };
  }
  if (normalized === "shuriken" || normalized.includes("shuriken")) {
    return { label: "Shuriken", className: colourFuchsia };
  }
  if (normalized === "power cell" || normalized.includes("power cell")) {
    return { label: "Power Cell", className: colourCyan };
  }
  if (normalized === "exotic" || normalized.includes("exotic")) {
    return { label: "Exotic", className: colourTealLight };
  }
  return { label: ammoType, className: slateFallbackStyle };
}

// ─── Custom Ammo Families ──────────────────────────────────────────────────

export const CUSTOM_AMMO_FAMILY_OPTIONS = [
  {
    label: "Las",
    ammoType: "Las",
    compatibleAmmoIds: [
      "cr-charge-pack-pistol",
      "cr-charge-pack-basic",
      "cr-charge-pack-heavy",
      "cr-hot-shot-charge",
    ],
  },
  {
    label: "Bolt",
    ammoType: "Bolt",
    compatibleAmmoIds: ["cr-bolt-shells", "cr-inferno-shells", "dh-psybolt-ammunition"],
  },
  {
    label: "Solid Projectile",
    ammoType: "Solid Projectile",
    compatibleAmmoIds: ["cr-bullets", "cr-dumdum-bullets", "cr-man-stopper-bullets"],
  },
  {
    label: "Shell",
    ammoType: "Shell",
    compatibleAmmoIds: ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"],
  },
  {
    label: "Flame",
    ammoType: "Flame",
    compatibleAmmoIds: ["cr-fuel-pistol", "cr-fuel-basic", "dh-psyflame-ammunition"],
  },
  {
    label: "Melta",
    ammoType: "Melta",
    compatibleAmmoIds: ["cr-melta-canister-pistol", "cr-melta-canister-basic"],
  },
  {
    label: "Plasma",
    ammoType: "Plasma",
    compatibleAmmoIds: ["cr-plasma-flask-pistol", "cr-plasma-flask-basic"],
  },
  { label: "Launcher", ammoType: "Launcher", compatibleAmmoIds: [] },
  {
    label: "Primitive",
    ammoType: "Primitive",
    compatibleAmmoIds: ["cr-arrows-quarrels", "cr-shot", "lw-purity-round"],
  },
  { label: "Shuriken", ammoType: "Shuriken", compatibleAmmoIds: ["ca-shuriken-clip"] },
  { label: "Power Cell", ammoType: "Power Cell", compatibleAmmoIds: ["dh-synapse-power-cell"] },
  { label: "Exotic", ammoType: "Exotic", compatibleAmmoIds: ["cr-exotic"] },
] as const;

export function compatibleAmmoIdsForAmmoType(ammoType?: string): readonly string[] | undefined {
  return CUSTOM_AMMO_FAMILY_OPTIONS.find((option) => option.ammoType === ammoType)
    ?.compatibleAmmoIds;
}

/** Adds source-specific special ammunition available to a weapon's existing ammo family. */
export function compatibleAmmoIdsWithIH(
  ids: readonly string[] | undefined,
  ammoType?: string,
  weaponClass?: string
): readonly string[] | undefined {
  if (!ids) return ids;

  const type = ammoType?.toLowerCase() ?? "";
  const extras = new Set<string>();
  const isSolidProjectile =
    type === "bullets" || type === "shells" || type === "shot" || type === "solid projectile";

  if (type === "shells") extras.add("ih-blazer-shotgun-shells");
  if (isSolidProjectile) {
    extras.add("ih-void-rounds");
    extras.add("ih-blessed-ammunition");
  }
  if (type === "bolt shells" || type === "bolt") {
    extras.add("ih-psycannon-bolts");
    extras.add("ih-blessed-ammunition");
  }
  if (type === "fuel (pistol)" || type === "fuel (basic)" || type === "flame") {
    extras.add("ih-blessed-ammunition");
  }

  const isNonPistol = !weaponClass?.toLowerCase().includes("pistol");
  if (isNonPistol && type === "melta canister (basic)") extras.add("cr-melta-backpack-feed-line");
  if (isNonPistol && type === "plasma flask (basic)") extras.add("cr-plasma-backpack-feed-line");
  if (isNonPistol && type === "fuel (basic)") extras.add("cr-flamer-backpack-fuel-hose");

  return [...new Set([...ids, ...extras])];
}

// ─── Melee Craftsmanship ────────────────────────────────────────────────────

export function meleeCraftsmanshipDescription(craftsmanship: WeaponCraftsmanship): string {
  switch (craftsmanship) {
    case "Poor":
      return "Poor melee weapons incur a -10 penalty to Tests made to attack.";
    case "Good":
      return "Good melee weapons add a +5 bonus to Tests made to attack.";
    case "Best":
      return "Best melee weapons add a +10 bonus to Tests made to attack and add 1 to the Damage they inflict.";
    case "Common":
    default:
      return "Common craftsmanship melee weapons have no additional modifier.";
  }
}

export function meleeDamageForCraftsmanship(damage: string, craftsmanship: WeaponCraftsmanship): string {
  if (craftsmanship !== "Best") return damage;
  return modifyDamageBonus(damage, 1);
}

// ─── Melee Class Chips ──────────────────────────────────────────────────────

export function meleeClassChips(cls?: string): { label: string; className: string }[] {
  if (!cls) return [];
  const normalized = cls.toLowerCase();
  const chips: { label: string; className: string }[] = [];
  if (normalized.includes("melee")) {
    chips.push({ label: "Melee", className: colourOrange });
  }
  if (normalized.includes("thrown")) {
    chips.push({ label: "Thrown", className: colourAmberFaint });
  }
  return chips;
}
