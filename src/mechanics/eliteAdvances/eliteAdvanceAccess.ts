import {
  ELITE_ADVANCES,
  getEliteAdvanceWeaponTrainingId,
  getMissedRankCareerAdvances,
  getNextSkillTierAccess,
  getNextTalentOrTraitPurchase,
  getWeaponTrainingPurchase,
  type EliteAdvanceData,
} from "shared-rules";
import type {
  AlternateRankSelection,
  ExperienceBlock,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import { getSkillDefinition } from "../../utils/skillUtils";
import { createTalentSkillEffectContext, getTalentSkillEffects } from "../talents/talentEffects";

export interface MissedRankSkillOption {
  key: string;
  skillId: string;
  level: Exclude<SkillAdvanceLevel, "untrained">;
  cost: number;
  prerequisites?: string;
  alternateRankId?: string;
  replacedRankId?: string;
  eliteAdvanceId?: string;
  eliteAdvanceName?: string;
}

export interface MissedRankTalentOption {
  key: string;
  talentId: string;
  specialisation?: string;
  cost: number;
  prerequisites?: string;
  alternateRankId?: string;
  replacedRankId?: string;
  eliteAdvanceId?: string;
  eliteAdvanceName?: string;
  weaponTrainingId?: WeaponTrainingTalentId;
}

const SKILL_LEVELS: readonly SkillAdvanceLevel[] = ["untrained", "trained", "+10", "+20"];

function levelIndex(level: SkillAdvanceLevel): number {
  return SKILL_LEVELS.indexOf(level);
}

function sameTalent(
  entry: TalentEntry,
  talentId: string,
  specialisation: string | undefined
): boolean {
  return (
    entry.talentId === talentId &&
    (entry.specialisation ?? "").trim().toLocaleLowerCase("en-GB") ===
      (specialisation ?? "").trim().toLocaleLowerCase("en-GB")
  );
}

/** The level the Skills page shows for a skill: its saved level raised by what the career, talents and packages grant. */
export function createShownSkillLevels(
  skills: readonly SkillEntry[],
  talents: TalentsAndTraitsBlock,
  career: string | undefined
): (skillId: string) => SkillAdvanceLevel {
  const context = createTalentSkillEffectContext(talents, career);
  return (skillId) => {
    const saved = skills.find((skill) => skill.id === skillId)?.level ?? "untrained";
    const definition = getSkillDefinition(skillId);
    if (!definition) return saved;
    const minimum = getTalentSkillEffects(
      talents,
      { ...definition, level: saved },
      career,
      context
    ).minimumLevel;
    return minimum && levelIndex(minimum) > levelIndex(saved) ? minimum : saved;
  };
}

/** The level a skill is given for free by the career, talents and packages, ignoring anything bought. */
export function getGrantedMinimumSkillLevel(
  skillId: string,
  talents: TalentsAndTraitsBlock,
  career: string | undefined
): SkillAdvanceLevel {
  const definition = getSkillDefinition(skillId);
  if (!definition) return "untrained";
  return (
    getTalentSkillEffects(talents, { ...definition, level: "untrained" }, career).minimumLevel ??
    "untrained"
  );
}

function careerSellsSkillTier(
  career: string | undefined,
  rank: string | undefined,
  skillId: string,
  shownLevel: SkillAdvanceLevel,
  level: SkillAdvanceLevel,
  alternateRanks: readonly AlternateRankSelection[]
): boolean {
  const access = getNextSkillTierAccess(career, rank, skillId, shownLevel, alternateRanks);
  return access.status === "unlocked" && access.level === level;
}

function careerSellsTalent(
  career: string | undefined,
  rank: string | undefined,
  option: { talentId: string; specialisation?: string; weaponTrainingId?: WeaponTrainingTalentId },
  owned: readonly TalentEntry[],
  alternateRanks: readonly AlternateRankSelection[]
): boolean {
  if (option.weaponTrainingId) {
    return (
      getWeaponTrainingPurchase(career, rank, option.weaponTrainingId, alternateRanks) !== undefined
    );
  }
  return (
    getNextTalentOrTraitPurchase(
      career,
      rank,
      option.talentId,
      option.specialisation,
      owned,
      alternateRanks
    ) !== undefined
  );
}

export function getAvailableNamedEliteAdvances(
  experience: ExperienceBlock
): readonly EliteAdvanceData[] {
  const selected = new Set((experience.alternateRanks ?? []).map((entry) => entry.alternateRankId));
  return ELITE_ADVANCES.filter(
    (advance) =>
      !advance.automaticGrantOnly &&
      ((advance.alternateRankIds?.length ?? 0) === 0 ||
        (advance.alternateRankIds ?? []).some((alternateRankId) => selected.has(alternateRankId)))
  );
}

function nextSkillLevel(
  level: SkillAdvanceLevel
): Exclude<SkillAdvanceLevel, "untrained"> | undefined {
  if (level === "untrained") return "trained";
  if (level === "trained") return "+10";
  if (level === "+10") return "+20";
  return undefined;
}

export function getPackageEliteAdvanceOptions({
  talents,
  skills,
  weaponTraining,
  career,
  rank,
  alternateRanks = [],
}: {
  talents: TalentsAndTraitsBlock;
  skills: readonly SkillEntry[];
  weaponTraining: WeaponTrainingBlock;
  career?: string;
  rank?: string;
  alternateRanks?: readonly AlternateRankSelection[];
}): { skills: MissedRankSkillOption[]; talents: MissedRankTalentOption[] } {
  const eliteAdvanceIds = (talents.eliteAdvances ?? []).map((entry) => entry.eliteAdvanceId);
  const references = ELITE_ADVANCES.filter((advance) => eliteAdvanceIds.includes(advance.id));
  const shownLevel = createShownSkillLevels(skills, talents, career);
  const skillOptions: MissedRankSkillOption[] = [];
  const talentOptions: MissedRankTalentOption[] = [];

  for (const reference of references) {
    (reference.unlockedAdvances ?? []).forEach((advance, index) => {
      if (advance.kind === "skill" && advance.skillId && advance.level) {
        const shown = shownLevel(advance.skillId);
        if (nextSkillLevel(shown) !== advance.level) return;
        if (
          careerSellsSkillTier(career, rank, advance.skillId, shown, advance.level, alternateRanks)
        ) {
          return;
        }
        skillOptions.push({
          key: `${reference.id}:skill:${index}`,
          skillId: advance.skillId,
          level: advance.level,
          cost: advance.cost,
          prerequisites: advance.prerequisites,
          eliteAdvanceId: reference.id,
          eliteAdvanceName: reference.name,
        });
      }

      if (advance.kind === "talent" && advance.talentId) {
        const weaponTrainingId = getEliteAdvanceWeaponTrainingId(advance);
        if (weaponTrainingId && weaponTraining.trained.includes(weaponTrainingId)) return;
        if (!weaponTrainingId) {
          const ownedDirectly = talents.talents.some((entry) =>
            sameTalent(entry, advance.talentId!, advance.specialisation)
          );
          const ownedAsGrant =
            !advance.specialisation &&
            references.some((entry) => entry.grantedTalents?.includes(advance.talentId!));
          if (ownedDirectly || ownedAsGrant) return;
        }
        if (
          careerSellsTalent(
            career,
            rank,
            {
              talentId: advance.talentId,
              specialisation: advance.specialisation,
              weaponTrainingId,
            },
            talents.talents,
            alternateRanks
          )
        ) {
          return;
        }
        talentOptions.push({
          key: `${reference.id}:talent:${index}`,
          talentId: advance.talentId,
          specialisation: advance.specialisation,
          cost: advance.cost,
          prerequisites: advance.prerequisites,
          eliteAdvanceId: reference.id,
          eliteAdvanceName: reference.name,
          ...(weaponTrainingId ? { weaponTrainingId } : {}),
        });
      }
    });
  }

  return { skills: skillOptions, talents: talentOptions };
}

export function getMissedRankEliteAdvanceOptions({
  career,
  rank,
  experience,
  skills,
  talents,
}: {
  career: string | undefined;
  rank: string | undefined;
  experience: ExperienceBlock;
  skills: readonly SkillEntry[];
  talents: TalentsAndTraitsBlock;
}): {
  skills: MissedRankSkillOption[];
  talents: MissedRankTalentOption[];
} {
  const skillOptions: MissedRankSkillOption[] = [];
  const talentOptions: MissedRankTalentOption[] = [];
  const alternateRanks = experience.alternateRanks ?? [];
  const shownLevel = createShownSkillLevels(skills, talents, career);
  const missedAdvances = getMissedRankCareerAdvances(career, rank, alternateRanks);

  for (const option of missedAdvances) {
    const { advance, advanceIndex, alternateRankId, replacedRankId, purchaseCost } = option;
    if (advance.kind === "skill" && advance.skillId) {
      const level = advance.level ?? "trained";
      const shown = shownLevel(advance.skillId);
      if (nextSkillLevel(shown) !== level) continue;
      if (careerSellsSkillTier(career, rank, advance.skillId, shown, level, alternateRanks)) {
        continue;
      }
      skillOptions.push({
        key: `${alternateRankId}:${replacedRankId}:skill:${advanceIndex}`,
        skillId: advance.skillId,
        level,
        cost: purchaseCost,
        alternateRankId,
        replacedRankId,
      });
    }

    if (advance.kind === "talent" && advance.talentId) {
      const ownedCount = talents.talents.filter((entry) =>
        sameTalent(entry, advance.talentId!, advance.specialisation)
      ).length;
      const availableCopies = advance.repeatableAtThisRank ?? 1;
      if (ownedCount >= availableCopies) {
        continue;
      }
      if (
        careerSellsTalent(
          career,
          rank,
          { talentId: advance.talentId, specialisation: advance.specialisation },
          talents.talents,
          alternateRanks
        )
      ) {
        continue;
      }
      talentOptions.push({
        key: `${alternateRankId}:${replacedRankId}:talent:${advanceIndex}`,
        talentId: advance.talentId,
        specialisation: advance.specialisation,
        cost: purchaseCost,
        alternateRankId,
        replacedRankId,
      });
    }
  }

  return { skills: skillOptions, talents: talentOptions };
}
