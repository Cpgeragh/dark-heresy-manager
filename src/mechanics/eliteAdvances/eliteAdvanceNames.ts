import { ALTERNATE_RANKS, type EliteAdvanceData } from "shared-rules";

/** The names of the Alternate Ranks that make a package available. */
export function getAlternateRankNames(advance: EliteAdvanceData): string[] {
  return (advance.alternateRankIds ?? []).map(
    (rankId) => ALTERNATE_RANKS.find((rank) => rank.id === rankId)?.name ?? rankId
  );
}
