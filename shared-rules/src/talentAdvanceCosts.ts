import { getNextTalentOrTraitPurchase } from "./careerAdvanceAccess.js";
import type { CharacterForTalentCosts, TalentEntryForCost } from "./types.js";

/** Total XP recorded against owned Talents and Traits. */
export function getTalentsSpent(character: CharacterForTalentCosts): number {
  const career = character.header.career;
  const rank = character.header.rank;
  const alternateRanks = character.experience?.alternateRanks ?? [];
  const counted: TalentEntryForCost[] = [];
  let total = 0;

  for (const entry of [
    ...character.talentsAndTraits.talents,
    ...character.talentsAndTraits.traits,
  ]) {
    if (entry.grantedByTalentEntryUid) continue;
    const legacyPurchase = getNextTalentOrTraitPurchase(
      career,
      rank,
      entry.talentId,
      entry.specialisation,
      counted,
      alternateRanks
    );
    total += entry.xpPurchase?.cost ?? legacyPurchase?.cost ?? entry.manualCost ?? 0;
    counted.push(entry);
  }

  return total;
}
