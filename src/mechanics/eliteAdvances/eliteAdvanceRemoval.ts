import { ELITE_ADVANCES } from "shared-rules";
import type {
  ArcheotechItem,
  Character,
  CyberneticItem,
  InsanityBlock,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  SkillAdvanceLevel,
  SkillEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
} from "../../types/Character";
import { removeWeaponTrainingGroup } from "../../utils/weaponTrainingRemoval";
import { buildTalentRemovalUpdate, hasRestorableTalentEffect } from "../talents/talentRemovalRules";
import { getGrantedMinimumSkillLevel } from "./eliteAdvanceAccess";
import {
  ELITE_PACKAGES_PAGE,
  ELITE_SKILLS_PAGE,
  ELITE_TALENTS_PAGE,
  SKILL_LEVEL_ORDER,
  formatSteps,
  getSkillLoweringSteps,
  getSkillName,
  skillLevelName,
  type EliteRemovalWarning,
  type SkillTier,
} from "./eliteAdvanceWarnings";

export type EliteRemovalResult<Update> =
  | { ok: true; update: Update }
  | { ok: false; warning: EliteRemovalWarning };

function refuse(title: string, message: string): { ok: false; warning: EliteRemovalWarning } {
  return { ok: false, warning: { title, message } };
}

function nonEmpty<T extends object>(value: T): T | undefined {
  return Object.keys(value).length > 0 ? value : undefined;
}

function levelPosition(level: SkillAdvanceLevel): number {
  return SKILL_LEVEL_ORDER.indexOf(level);
}

/** The skill lowered to a level with every record above it deleted, or null when nothing is left to keep. */
function lowerSkill(
  skill: SkillEntry,
  level: SkillAdvanceLevel,
  talents: TalentsAndTraitsBlock,
  career: string | undefined
): SkillEntry | null {
  if (level === "untrained") return null;
  const xpPurchases = { ...skill.xpPurchases };
  const manualCosts = { ...skill.manualCosts };
  const eliteAdvancePurchases = { ...skill.eliteAdvancePurchases };
  for (
    let position = levelPosition(level) + 1;
    position < SKILL_LEVEL_ORDER.length;
    position += 1
  ) {
    const tier = SKILL_LEVEL_ORDER[position] as SkillTier;
    delete xpPurchases[tier];
    delete manualCosts[tier];
    delete eliteAdvancePurchases[tier];
  }
  const unpaidGrantedTraining =
    level === "trained" &&
    !xpPurchases.trained &&
    manualCosts.trained === undefined &&
    getGrantedMinimumSkillLevel(skill.id, talents, career) === "trained";
  if (unpaidGrantedTraining) return null;
  return {
    ...skill,
    level,
    xpPurchases: nonEmpty(xpPurchases),
    manualCosts: nonEmpty(manualCosts),
    eliteAdvancePurchases: nonEmpty(eliteAdvancePurchases),
  };
}

/** Removes one skill tier that was bought through an Elite Advance, and nothing else. */
export function buildEliteSkillTierRemoval({
  skills,
  skillId,
  tier,
  talents,
  career,
}: {
  skills: readonly SkillEntry[];
  skillId: string;
  tier: SkillTier;
  talents: TalentsAndTraitsBlock;
  career: string | undefined;
}): EliteRemovalResult<{ skills: SkillEntry[] }> {
  const owned = skills.find((skill) => skill.id === skillId);
  const name = owned ? getSkillName(owned) : skillId;
  const position = levelPosition(tier);
  if (!owned || !owned.eliteAdvancePurchases?.[tier] || position > levelPosition(owned.level)) {
    return refuse(
      "Nothing to Remove",
      `${name} has no ${skillLevelName(tier)} Elite Advance purchase to remove.`
    );
  }
  if (levelPosition(owned.level) > position) {
    const steps = [
      ...getSkillLoweringSteps(owned, tier),
      `Remove the ${skillLevelName(tier)} card for ${name} on ${ELITE_SKILLS_PAGE}.`,
    ];
    return refuse(
      "Remove the Higher Tiers First",
      `${name} is at ${skillLevelName(owned.level)}, above the ${skillLevelName(tier)} you want to remove. ${formatSteps(steps)}`
    );
  }
  const lowered = lowerSkill(owned, SKILL_LEVEL_ORDER[position - 1], talents, career);
  return {
    ok: true,
    update: {
      skills: lowered
        ? skills.map((skill) => (skill.id === skillId ? lowered : skill))
        : skills.filter((skill) => skill.id !== skillId),
    },
  };
}

