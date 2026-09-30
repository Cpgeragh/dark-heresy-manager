import { CAREER_ADVANCES } from "../../data/reference/careerAdvancesReference";
import { findCareerByName } from "../../data/reference/careerData";
import { ELITE_ADVANCES, type EliteAdvanceData } from "../../data/reference/eliteAdvanceData";
import { getCurrentCareerRankData } from "../experience/careerRankProgression";
import type {
  AlternateRankSelection,
  ExperienceBlock,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
} from "../../types/Character";

export interface MissedRankSkillOption {
  key: string;
  skillId: string;
  level: Exclude<SkillAdvanceLevel, "untrained">;
  cost: number;
  alternateRankId: string;
  replacedRankId: string;
}

export interface MissedRankTalentOption {
  key: string;
  talentId: string;
  specialisation?: string;
  cost: number;
  alternateRankId: string;
  replacedRankId: string;
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
  return ELITE_ADVANCES.filter((advance) =>
    (advance.alternateRankIds ?? []).some((alternateRankId) => selected.has(alternateRankId))
  );
}

function eligibleMissedRanks(
  career: string | undefined,
  rank: string | undefined,
  selections: readonly AlternateRankSelection[]
): readonly AlternateRankSelection[] {
  const currentRank = getCurrentCareerRankData(career, rank);
  if (!currentRank) return [];
  return selections.filter((selection) => currentRank.tier > selection.takenAtTier);
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
  const careerData = findCareerByName(career);
  const advancesData = CAREER_ADVANCES.find((entry) => entry.careerId === careerData?.id);
  if (!careerData || !advancesData) return { skills: [], talents: [] };

  const skillOptions: MissedRankSkillOption[] = [];
  const talentOptions: MissedRankTalentOption[] = [];
  const selections = eligibleMissedRanks(career, rank, experience.alternateRanks ?? []);

  for (const selection of selections) {
    const table = advancesData.rankTables.find(
      (entry) => entry.rankId === selection.replacedRankId
    );
    if (!table) continue;

    table.advances.forEach((advance, index) => {
      if (advance.kind === "skill" && advance.skillId) {
        const level = advance.level ?? "trained";
        if (
          hasSkillLevel(
            skills.find((skill) => skill.id === advance.skillId),
            level
          )
        )
          return;
        skillOptions.push({
          key: `${selection.alternateRankId}:${selection.replacedRankId}:skill:${index}`,
          skillId: advance.skillId,
          level,
          cost: advance.cost + 50,
          alternateRankId: selection.alternateRankId,
          replacedRankId: selection.replacedRankId,
        });
      }

      if (advance.kind === "talent" && advance.talentId) {
        const ownedCount = talents.filter((entry) =>
          sameTalent(entry, advance.talentId!, advance.specialisation)
        ).length;
        const availableCopies = advance.repeatableAtThisRank ?? 1;
        if (ownedCount >= availableCopies) return;
        talentOptions.push({
          key: `${selection.alternateRankId}:${selection.replacedRankId}:talent:${index}`,
          talentId: advance.talentId,
          specialisation: advance.specialisation,
          cost: advance.cost + 50,
          alternateRankId: selection.alternateRankId,
          replacedRankId: selection.replacedRankId,
        });
      }
    });
  }

  return { skills: skillOptions, talents: talentOptions };
}
