import { describe, expect, it } from "vitest";
import { FAITH_TALENT_RULES, TALENT_LIST } from "shared-rules";
import { TALENT_DESCRIPTIONS } from "../../src/data/reference/talentDescriptions";

function talent(id: string) {
  return TALENT_LIST.find((entry) => entry.id === id);
}

describe("Faith Talent data", () => {
  it("records the supplied Inquisitor's Handbook shared rules", () => {
    expect(FAITH_TALENT_RULES).toMatchObject({
      source: "IH",
      foundationTalentId: "pure-faith",
    });
    expect(FAITH_TALENT_RULES.corruptionRestriction).toContain("more than 10");
    expect(FAITH_TALENT_RULES.warpEntityDefinition).toContain("Daemonhosts");
  });

  it("marks the supplied IH-only talents as General Faith Talents", () => {
    expect(talent("purge-the-unclean")).toMatchObject({
      source: "IH",
      prerequisites: "Pure Faith",
      faithGroup: "general",
    });
    expect(talent("blessed-radiance")).toMatchObject({
      source: "IH",
      faithGroup: "general",
    });
    expect(TALENT_DESCRIPTIONS["purge-the-unclean"]).toContain("2d5 Rounds");
    expect(TALENT_DESCRIPTIONS["blessed-radiance"]).toContain("twice your Willpower Bonus");
  });

  it("keeps Blood of Martyrs as the canonical version of duplicate talent names", () => {
    expect(talent("pure-faith")).toMatchObject({ source: "BoM", faithGroup: "general" });
    expect(talent("divine-ministration")).toMatchObject({
      source: "BoM",
      faithGroup: "mercy",
    });
    expect(talent("wrath-of-the-righteous")).toMatchObject({
      source: "BoM",
      faithGroup: "wrath",
    });
  });
});
