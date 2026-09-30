import type { SkillAdvanceLevel } from "./types.js";
import { SkillSource } from "./skillSource.js";

export interface AlternateRankSkillAdvance {
  id: string;
  kind: "skill";
  skillId: string;
  level?: Exclude<SkillAdvanceLevel, "untrained">;
  cost: number;
  prerequisites?: string;
}

export interface AlternateRankTalentAdvance {
  id: string;
  kind: "talent";
  talentId: string;
  specialisation?: string;
  cost: number;
  prerequisites?: string;
}

export interface AlternateRankEliteAdvance {
  id: string;
  kind: "elite-advance";
  eliteAdvanceId: string;
}

export type AlternateRankAdvance =
  | AlternateRankSkillAdvance
  | AlternateRankTalentAdvance
  | AlternateRankEliteAdvance;

export interface AlternateRankData {
  id: string;
  name: string;
  source: SkillSource;
  quote: string;
  attribution: string;
  description: string;
  requiredCareerId: string;
  minimumRank: number;
  minimumXp: number;
  requirements: {
    maximumCorruption?: number;
    requiredOriginOrTraining?: string;
    excludedOrigins?: readonly string[];
  };
  advances: readonly AlternateRankAdvance[];
}

export const ALTERNATE_RANKS: readonly AlternateRankData[] = [
  {
    id: "black-priest-of-maccabeus",
    name: "Black Priest of Maccabeus",
    source: SkillSource.IH,
    quote:
      "I walk in the footsteps of the Blessed Saint Drusus and I go about the Emperor’s work. At my word the unclean spirit baulks and the heretic withers in shame. Who, then, are you to stand against me?",
    attribution: "Prior Cornelius Agrippa, Maccabean Exorcist.",
    description:
      "In order to qualify for this path, the character must be a Cleric who either originates from Maccabeus Quintus, or with the permission (or at the behest) of their Inquisitorial masters is sent to train there during ‘downtime’ between adventures. This Career Path is particularly suited to Clerics who want a more directly combative role against the powers of the warp, or who in their character’s past have survived encounters with the Daemonic.",
    requiredCareerId: "cleric",
    minimumRank: 4,
    minimumXp: 2_000,
    requirements: {
      maximumCorruption: 9,
      requiredOriginOrTraining: "Maccabeus Quintus",
      excludedOrigins: ["Mind Cleansed"],
    },
    advances: [
      { id: "command", kind: "skill", skillId: "command", cost: 100 },
      {
        id: "common-imperial-creed-20",
        kind: "skill",
        skillId: "common-imperial-creed",
        level: "+20",
        cost: 100,
        prerequisites: "Common Lore (Imperial Creed) +10",
      },
      {
        id: "deceive-10",
        kind: "skill",
        skillId: "deceive",
        level: "+10",
        cost: 100,
        prerequisites: "Deceive",
      },
      { id: "forbidden-cults", kind: "skill", skillId: "forbidden-cults", cost: 100 },
      {
        id: "forbidden-daemonology",
        kind: "skill",
        skillId: "forbidden-daemonology",
        cost: 100,
      },
      {
        id: "forbidden-daemonology-10",
        kind: "skill",
        skillId: "forbidden-daemonology",
        level: "+10",
        cost: 100,
        prerequisites: "Forbidden Lore (Daemonology)",
      },
      { id: "interrogation", kind: "skill", skillId: "interrogation", cost: 100 },
      { id: "intimidation", kind: "skill", skillId: "intimidate", cost: 100 },
      {
        id: "pilot-civilian-10",
        kind: "skill",
        skillId: "pilot-civilian",
        level: "+10",
        cost: 100,
        prerequisites: "Pilot (Civilian Craft)",
      },
      {
        id: "scholastic-legend-10",
        kind: "skill",
        skillId: "scholastic-legend",
        level: "+10",
        cost: 100,
        prerequisites: "Scholastic Lore (Legend)",
      },
      {
        id: "scholastic-occult",
        kind: "skill",
        skillId: "scholastic-occult",
        cost: 100,
      },
      {
        id: "speak-high-gothic",
        kind: "skill",
        skillId: "speak-high-gothic",
        cost: 100,
      },
      {
        id: "basic-bolt",
        kind: "talent",
        talentId: "basic-weapon-training",
        specialisation: "Bolt",
        cost: 100,
      },
      {
        id: "basic-flame",
        kind: "talent",
        talentId: "basic-weapon-training",
        specialisation: "Flame",
        cost: 100,
      },
      {
        id: "hatred-daemons",
        kind: "talent",
        talentId: "hatred",
        specialisation: "Daemons",
        cost: 100,
      },
      {
        id: "master-orator",
        kind: "talent",
        talentId: "master-orator",
        cost: 100,
        prerequisites: "Fel 30",
      },
      {
        id: "melee-chain",
        kind: "talent",
        talentId: "melee-weapon-training",
        specialisation: "Chain",
        cost: 100,
      },
      {
        id: "unshakeable-faith",
        kind: "talent",
        talentId: "unshakeable-faith",
        cost: 100,
      },
      {
        id: "sound-constitution-100",
        kind: "talent",
        talentId: "sound-constitution",
        cost: 100,
      },
      {
        id: "command-10",
        kind: "skill",
        skillId: "command",
        level: "+10",
        cost: 200,
        prerequisites: "Command",
      },
      {
        id: "forbidden-cults-10",
        kind: "skill",
        skillId: "forbidden-cults",
        level: "+10",
        cost: 200,
        prerequisites: "Forbidden Lore (Cults)",
      },
      { id: "forbidden-warp", kind: "skill", skillId: "forbidden-warp", cost: 200 },
      {
        id: "melee-power",
        kind: "talent",
        talentId: "melee-weapon-training",
        specialisation: "Power",
        cost: 200,
      },
      {
        id: "peer-ordo-malleus",
        kind: "talent",
        talentId: "peer",
        specialisation: "Ordo Malleus",
        cost: 200,
        prerequisites: "Fel 30",
      },
      {
        id: "pistol-bolt",
        kind: "talent",
        talentId: "pistol-training",
        specialisation: "Bolt",
        cost: 200,
      },
      {
        id: "pistol-flame",
        kind: "talent",
        talentId: "pistol-training",
        specialisation: "Flame",
        cost: 200,
      },
      {
        id: "sound-constitution-200",
        kind: "talent",
        talentId: "sound-constitution",
        cost: 200,
      },
      { id: "pure-faith", kind: "talent", talentId: "pure-faith", cost: 300 },
      {
        id: "purge-the-unclean",
        kind: "talent",
        talentId: "purge-the-unclean",
        cost: 300,
        prerequisites: "Pure Faith",
      },
      {
        id: "encarta-maleficarum",
        kind: "elite-advance",
        eliteAdvanceId: "encarta-maleficarum",
      },
    ],
  },
];
