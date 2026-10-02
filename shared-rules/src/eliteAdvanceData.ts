import type { SkillAdvanceLevel, WeaponTrainingTalentId } from "./types.js";
import { SkillSource } from "./skillSource.js";
import { WEAPON_TRAINING_GROUPS } from "./weaponTrainingData.js";

export interface EliteAdvanceUnlockedAdvance {
  kind: "skill" | "talent";
  skillId?: string;
  talentId?: string;
  specialisation?: string;
  level?: Exclude<SkillAdvanceLevel, "untrained">;
  cost: number;
  prerequisites?: string;
}

export interface EliteAdvanceData {
  id: string;
  name: string;
  source: SkillSource;
  cost: number;
  prerequisites?: string;
  description: string;
  downtime?: string;
  consequences?: readonly string[];
  grantedSkills?: readonly {
    skillId: string;
    level: Exclude<SkillAdvanceLevel, "untrained">;
  }[];
  grantedTalents?: readonly string[];
  grantedTraits?: readonly string[];
  /** Permanent Minor Psychic Power selections granted by this package. */
  grantedMinorPsychicPowers?: number;
  insanityGain?: "1d5";
  characteristicReductions?: readonly {
    characteristic: "t" | "fel";
    amount: "1d5";
  }[];
  effects?: readonly string[];
  /** Skill and Talent advances made available after this package is purchased. */
  unlockedAdvances?: readonly EliteAdvanceUnlockedAdvance[];
  alternateRankIds?: readonly string[];
  automaticGrantOnly?: boolean;
}

export const ELITE_ADVANCES: readonly EliteAdvanceData[] = [
  {
    id: "encarta-maleficarum",
    name: "Encarta Maleficarum",
    source: SkillSource.IH,
    cost: 500,
    prerequisites: "T 40",
    description:
      "Some Black Priests, in order to aid them as holy exorcists, are subjected to a secret ritual that Ordo Malleus calls the Encarta Maleficarum. During this ritual, forbidden knowledge is burned deep into their minds, shackled with wards inscribed by occult means directly into the cerebral cortex. This procedure is rare and considered a radical one even by the most ardent of Daemonhunters, as the survival rate is not high and, even if successful, the recipient’s life expectancy can be seriously reduced and their sanity eroded.",
    downtime: "1d5 weeks",
    consequences: [
      "Gain 1d5 Insanity Points.",
      "Permanently reduce Toughness by 1d5.",
      "Permanently reduce Fellowship by 1d5.",
    ],
    insanityGain: "1d5",
    characteristicReductions: [
      { characteristic: "t", amount: "1d5" },
      { characteristic: "fel", amount: "1d5" },
    ],
    grantedSkills: [{ skillId: "forbidden-ordos-malleus", level: "trained" }],
    grantedTalents: ["insanely-faithful"],
    effects: [
      "+10 to all Tests made to resist torture and interrogation, attempts to read or control the character’s mind, and any form of possession.",
      "If an attempt to possess the character succeeds by fewer than three degrees of success, the possession is blocked and the character collapses in a catatonic state for 1d10 minutes.",
    ],
    alternateRankIds: ["black-priest-of-maccabeus"],
  },
  {
    id: "nascent-psyker",
    name: "Nascent Psyker",
    source: SkillSource.IH,
    cost: 0,
    prerequisites:
      "Imperial Psykers and Tech-Priests may not select this Elite Advance Package. Available only at the GM's discretion.",
    description:
      "The character's latent psychic potential awakens into incredible but uncontrollable power, placing them at risk of possession, death, or discovery by the Black Ships.",
    grantedTraits: ["nascent-power"],
    grantedMinorPsychicPowers: 1,
    effects: [
      "Gain one random permanent Minor Psychic Power.",
      "At the start of every gaming session, gain 1d10 minus Willpower Bonus temporary Psychic Powers, to a minimum of zero. These are randomly chosen, may come from several Disciplines, require no Power Roll, and generate Psychic Phenomena each time they are used.",
    ],
    unlockedAdvances: [
      { kind: "skill", skillId: "deceive", level: "trained", cost: 100 },
      { kind: "skill", skillId: "psyniscience", level: "trained", cost: 100 },
    ],
  },
  {
    id: "cult-of-the-red-redemption",
    name: "The Cult of the Red Redemption",
    source: SkillSource.IH,
    cost: 150,
    prerequisites:
      "Psykers, Tech-Priests, and members of any other sect, secret guild, or conspiracy are barred from this Elite Advance Package.",
    description:
      "The character joins the zealous Redemptionist cult and binds themselves to the Ludmillan Dictates.",
    grantedSkills: [{ skillId: "secret-tongue-redemption", level: "trained" }],
    grantedTalents: ["flagellant", "frenzy"],
    grantedTraits: ["true-believer"],
    effects: [
      "The character may spend XP on the Cult of the Red Redemption advances unlocked by this package.",
    ],
    unlockedAdvances: [
      {
        kind: "skill",
        skillId: "secret-tongue-redemption",
        level: "trained",
        cost: 100,
      },
      {
        kind: "skill",
        skillId: "secret-tongue-redemption",
        level: "+10",
        cost: 100,
        prerequisites: "Secret Tongue (the Redemption)",
      },
      {
        kind: "skill",
        skillId: "secret-tongue-redemption",
        level: "+20",
        cost: 100,
        prerequisites: "Secret Tongue (the Redemption) +10",
      },
      { kind: "talent", talentId: "berserk-charge", cost: 100 },
      { kind: "talent", talentId: "chem-geld", cost: 100 },
      { kind: "talent", talentId: "hatred", specialisation: "Heretics", cost: 100 },
      { kind: "talent", talentId: "hatred", specialisation: "Mutants", cost: 100 },
      { kind: "talent", talentId: "hatred", specialisation: "Psykers", cost: 100 },
      {
        kind: "talent",
        talentId: "basic-weapon-training",
        specialisation: "Flame",
        cost: 200,
      },
      {
        kind: "talent",
        talentId: "cleanse-and-purify",
        cost: 200,
        prerequisites: "Basic Weapon Training (Flame)",
      },
      {
        kind: "talent",
        talentId: "furious-assault",
        cost: 200,
        prerequisites: "WS 35",
      },
      { kind: "talent", talentId: "insanely-faithful", cost: 200 },
      {
        kind: "talent",
        talentId: "battle-rage",
        cost: 300,
        prerequisites: "Frenzy",
      },
    ],
  },
  {
    id: "bloodsworn-charter",
    name: "Bloodsworn Charter",
    source: SkillSource.IH,
    cost: 0,
    description:
      "Upon successfully entering the Malfian Bloodsworn career path, the character gains a Bloodsworn Charter. The warrant enables its holder to bear arms in the hive where others would not, access legal records, enter private dwellings, and avoid interference from local enforcers and armsmen while pursuing their warrants. These powers do not extend to the holdings or persons of the Adepta or Malfi’s rulers.",
    effects: [
      "Grants the privileges and rights of a chartered Bloodsworn while operating within the charter’s lawful limits.",
    ],
    alternateRankIds: ["malfian-bloodsworn"],
    automaticGrantOnly: true,
  },
];

