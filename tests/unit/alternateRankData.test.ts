import { describe, expect, it } from "vitest";
import { ALTERNATE_RANKS } from "../../src/data/reference/alternateRankData";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { ELITE_ADVANCES } from "../../src/data/reference/eliteAdvanceData";
import { TALENT_LIST } from "../../src/data/reference/talentData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const talentIds = new Set(TALENT_LIST.map((talent) => talent.id));

describe("alternateRankData", () => {
  const blackPriest = ALTERNATE_RANKS.find((rank) => rank.id === "black-priest-of-maccabeus");

  it("records the supplied Black Priest entry requirements", () => {
    expect(blackPriest).toMatchObject({
      requiredCareerId: "cleric",
      minimumRank: 4,
      minimumXp: 2_000,
      requirements: {
        maximumCorruption: 9,
        requiredOriginOrTraining: "Maccabeus Quintus",
        excludedOrigins: ["Mind Cleansed"],
      },
    });
  });

  it("records all 30 supplied advances in table order", () => {
    expect(
      blackPriest?.advances.map((advance) =>
        [
          advance.id,
          advance.kind,
          "skillId" in advance
            ? advance.skillId
            : "talentId" in advance
              ? advance.talentId
              : advance.eliteAdvanceId,
          "level" in advance ? advance.level : "",
          "specialisation" in advance ? advance.specialisation : "",
          "cost" in advance ? advance.cost : "",
          "prerequisites" in advance ? (advance.prerequisites ?? "") : "",
        ].join("|")
      )
    ).toEqual([
      "command|skill|command|||100|",
      "common-imperial-creed-20|skill|common-imperial-creed|+20||100|Common Lore (Imperial Creed) +10",
      "deceive-10|skill|deceive|+10||100|Deceive",
      "forbidden-cults|skill|forbidden-cults|||100|",
      "forbidden-daemonology|skill|forbidden-daemonology|||100|",
      "forbidden-daemonology-10|skill|forbidden-daemonology|+10||100|Forbidden Lore (Daemonology)",
      "interrogation|skill|interrogation|||100|",
      "intimidation|skill|intimidate|||100|",
      "pilot-civilian-10|skill|pilot-civilian|+10||100|Pilot (Civilian Craft)",
      "scholastic-legend-10|skill|scholastic-legend|+10||100|Scholastic Lore (Legend)",
      "scholastic-occult|skill|scholastic-occult|||100|",
      "speak-high-gothic|skill|speak-high-gothic|||100|",
      "basic-bolt|talent|basic-weapon-training||Bolt|100|",
      "basic-flame|talent|basic-weapon-training||Flame|100|",
      "hatred-daemons|talent|hatred||Daemons|100|",
      "master-orator|talent|master-orator|||100|Fel 30",
      "melee-chain|talent|melee-weapon-training||Chain|100|",
      "unshakeable-faith|talent|unshakeable-faith|||100|",
      "sound-constitution-100|talent|sound-constitution|||100|",
      "command-10|skill|command|+10||200|Command",
      "forbidden-cults-10|skill|forbidden-cults|+10||200|Forbidden Lore (Cults)",
      "forbidden-warp|skill|forbidden-warp|||200|",
      "melee-power|talent|melee-weapon-training||Power|200|",
      "peer-ordo-malleus|talent|peer||Ordo Malleus|200|Fel 30",
      "pistol-bolt|talent|pistol-training||Bolt|200|",
      "pistol-flame|talent|pistol-training||Flame|200|",
      "sound-constitution-200|talent|sound-constitution|||200|",
      "pure-faith|talent|pure-faith|||300|",
      "purge-the-unclean|talent|purge-the-unclean|||300|Pure Faith",
      "encarta-maleficarum|elite-advance|encarta-maleficarum||||",
    ]);
  });

  it("only references skills and talents that exist", () => {
    for (const advance of blackPriest?.advances ?? []) {
      if (advance.kind === "skill") expect(skillIds.has(advance.skillId), advance.id).toBe(true);
      if (advance.kind === "talent") expect(talentIds.has(advance.talentId), advance.id).toBe(true);
      if (advance.kind === "elite-advance") {
        expect(
          ELITE_ADVANCES.some((eliteAdvance) => eliteAdvance.id === advance.eliteAdvanceId),
          advance.eliteAdvanceId
        ).toBe(true);
      }
    }
  });
});
