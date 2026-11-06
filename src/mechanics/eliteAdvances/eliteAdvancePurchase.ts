import { findCareerByName, makeCurrentRankPurchase, TALENT_LIST } from "shared-rules";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import type {
  EliteAdvancePurchase,
  SkillAdvanceLevel,
  SkillEntry,
  TalentEntry,
  WeaponTrainingBlock,
} from "../../types/Character";
import { makeTalentEntry } from "../talents/talentUtils";
import type { MissedRankSkillOption, MissedRankTalentOption } from "./eliteAdvanceAccess";

export type PurchasedSkillLevel = Exclude<SkillAdvanceLevel, "untrained">;

/** The tier that follows a level, or undefined when the skill is at the top. */
export function nextSkillLevel(level: SkillAdvanceLevel): PurchasedSkillLevel | undefined {
  if (level === "untrained") return "trained";
  if (level === "trained") return "+10";
  if (level === "+10") return "+20";
  return undefined;
}

function missedRankPurchase(
  option: MissedRankSkillOption | MissedRankTalentOption,
  career: string | undefined
): EliteAdvancePurchase {
  const replacedRank = option.replacedRankId
    ? findCareerByName(career)?.ranks.find((entry) => entry.id === option.replacedRankId)
    : undefined;
  return {
    source: "missed-rank",
    cost: option.cost,
    sourceName: `Missed ${replacedRank?.name ?? option.replacedRankId} Rank`,
    alternateRankId: option.alternateRankId,
    replacedRankId: option.replacedRankId,
  };
}

function packagePurchase(
  option: MissedRankSkillOption | MissedRankTalentOption
): EliteAdvancePurchase {
  return {
    source: "elite-package",
    cost: option.cost,
    sourceName: option.eliteAdvanceName ?? option.eliteAdvanceId ?? "Elite Advance Package",
    eliteAdvanceId: option.eliteAdvanceId,
  };
}

/** How an Unlocked option is recorded: bought through a package, or from a rank the character missed. */
export function optionPurchase(
  option: MissedRankSkillOption | MissedRankTalentOption,
  career: string | undefined
): EliteAdvancePurchase {
  return option.eliteAdvanceId ? packagePurchase(option) : missedRankPurchase(option, career);
}

/** The skills with one tier bought through an Elite Advance and recorded as such, or undefined for an unknown skill. */
export function buildSkillPurchase({
  skills,
  skillId,
  level,
  cost,
  purchase,
  career,
  rank,
}: {
  skills: readonly SkillEntry[];
  skillId: string;
  level: PurchasedSkillLevel;
  cost: number;
  purchase: EliteAdvancePurchase;
  career: string | undefined;
  rank: string | undefined;
}): SkillEntry[] | undefined {
  const definition = DEFAULT_SKILLS.find((skill) => skill.id === skillId);
  if (!definition) return undefined;
  const owned = skills.find((skill) => skill.id === skillId);
  const updated: SkillEntry = {
    ...definition,
    ...owned,
    level,
    xpPurchases: {
      ...owned?.xpPurchases,
      [level]: makeCurrentRankPurchase(career, rank, cost),
    },
    ...(purchase.source === "gm-approved"
      ? { manualCosts: { ...owned?.manualCosts, [level]: cost } }
      : {}),
    eliteAdvancePurchases: {
      ...owned?.eliteAdvancePurchases,
      [level]: purchase,
    },
  };
  return owned
    ? skills.map((skill) => (skill.id === skillId ? updated : skill))
    : [...skills, updated];
}

export type FixedTalentPurchase =
  | { kind: "training"; weaponTraining: WeaponTrainingBlock }
  | { kind: "talent"; entry: TalentEntry };

/** What buying an Unlocked talent option records: a weapon training group, or a Talent entry to add. */
export function buildFixedTalentPurchase({
  option,
  weaponTraining,
  career,
  rank,
}: {
  option: MissedRankTalentOption;
  weaponTraining: WeaponTrainingBlock;
  career: string | undefined;
  rank: string | undefined;
}): FixedTalentPurchase | undefined {
  const purchase = optionPurchase(option, career);
  if (option.weaponTrainingId) {
    const id = option.weaponTrainingId;
    return {
      kind: "training",
      weaponTraining: {
        ...weaponTraining,
        trained: [...weaponTraining.trained, id],
        xpPurchases: {
          ...weaponTraining.xpPurchases,
          [id]: makeCurrentRankPurchase(career, rank, option.cost),
        },
        eliteAdvancePurchases: {
          ...weaponTraining.eliteAdvancePurchases,
          [id]: purchase,
        },
      },
    };
  }
  const reference = TALENT_LIST.find((talent) => talent.id === option.talentId);
  if (!reference) return undefined;
  return {
    kind: "talent",
    entry: {
      ...makeTalentEntry(reference, option.specialisation),
      xpPurchase: makeCurrentRankPurchase(career, rank, option.cost),
      eliteAdvancePurchase: purchase,
    },
  };
}
