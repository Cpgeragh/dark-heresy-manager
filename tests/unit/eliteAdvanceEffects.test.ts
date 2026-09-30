import { describe, expect, it } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { getCharacteristicModifierTotals } from "../../src/mechanics/corruption/characteristicModifierTotals";
import {
  getGrantedTalentEntries,
  getTalentSkillEffects,
} from "../../src/mechanics/talents/talentEffects";
import type { TalentsAndTraitsBlock } from "../../src/types/Character";

const talents: TalentsAndTraitsBlock = {
  homeworld: "",
  talents: [],
  traits: [],
  eliteAdvances: [
    {
      uid: "encarta",
      eliteAdvanceId: "encarta-maleficarum",
      name: "Encarta Maleficarum",
      acquisition: {
        insanityGained: 2,
        characteristicReductions: { t: 3, fel: 4 },
      },
    },
  ],
};

describe("packaged Elite Advance effects", () => {
  it("grants its Talent with Elite Advance provenance", () => {
    expect(getGrantedTalentEntries(talents)).toContainEqual(
      expect.objectContaining({
        talentId: "insanely-faithful",
        grantedByTalentName: "Encarta Maleficarum",
        grantedByType: "Elite Advance",
      })
    );
  });

  it("grants its Skill with Elite Advance provenance", () => {
    const skill = DEFAULT_SKILLS.find((entry) => entry.id === "forbidden-ordos-malleus");
    expect(skill).toBeDefined();
    const effects = getTalentSkillEffects(talents, skill!);
    expect(effects.minimumLevel).toBe("trained");
    expect(effects.sources).toContainEqual(
      expect.objectContaining({ name: "Encarta Maleficarum", type: "Elite Advance" })
    );
  });

  it("applies its recorded permanent Characteristic reductions", () => {
    const totals = getCharacteristicModifierTotals({ points: 0, malignancies: [] }, talents);
    expect(totals.t).toBe(-3);
    expect(totals.fel).toBe(-4);
  });
});