export interface PackageRemovalState {
  talents: TalentsAndTraitsBlock;
  skills: SkillEntry[];
  weaponTraining: WeaponTrainingBlock;
  psychic: PsychicBlock;
  insanity: InsanityBlock;
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  archeotech: ArcheotechItem[];
  career?: string;
}

/**
 * Removes an owned package together with every skill tier, Talent and weapon
 * training group bought through it. Refuses, with the exact steps to take,
 * when something bought another way still rests on what the package gives.
 */
export function buildPackageRemoval(
  state: PackageRemovalState,
  uid: string
): EliteRemovalResult<Partial<Character>> {
  const packages = state.talents.eliteAdvances ?? [];
  const entry = packages.find((candidate) => candidate.uid === uid);
  if (!entry) {
    return refuse("Nothing to Remove", "This Elite Advance is no longer on the character.");
  }
  const packageId = entry.eliteAdvanceId;
  const reference = ELITE_ADVANCES.find((advance) => advance.id === packageId);
  const talentsWithoutPackage: TalentsAndTraitsBlock = {
    ...state.talents,
    eliteAdvances: packages.filter((candidate) => candidate.uid !== uid),
  };
  const problems: string[] = [];

  const grants = reference?.grantedSkills ?? [];
  const affectedSkillIds = new Set<string>([
    ...grants.map((grant) => grant.skillId),
    ...state.skills
      .filter((skill) =>
        Object.values(skill.eliteAdvancePurchases ?? {}).some(
          (purchase) => purchase?.eliteAdvanceId === packageId
        )
      )
      .map((skill) => skill.id),
  ]);
  const loweredLevels = new Map<string, SkillAdvanceLevel>();
  for (const skillId of affectedSkillIds) {
    const skill = state.skills.find((candidate) => candidate.id === skillId);
    if (!skill) continue;
    const savedPosition = levelPosition(skill.level);
    const grantPosition = Math.max(
      0,
      ...grants
        .filter((grant) => grant.skillId === skillId)
        .map((grant) => levelPosition(grant.level))
    );
    const floorPosition = levelPosition(
      getGrantedMinimumSkillLevel(skillId, talentsWithoutPackage, state.career)
    );
    const lost: number[] = [];
    for (let position = 1; position <= savedPosition; position += 1) {
      const tier = SKILL_LEVEL_ORDER[position] as SkillTier;
      const boughtThrough = skill.eliteAdvancePurchases?.[tier]?.eliteAdvanceId === packageId;
      const grantedOnlyByPackage =
        position <= grantPosition &&
        position > floorPosition &&
        skill.xpPurchases?.[tier] === undefined &&
        skill.manualCosts?.[tier] === undefined;
      if (boughtThrough || grantedOnlyByPackage) lost.push(position);
    }
    if (lost.length === 0) continue;
    const lowestLost = Math.min(...lost);
    const keptAbove: number[] = [];
    for (let position = lowestLost + 1; position <= savedPosition; position += 1) {
      if (!lost.includes(position)) keptAbove.push(position);
    }
    if (keptAbove.length > 0) {
      const target = SKILL_LEVEL_ORDER[lowestLost];
      const steps = [
        ...getSkillLoweringSteps(skill, target),
        `Remove ${entry.name} on ${ELITE_PACKAGES_PAGE}.`,
      ];
      problems.push(
        `${getSkillName(skill)} is at ${skillLevelName(skill.level)}, and ${skillLevelName(SKILL_LEVEL_ORDER[keptAbove[0]])} sits above ${skillLevelName(target)}, which depends on ${entry.name}. ${formatSteps(steps)}`
      );
      continue;
    }
    loweredLevels.set(skillId, SKILL_LEVEL_ORDER[lowestLost - 1]);
  }

  const packageTalents = state.talents.talents.filter(
    (talent) => talent.eliteAdvancePurchase?.eliteAdvanceId === packageId
  );
  const powers = [...state.psychic.minorPowers, ...state.psychic.majorPowers];
  for (const talent of packageTalents) {
    if (powers.some((power) => power.psyRatingTalentEntryUid === talent.uid)) {
      problems.push(
        `${talent.name} is linked to psychic powers. ${formatSteps([
          "Remove the linked powers on the Psychic page.",
          `Remove the ${talent.name} card on ${ELITE_TALENTS_PAGE}.`,
          `Remove ${entry.name} on ${ELITE_PACKAGES_PAGE}.`,
        ])}`
      );
    } else if (hasRestorableTalentEffect(talent)) {
      problems.push(
        `${talent.name} recorded a one-time change. ${formatSteps([
          `Remove the ${talent.name} card on ${ELITE_TALENTS_PAGE} and choose whether to restore what it changed.`,
          `Remove ${entry.name} on ${ELITE_PACKAGES_PAGE}.`,
        ])}`
      );
    }
  }
  if (problems.length > 0) return refuse(`Cannot Remove ${entry.name}`, problems.join(" "));

  let talents = state.talents;
  let psychic = state.psychic;
  let insanity = state.insanity;
  let cybernetics = state.cybernetics;
  let rangedWeapons = state.rangedWeapons;
  let meleeWeapons = state.meleeWeapons;
  let archeotech = state.archeotech;
  for (const talent of packageTalents) {
    const update = buildTalentRemovalUpdate({
      entry: talent,
      restoreOneTimeEffects: false,
      talents,
      psychic,
      cybernetics,
      insanity,
      rangedWeapons,
      meleeWeapons,
      archeotech,
    });
    talents = update.talentsAndTraits;
    psychic = update.psychic ?? psychic;
    cybernetics = update.cybernetics ?? cybernetics;
    insanity = update.insanity ?? insanity;
    rangedWeapons = update.rangedWeapons ?? rangedWeapons;
    meleeWeapons = update.meleeWeapons ?? meleeWeapons;
    archeotech = update.archeotech ?? archeotech;
  }
  const finalTalents: TalentsAndTraitsBlock = {
    ...talents,
    eliteAdvances: (talents.eliteAdvances ?? []).filter((candidate) => candidate.uid !== uid),
  };
  const psychicGrantPrefix = `elite-advance:${entry.uid}:minor-psychic-power:`;
  psychic = {
    ...psychic,
    minorPowers: psychic.minorPowers.filter(
      (power) => !power.talentEntryUid?.startsWith(psychicGrantPrefix)
    ),
  };
  if (entry.acquisition?.insanityGained) {
    insanity = {
      ...insanity,
      points: Math.max(0, insanity.points - entry.acquisition.insanityGained),
    };
  }

  const skills = state.skills.flatMap((skill) => {
    const level = loweredLevels.get(skill.id);
    if (level === undefined) return [skill];
    const lowered = lowerSkill(skill, level, finalTalents, state.career);
    return lowered ? [lowered] : [];
  });
  const trainingIds = state.weaponTraining.trained.filter(
    (id) => state.weaponTraining.eliteAdvancePurchases?.[id]?.eliteAdvanceId === packageId
  );
  let weaponTraining = state.weaponTraining;
  for (const id of trainingIds) weaponTraining = removeWeaponTrainingGroup(weaponTraining, id);

  return {
    ok: true,
    update: {
      talentsAndTraits: finalTalents,
      psychic,
      ...(insanity !== state.insanity ? { insanity } : {}),
      ...(loweredLevels.size > 0 ? { skills } : {}),
      ...(trainingIds.length > 0 ? { weaponTraining } : {}),
      ...(cybernetics !== state.cybernetics ? { cybernetics } : {}),
      ...(rangedWeapons !== state.rangedWeapons ? { rangedWeapons } : {}),
      ...(meleeWeapons !== state.meleeWeapons ? { meleeWeapons } : {}),
      ...(archeotech !== state.archeotech ? { archeotech } : {}),
    },
  };
}
