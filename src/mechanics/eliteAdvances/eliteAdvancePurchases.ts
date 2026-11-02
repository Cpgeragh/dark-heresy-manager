import { WEAPON_TRAINING_GROUPS } from "shared-rules";
import type {
  EliteAdvancePurchase,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import { getSkillDefinition } from "../../utils/skillUtils";

export type EliteSkillTier = Exclude<SkillAdvanceLevel, "untrained">;

const SKILL_LEVELS: readonly SkillAdvanceLevel[] = ["untrained", "trained", "+10", "+20"];

export interface EliteSkillPurchase {
  skillId: string;
  name: string;
  tier: EliteSkillTier;
  purchase: EliteAdvancePurchase;
}

/** One entry for every skill tier that was bought through an Elite Advance and is still owned. */
export function getEliteSkillPurchases(skills: readonly SkillEntry[]): EliteSkillPurchase[] {
  return skills
    .flatMap((skill) =>
      (SKILL_LEVELS.slice(1) as EliteSkillTier[]).flatMap((tier) => {
        const purchase = skill.eliteAdvancePurchases?.[tier];
        if (!purchase || SKILL_LEVELS.indexOf(tier) > SKILL_LEVELS.indexOf(skill.level)) return [];
        return [
          {
            skillId: skill.id,
            name: getSkillDefinition(skill.id)?.name ?? skill.name,
            tier,
            purchase,
          },
        ];
      })
    )
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en-GB") ||
        SKILL_LEVELS.indexOf(left.tier) - SKILL_LEVELS.indexOf(right.tier)
    );
}

/** Every owned Talent that was bought through an Elite Advance. */
export function getEliteTalentPurchases(talents: readonly TalentEntry[]): TalentEntry[] {
  return talents
    .filter((entry) => entry.eliteAdvancePurchase !== undefined)
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));
}

export interface EliteTrainingPurchase {
  id: WeaponTrainingTalentId;
  name: string;
  purchase: EliteAdvancePurchase;
}

function getTrainingName(id: WeaponTrainingTalentId): string {
  for (const group of WEAPON_TRAINING_GROUPS) {
    const item = group.items.find((entry) => entry.id === id);
    if (item) return `${group.label} (${item.display})`;
  }
  return id;
}

/** Every fixed weapon training group that was bought through an Elite Advance. */
export function getEliteTrainingPurchases(
  weaponTraining: WeaponTrainingBlock
): EliteTrainingPurchase[] {
  return weaponTraining.trained
    .flatMap((id) => {
      const purchase = weaponTraining.eliteAdvancePurchases?.[id];
      return purchase ? [{ id, name: getTrainingName(id), purchase }] : [];
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));
}
