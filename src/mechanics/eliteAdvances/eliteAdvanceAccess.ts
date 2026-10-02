import {
  ELITE_ADVANCES,
  getEliteAdvanceGrantedSkillLevel,
  getEliteAdvanceWeaponTrainingId,
  type EliteAdvanceData,
} from "../../data/reference/eliteAdvanceData";
import { getMissedRankCareerAdvances } from "../experience/careerAdvanceAccess";
import type {
  ExperienceBlock,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";

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

function hasSkillLevel(skill: SkillEntry | undefined, level: SkillAdvanceLevel): boolean {
  return SKILL_LEVELS.indexOf(skill?.level ?? "untrained") >= SKILL_LEVELS.indexOf(level);
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
}: {
  talents: TalentsAndTraitsBlock;
  skills: readonly SkillEntry[];
  weaponTraining: WeaponTrainingBlock;
}): { skills: MissedRankSkillOption[]; talents: MissedRankTalentOption[] } {
  const eliteAdvanceIds = (talents.eliteAdvances ?? []).map((entry) => entry.eliteAdvanceId);
  const references = ELITE_ADVANCES.filter((advance) => eliteAdvanceIds.includes(advance.id));
  const skillOptions: MissedRankSkillOption[] = [];
  const talentOptions: MissedRankTalentOption[] = [];

  for (const reference of references) {
    (reference.unlockedAdvances ?? []).forEach((advance, index) => {
      if (advance.kind === "skill" && advance.skillId && advance.level) {
        const savedLevel =
          skills.find((skill) => skill.id === advance.skillId)?.level ?? "untrained";
        const grantedLevel = getEliteAdvanceGrantedSkillLevel(eliteAdvanceIds, advance.skillId);
        const effectiveLevel =
          SKILL_LEVELS.indexOf(grantedLevel ?? "untrained") > SKILL_LEVELS.indexOf(savedLevel)
            ? (grantedLevel ?? "untrained")
            : savedLevel;
        if (nextSkillLevel(effectiveLevel) !== advance.level) return;
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
  talents: readonly TalentEntry[];
}): {
  skills: MissedRankSkillOption[];
  talents: MissedRankTalentOption[];
} {
  const skillOptions: MissedRankSkillOption[] = [];
  const talentOptions: MissedRankTalentOption[] = [];
  const missedAdvances = getMissedRankCareerAdvances(career, rank, experience.alternateRanks ?? []);

  for (const option of missedAdvances) {
    const { advance, advanceIndex, alternateRankId, replacedRankId, purchaseCost } = option;
    if (advance.kind === "skill" && advance.skillId) {
      const level = advance.level ?? "trained";
      if (
        hasSkillLevel(
          skills.find((skill) => skill.id === advance.skillId),
          level
        )
      ) {
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
      const ownedCount = talents.filter((entry) =>
        sameTalent(entry, advance.talentId!, advance.specialisation)
      ).length;
      const availableCopies = advance.repeatableAtThisRank ?? 1;
      if (ownedCount >= availableCopies) {
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