function ownedAdvances(ids: readonly string[]): readonly EliteAdvanceData[] {
  const owned = new Set(ids);
  return ELITE_ADVANCES.filter((advance) => owned.has(advance.id));
}

export function getEliteAdvanceGrantedSkillLevel(
  eliteAdvanceIds: readonly string[],
  skillId: string
): Exclude<SkillAdvanceLevel, "untrained"> | undefined {
  const levels: readonly SkillAdvanceLevel[] = ["untrained", "trained", "+10", "+20"];
  return ownedAdvances(eliteAdvanceIds)
    .flatMap((advance) => advance.grantedSkills ?? [])
    .filter((grant) => grant.skillId === skillId)
    .map((grant) => grant.level)
    .sort((left, right) => levels.indexOf(right) - levels.indexOf(left))[0];
}

export function getEliteAdvanceSkillCost(
  eliteAdvanceIds: readonly string[],
  skillId: string,
  level: Exclude<SkillAdvanceLevel, "untrained">
): number | undefined {
  return ownedAdvances(eliteAdvanceIds)
    .flatMap((advance) => advance.unlockedAdvances ?? [])
    .find(
      (advance) =>
        advance.kind === "skill" && advance.skillId === skillId && advance.level === level
    )?.cost;
}

export function getEliteAdvanceWeaponTrainingId(
  advance: EliteAdvanceUnlockedAdvance
): WeaponTrainingTalentId | undefined {
  if (advance.kind !== "talent" || !advance.talentId || !advance.specialisation) return undefined;
  const group = WEAPON_TRAINING_GROUPS.find(
    (entry) => entry.label.toLocaleLowerCase().replaceAll(" ", "-") === advance.talentId
  );
  return group?.items.find(
    (entry) => entry.display.toLocaleLowerCase() === advance.specialisation?.toLocaleLowerCase()
  )?.id;
}

export function getEliteAdvanceWeaponTrainingCost(
  eliteAdvanceIds: readonly string[],
  id: WeaponTrainingTalentId
): number | undefined {
  return ownedAdvances(eliteAdvanceIds)
    .flatMap((advance) => advance.unlockedAdvances ?? [])
    .find((advance) => getEliteAdvanceWeaponTrainingId(advance) === id)?.cost;
}
