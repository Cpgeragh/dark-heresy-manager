import { describe, expect, it } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { ELITE_ADVANCES } from "../../src/data/reference/eliteAdvanceData";
import { TALENT_LIST } from "../../src/data/reference/talentData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const talentIds = new Set(TALENT_LIST.map((talent) => talent.id));

describe("eliteAdvanceData", () => {
  const encarta = ELITE_ADVANCES.find((advance) => advance.id === "encarta-maleficarum");

  it("stores Encarta Maleficarum independently from its alternate rank", () => {
    expect(encarta).toMatchObject({
      name: "Encarta Maleficarum",
      source: "IH",
      cost: 500,
      prerequisites: "T 40",
      downtime: "1d5 weeks",
      alternateRankIds: ["black-priest-of-maccabeus"],
      grantedTalents: ["insanely-faithful"],
    });
    expect(encarta?.consequences).toHaveLength(3);
    expect(encarta?.effects).toHaveLength(2);
  });

  it("only grants skills and talents that exist", () => {
    for (const advance of ELITE_ADVANCES) {
      for (const grant of advance.grantedSkills ?? []) {
        expect(skillIds.has(grant.skillId), `${advance.id}: ${grant.skillId}`).toBe(true);
      }
      for (const talentId of advance.grantedTalents ?? []) {
        expect(talentIds.has(talentId), `${advance.id}: ${talentId}`).toBe(true);
      }
    }
  });
});
