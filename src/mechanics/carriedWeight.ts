import type {
  ArcheotechItem,
  Character,
  MeleeWeapon,
  RangedWeapon,
  WornArmourPiece,
} from "../types/Character";
import { AMMO_REFERENCE, ammoCapacityForWeapon } from "../data/reference/ammoReference";
import { ARCHEOTECH_REFERENCE } from "../data/reference/archeotechReference";
import { ARMOUR_UPGRADE_REFERENCE } from "../data/reference/armourUpgradeReference";
import { DRUGS_REFERENCE } from "../data/reference/drugsReference";
import { WEAPON_UPGRADE_REFERENCE } from "../data/reference/weaponUpgradeReference";
import {
  RANGED_WEAPON_REFERENCE,
  resolveMeleeWeaponReference,
  resolveRangedWeaponReference,
} from "../data/reference/weaponReference";
import { effectiveArmourWeight } from "../pages/CharacterSheet/ArmourTab/armourHelpers";
import {
  alternateRangedAmmoEntriesOf,
  ammoEntryWeightKg,
  effectiveMeleeStats,
  effectiveRangedStats,
  isIntegratedMeleeWeapon,
  isIntegratedRangedWeapon,
  pistolAmmoEntryWeightKg,
  type AmmoTrackingMode,
} from "../pages/CharacterSheet/weapons/weaponHelpers";
import { readWeightKg } from "../ui/format/weightFormat";
import { isInstalled } from "../utils/cyberneticInstalled";

type CarriedWeightSource = Pick<Character, "rangedWeapons" | "meleeWeapons" | "armour"> &
  Partial<
    Pick<
      Character,
      "gear" | "consumables" | "drugs" | "grenades" | "shields" | "cybernetics" | "archeotech"
    >
  >;

const PRIMARY_PROFILE = "Primary";

function weightKg(weight?: string): number {
  return Math.max(0, readWeightKg(weight) ?? 0);
}

function sum<T>(items: readonly T[] | undefined, kgOf: (item: T) => number): number {
  return (items ?? []).reduce((total, item) => total + kgOf(item), 0);
}

function rangedWeaponKg(weapon: RangedWeapon): number {
  if (isIntegratedRangedWeapon(weapon)) return 0;
  const weaponRef = weapon.referenceId
    ? resolveRangedWeaponReference(weapon.referenceId)
    : RANGED_WEAPON_REFERENCE.find(
        (ref) => ref.name === weapon.name && (!weapon.source || ref.source === weapon.source)
      );
  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  const alternateProfiles = weaponRef?.alternateProfiles ?? [];
  const ammoTracking: AmmoTrackingMode = weapon.ammoTracking ?? weaponRef?.ammoTracking ?? "clip";
  const usesMagazineSlots = (weaponRef?.magazineSlots ?? 0) > 0;
  const magazineSlots = weapon.magazineSlots ?? [];
  const profileKeys = [PRIMARY_PROFILE, ...alternateProfiles.map((profile) => profile.label)];

  let weaponOnlyKg = 0;
  let ammoKg = 0;
  for (const profileKey of profileKeys) {
    const profile = alternateProfiles.find((candidate) => candidate.label === profileKey);
    const entries = (weapon.ammoEntries ?? []).filter(
      (entry) => alternateProfiles.length === 0 || (entry.profile ?? PRIMARY_PROFILE) === profileKey
    );
    const loadedEntry =
      entries.find((entry) => entry.id === weapon.loadedAmmoByProfile?.[profileKey]) ??
      entries.find((entry) => entry.loaded);
    const activeSlot =
      magazineSlots.find((slot) => slot.id === weapon.activeMagazineSlotId) ??
      magazineSlots.find((slot) => slot.referenceId);
    const loadedAmmoReferenceId =
      usesMagazineSlots && !profile ? activeSlot?.referenceId : loadedEntry?.referenceId;
    const loadedAmmoRef = loadedAmmoReferenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedAmmoReferenceId)
      : undefined;
    const baseWeapon = profile ? { ...weapon, clip: String(profile.clip) } : weapon;
    const effective = effectiveRangedStats(baseWeapon, upgradeRefs, loadedAmmoRef);
    const clip =
      ammoCapacityForWeapon(loadedAmmoRef, weapon.referenceId, effective.clip) ?? effective.clip;
    if (profileKey === PRIMARY_PROFILE) weaponOnlyKg = weightKg(effective.weight);
    ammoKg += sum(entries, (entry) =>
      ammoEntryWeightKg(entry, weapon.referenceId, effective.weight, clip, ammoTracking)
    );
  }
  return weaponOnlyKg * (weapon.quantity ?? 1) + ammoKg;
}

function meleeWeaponKg(weapon: MeleeWeapon): number {
  if (isIntegratedMeleeWeapon(weapon)) return 0;
  const weaponRef = resolveMeleeWeaponReference(weapon.referenceId);
  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  const effective = effectiveMeleeStats(weapon, upgradeRefs);
  const pistolProfile = weaponRef?.alternateRangedProfile;
  const ammoKg = pistolProfile
    ? sum(alternateRangedAmmoEntriesOf(weapon), (entry) =>
        pistolAmmoEntryWeightKg(effective.weight, String(pistolProfile.clip), entry)
      )
    : 0;
  return weightKg(effective.weight) * (weapon.quantity ?? 1) + ammoKg;
}

function armourPieceKg(piece: WornArmourPiece): number {
  const upgradeIds = piece.upgrades ?? [];
  const upgradeRefs = ARMOUR_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  return weightKg(effectiveArmourWeight(piece, upgradeRefs));
}

function archeotechKg(item: ArcheotechItem): number {
  if (item.type === "Integrated Weapon") return 0;
  if (item.type === "Cybernetic" && isInstalled(item)) return 0;
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((candidate) => candidate.id === item.referenceId)
    : undefined;
  return weightKg(item.weight ?? ref?.weight);
}

export function calcCarriedWeightKg(character: CarriedWeightSource): number {
  const total =
    sum(character.rangedWeapons, rangedWeaponKg) +
    sum(character.meleeWeapons, meleeWeaponKg) +
    sum(character.armour, armourPieceKg) +
    sum(character.shields, (item) => weightKg(item.weight)) +
    sum(character.gear, (item) => weightKg(item.weight)) +
    sum(character.consumables, (item) => weightKg(item.weight) * item.quantity) +
    sum(
      character.drugs,
      (item) =>
        weightKg(
          item.weight ?? DRUGS_REFERENCE.find((ref) => ref.id === item.referenceId)?.weight
        ) * item.quantity
    ) +
    sum(character.grenades, (item) => weightKg(item.weight) * item.quantity) +
    sum(character.cybernetics, (item) => (isInstalled(item) ? 0 : weightKg(item.weight))) +
    sum(character.archeotech, archeotechKg);
  return Number(total.toFixed(2));
}
