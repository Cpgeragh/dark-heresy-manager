import type {
  EliteAdvancePurchase,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
} from "../../types/Character";
import { getSkillDefinition } from "../../utils/skillUtils";

export interface EliteRemovalWarning {
  title: string;
  message: string;
}

export type SkillTier = Exclude<SkillAdvanceLevel, "untrained">;

export const SKILL_LEVEL_ORDER: readonly SkillAdvanceLevel[] = [
  "untrained",
  "trained",
  "+10",
  "+20",
];

const SKILL_LEVEL_NAMES: Record<SkillAdvanceLevel, string> = {
  untrained: "Untrained",
  trained: "Trained",
  "+10": "+10",
  "+20": "+20",
};

export const SKILLS_PAGE = "the Skills page (Abilities, then Skills)";
export const ELITE_SKILLS_PAGE =
  "the Elite Skills page (Abilities, then Elite Advances, then Skills)";
export const ELITE_TALENTS_PAGE =
  "the Elite Talents page (Abilities, then Elite Advances, then Talents)";
export const ELITE_PACKAGES_PAGE =
  "the Elite Packages page (Abilities, then Elite Advances, then Packages)";

export function skillLevelName(level: SkillAdvanceLevel): string {
  return SKILL_LEVEL_NAMES[level];
}

export function getSkillName(skill: SkillEntry): string {
  return getSkillDefinition(skill.id)?.name ?? skill.name;
}

/** Joins steps into one readable instruction: "Step 1: ... Step 2: ...". */
export function formatSteps(steps: readonly string[]): string {
  return steps.map((step, index) => `Step ${index + 1}: ${step}`).join(" ");
}

/**
 * The steps that bring a skill down to a target level, from its top tier down.
 * A tier bought through an Elite Advance is removed on the Elite Skills page;
 * any other tier is lowered with Downgrade on the Skills page.
 */
export function getSkillLoweringSteps(skill: SkillEntry, target: SkillAdvanceLevel): string[] {
  const name = getSkillName(skill);
  const steps: string[] = [];
  for (
    let position = SKILL_LEVEL_ORDER.indexOf(skill.level);
    position > SKILL_LEVEL_ORDER.indexOf(target);
    position -= 1
  ) {
    const tier = SKILL_LEVEL_ORDER[position] as SkillTier;
    const label = skillLevelName(tier);
    if (skill.eliteAdvancePurchases?.[tier]) {
      steps.push(`Remove the ${label} card for ${name} on ${ELITE_SKILLS_PAGE}.`);
    } else if (position === 1) {
      steps.push(`Remove ${name} on ${SKILLS_PAGE}.`);
    } else {
      steps.push(
        `On ${SKILLS_PAGE}, press Remove on ${name} and choose Downgrade to ${skillLevelName(SKILL_LEVEL_ORDER[position - 1])}.`
      );
    }
  }
  return steps;
}

/** The warning for Downgrade or Remove on the Skills page when an Elite Advance bought the tier concerned. */
export function getSkillEliteLockWarning(
  skill: SkillEntry,
  action: "remove" | "downgrade"
): EliteRemovalWarning | undefined {
  const name = getSkillName(skill);
  const topPosition = SKILL_LEVEL_ORDER.indexOf(skill.level);
  if (action === "downgrade") {
    const topPurchase = skill.eliteAdvancePurchases?.[skill.level as SkillTier];
    if (!topPurchase) return undefined;
    return {
      title: "Undo This on the Elite Skills Page",
      message: `${name} is at ${skillLevelName(skill.level)} through ${topPurchase.sourceName}, an Elite Advance, so it cannot be lowered here. ${formatSteps(
        getSkillLoweringSteps(skill, SKILL_LEVEL_ORDER[topPosition - 1])
      )}`,
    };
  }
  const eliteTiers = (SKILL_LEVEL_ORDER.slice(1, topPosition + 1) as SkillTier[]).filter(
    (tier) => skill.eliteAdvancePurchases?.[tier]
  );
  if (eliteTiers.length === 0) return undefined;
  const lowestElite = SKILL_LEVEL_ORDER.indexOf(eliteTiers[0]);
  const steps = getSkillLoweringSteps(skill, SKILL_LEVEL_ORDER[lowestElite - 1]);
  if (lowestElite > 1) steps.push(`Remove ${name} on ${SKILLS_PAGE}.`);
  return {
    title: "Undo This on the Elite Skills Page",
    message: `${name} includes ${eliteTiers.map(skillLevelName).join(" and ")} bought through Elite Advances, so it cannot be removed here. ${formatSteps(steps)}`,
  };
}

/** The warning for Remove on the Talents page when an Elite Advance bought the Talent. */
export function getTalentEliteLockWarning(entry: TalentEntry): EliteRemovalWarning | undefined {
  const purchase = entry.eliteAdvancePurchase;
  if (!purchase) return undefined;
  return {
    title: "Undo This on the Elite Talents Page",
    message: `${entry.name} was bought through ${purchase.sourceName}, an Elite Advance, so it cannot be removed here. ${formatSteps(
      [`Remove the ${entry.name} card on ${ELITE_TALENTS_PAGE}.`]
    )}`,
  };
}

/** The warning for Remove on the Weapon Training page when an Elite Advance bought the group. */
export function getTrainingEliteLockWarning(
  name: string,
  purchase: EliteAdvancePurchase | undefined
): EliteRemovalWarning | undefined {
  if (!purchase) return undefined;
  return {
    title: "Undo This on the Elite Talents Page",
    message: `${name} was bought through ${purchase.sourceName}, an Elite Advance, so it cannot be removed here. ${formatSteps(
      [`Remove the ${name} card on ${ELITE_TALENTS_PAGE}.`]
    )}`,
  };
}
