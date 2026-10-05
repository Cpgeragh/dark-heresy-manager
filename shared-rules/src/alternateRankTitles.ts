import { ALTERNATE_RANKS } from "./alternateRankData.js";
import type { AlternateRankSelection } from "./types.js";

export function getAlternateRankTitles(alternateRankId: string, tier: number): readonly string[] {
  const alternateRank = ALTERNATE_RANKS.find((entry) => entry.id === alternateRankId);
  return alternateRank?.rankTitles?.find((entry) => entry.tier === tier)?.names ?? [];
}

export function getRankDisplayName(
  selections: readonly AlternateRankSelection[],
  rank: { id: string; tier: number; name: string }
): string {
  const replacing = selections.find((selection) => selection.replacedRankId === rank.id);
  if (replacing) {
    const alternateRank = ALTERNATE_RANKS.find((entry) => entry.id === replacing.alternateRankId);
    if (!alternateRank) return rank.name;
    const titles = getAlternateRankTitles(alternateRank.id, rank.tier);
    const chosen = replacing.titleChoices?.[String(rank.tier)];
    return chosen && titles.includes(chosen) ? chosen : (titles[0] ?? alternateRank.name);
  }
  for (const selection of selections) {
    if (selection.takenAtTier >= rank.tier) continue;
    const chosen = selection.titleChoices?.[String(rank.tier)];
    if (chosen && getAlternateRankTitles(selection.alternateRankId, rank.tier).includes(chosen)) {
      return chosen;
    }
  }
  return rank.name;
}
