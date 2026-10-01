import { ALTERNATE_RANKS } from "../../data/reference/alternateRankData";
import { ELITE_ADVANCES } from "../../data/reference/eliteAdvanceData";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";
import type { GearItem, TalentsAndTraitsBlock } from "../../types/Character";

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
