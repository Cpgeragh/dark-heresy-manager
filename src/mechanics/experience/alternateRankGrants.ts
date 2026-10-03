import { ALTERNATE_RANKS, ELITE_ADVANCES } from "shared-rules";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";
import { MELEE_WEAPON_REFERENCE } from "../../data/reference/weaponReference";
import type { GearItem, MeleeWeapon, TalentsAndTraitsBlock } from "../../types/Character";

function grantOriginId(alternateRankId: string): string {
  return `alternate-rank:${alternateRankId}`;
}

export function applyAlternateRankGearGrants(
  gear: readonly GearItem[],
  alternateRankId: string
): GearItem[] | readonly GearItem[] {
  const alternateRank = ALTERNATE_RANKS.find((rank) => rank.id === alternateRankId);
  if (!alternateRank?.grantedGear?.length) return gear;

  const originId = grantOriginId(alternateRankId);
  return [
    ...gear.filter((item) => item.grantedByTalentEntryUid !== originId),
    ...alternateRank.grantedGear.map((grant): GearItem => {
      const reference = GEAR_REFERENCE.find((item) => item.id === grant.referenceId);
      return {
        id: `${originId}:gear:${grant.id}`,
        referenceId: grant.referenceId,
        name: reference?.name ?? grant.name,
        description: reference?.description ?? grant.description,
        weight: reference?.weight,
        value: reference?.value,
        availability: reference?.availability,
        source: reference?.source ?? alternateRank.source,
        grantedByTalentEntryUid: originId,
        grantedByTalentName: alternateRank.name,
        grantedByType: "Alternate Rank",
      };
    }),
  ];
}

export function applyAlternateRankMeleeWeaponGrant(
  weapons: readonly MeleeWeapon[],
  alternateRankId: string,
  choiceId: string,
  referenceId: string
): MeleeWeapon[] | readonly MeleeWeapon[] {
  const alternateRank = ALTERNATE_RANKS.find((rank) => rank.id === alternateRankId);
  const choice = alternateRank?.grantedMeleeWeaponChoice;
  if (!choice || choice.id !== choiceId || !choice.referenceIds.includes(referenceId)) {
    return weapons;
  }
  const reference = MELEE_WEAPON_REFERENCE.find((weapon) => weapon.id === referenceId);
  if (!reference) return weapons;

  const originId = grantOriginId(alternateRankId);
  const grantId = `${originId}:melee-weapon:${choice.id}`;
  return [
    ...weapons.filter((weapon) => weapon.id !== grantId),
    {
      id: grantId,
      referenceId: reference.id,
      name: reference.name,
      class: reference.class,
      type: reference.type,
      damage: reference.damage,
      pen: String(reference.pen),
      specialRules: reference.specialRules,
      weight: reference.weight,
      value: reference.value,
      availability: reference.availability,
      source: reference.source,
      description: reference.description,
      craftsmanship: "Common",
      upgrades: [],
    },
  ];
}

export function applyAlternateRankEliteAdvanceGrants(
  talents: TalentsAndTraitsBlock,
  alternateRankId: string
): TalentsAndTraitsBlock {
  const alternateRank = ALTERNATE_RANKS.find((rank) => rank.id === alternateRankId);
  if (!alternateRank?.grantedEliteAdvances?.length) return talents;

  const existing = talents.eliteAdvances ?? [];
  const retained = existing.filter((entry) => entry.grantedByAlternateRankId !== alternateRankId);
  const granted = alternateRank.grantedEliteAdvances.map((eliteAdvanceId) => {
    const reference = ELITE_ADVANCES.find((advance) => advance.id === eliteAdvanceId);
    return {
      uid: `${grantOriginId(alternateRankId)}:elite-advance:${eliteAdvanceId}`,
      eliteAdvanceId,
      name: reference?.name ?? eliteAdvanceId,
      grantedByAlternateRankId: alternateRankId,
      grantedByAlternateRankName: alternateRank.name,
    };
  });

  return { ...talents, eliteAdvances: [...retained, ...granted] };
}
