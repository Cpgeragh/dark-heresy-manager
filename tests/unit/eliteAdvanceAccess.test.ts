import { describe, expect, it } from "vitest";
import {
  getAvailableNamedEliteAdvances,
  getMissedRankEliteAdvanceOptions,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceAccess";
import type { ExperienceBlock } from "../../src/types/Character";

const experience: ExperienceBlock = {
  total: 3_000,
  spent: 2_000,
  ranks: [],
  alternateRanks: [
    {
      alternateRankId: "black-priest-of-maccabeus",
      replacedRankId: "preacher",
      takenAtTier: 4,
    },
  ],
};

describe("Elite Advance access", () => {
  it("unlocks a named advance only after its Alternate Rank is selected", () => {
    expect(getAvailableNamedEliteAdvances({ total: 0, spent: 0, ranks: [] })).toEqual([]);
    expect(getAvailableNamedEliteAdvances(experience).map((entry) => entry.id)).toEqual([
      "encarta-maleficarum",
    ]);
  });

  it("does not offer an automatic Alternate Rank grant as a purchase", () => {
    expect(
      getAvailableNamedEliteAdvances({
        total: 3_000,
        spent: 3_000,
        ranks: [],
        alternateRanks: [
          {
            alternateRankId: "malfian-bloodsworn",
            replacedRankId: "veteran",
            takenAtTier: 5,
          },
        ],
      })
    ).toEqual([]);
  });

  it("does not expose missed-rank advances until the following rank", () => {
    const result = getMissedRankEliteAdvanceOptions({
      career: "Cleric",
      rank: "Preacher",
      experience,
      skills: [],
      talents: [],
    });
    expect(result.skills).toEqual([]);
    expect(result.talents).toEqual([]);
  });

  it("adds 50 XP to missed-rank advances after the following rank is reached", () => {
    const result = getMissedRankEliteAdvanceOptions({
      career: "Cleric",
      rank: "Cleric",
      experience,
      skills: [],
      talents: [],
    });
    expect(result.skills).toContainEqual(
      expect.objectContaining({ skillId: "command", level: "trained", cost: 150 })
    );
    expect(result.talents).toContainEqual(
      expect.objectContaining({ talentId: "pistol-training", specialisation: "Bolt", cost: 250 })
    );
  });
});
