import type { SkillAdvanceLevel } from "./types.js";
import { SkillSource } from "./skillSource.js";

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
  insanityGain?: "1d5";
  characteristicReductions?: readonly {
    characteristic: "t" | "fel";
    amount: "1d5";
  }[];
  effects?: readonly string[];
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
