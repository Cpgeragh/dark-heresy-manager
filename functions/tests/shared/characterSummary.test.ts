// functions/tests/shared/characterSummary.test.ts
import { describe, it, expect } from "vitest";
import { computeCharacterSummary, isSummaryRelevantField } from "../../src/shared/characterSummary";

describe("isSummaryRelevantField", () => {
  it("treats header as summary-relevant", () => {
    expect(isSummaryRelevantField("header")).toBe(true);
  });

  it("treats portraitUrl as summary-relevant", () => {
    expect(isSummaryRelevantField("portraitUrl")).toBe(true);
  });

  it("treats notes as not summary-relevant", () => {
    expect(isSummaryRelevantField("notes")).toBe(false);
  });
});

describe("computeCharacterSummary", () => {
  it("derives the restricted fields from a full character record", () => {
    expect(
      computeCharacterSummary({
        campaignId: "camp-1",
        header: {
          characterName: "Brother Corvus",
          playerName: "Alex",
          career: "Guardsman",
          rank: "Conscript",
        },
        portraitUrl: "data:image/png;base64,xyz",
        recoveryCode: "DH-TEST-0001",
        notes: "should never appear here",
      })
    ).toEqual({
      campaignId: "camp-1",
      characterName: "Brother Corvus",
      playerName: "Alex",
      career: "Guardsman",
      rank: "Conscript",
      portraitUrl: "data:image/png;base64,xyz",
    });
  });

  it("omits optional fields that aren't set", () => {
    expect(
      computeCharacterSummary({ campaignId: "camp-1", header: { characterName: "Brother Corvus" } })
    ).toEqual({ campaignId: "camp-1", characterName: "Brother Corvus" });
  });

  it("never includes the Recovery Code or any other sheet data", () => {
    const summary = computeCharacterSummary({
      campaignId: "camp-1",
      header: { characterName: "Brother Corvus" },
      recoveryCode: "DH-TEST-0001",
      notes: "private",
    });
    expect(summary).not.toHaveProperty("recoveryCode");
    expect(summary).not.toHaveProperty("notes");
  });
});
