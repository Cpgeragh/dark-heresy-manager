// src/features/experience/xpSpent.ts

import type { Character } from "../../types/Character";
import { getCharacteristicAdvancesSpent } from "./characteristicAdvanceCosts";
import { getSkillsSpent } from "./skillAdvanceCosts";
import { getTalentsSpent } from "./talentAdvanceCosts";
import { getWeaponTrainingSpent } from "./weaponTrainingAdvanceCosts";

function getRanksSpent(character: Character): number {
  return character.experience.ranks.reduce(
    (total, rank) => total + rank.advances.reduce((sum, advance) => sum + advance.cost, 0),
    0
  );
}

/** The single source of truth for how much XP a character has spent. */
export function getSpentXp(character: Character): number {
  return (
    getRanksSpent(character) +
    getCharacteristicAdvancesSpent(character) +
    getSkillsSpent(character) +
    getTalentsSpent(character) +
    getWeaponTrainingSpent(character)
  );
}
