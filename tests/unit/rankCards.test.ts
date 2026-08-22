import { describe, expect, it } from "vitest";
import { buildRankCards } from "../../src/features/experience/rankCards";
import type { Character } from "../../src/types/Character";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";

function makeCharacter(): Character {
  const data = createEmptyCharacterData({ campaignId: "campaign", recoveryCode: "recovery" });
  return {
    ...data,
    id: "character",
    header: {
      ...data.header,
      career: "Guardsman",
      rank: "Scout",
      careerPath: "Scout",
    },
    characteristics: {
      ...data.characteristics,
      ws: {
        base: 30,
        advances: 1,
        advancePurchases: {
          simple: {
            cost: 100,
            careerId: "guardsman",
            purchasedAtRankId: "scout",
          },
        },
      },
    },
    skills: [
      {
        id: "awareness",
        name: "Awareness",
        characteristic: "per",
        level: "+10",
        category: "General",
        advanced: false,
        source: "CR",
        xpPurchases: {
          trained: { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
          "+10": { cost: 100, careerId: "guardsman", sourceRankId: "scout" },
        },
      },
      {
        id: "legacy",
        name: "Legacy Unattributed Skill",
        characteristic: "int",
        level: "trained",
        category: "General",
        advanced: false,
        source: "CR",
      },
    ],
    talentsAndTraits: {
      ...data.talentsAndTraits,
      talents: [
        {
          uid: "sound",
          talentId: "sound-constitution",
          name: "Sound Constitution",
          xpPurchase: { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
        },
        {
          uid: "granted",
          talentId: "chem-geld",
          name: "Granted Chem Geld",
          xpPurchase: { cost: 999, careerId: "guardsman", sourceRankId: "conscript" },
          grantedByTalentEntryUid: "source",
        },
      ],
      traits: [
        {
          uid: "manual-trait",
          talentId: "chem-geld",
          name: "Off-career Trait",
          xpPurchase: { cost: 50, careerId: "guardsman", purchasedAtRankId: "scout" },
        },
      ],
    },
    weaponTraining: {
      trained: ["basic-las"],
      xpPurchases: {
        "basic-las": { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
      },
      exoticWeapons: [
        {
          name: "Needle Pistol",
          cost: 200,
          xpPurchase: { cost: 200, careerId: "guardsman", purchasedAtRankId: "scout" },
        },
      ],
    },
    experience: { ...data.experience, spent: 750 },
  };
}

describe("buildRankCards", () => {
  it("creates only reached ranks on the character's actual path", () => {
    expect(buildRankCards(makeCharacter()).map((card) => card.rankId)).toEqual([
      "conscript",
      "guard",
      "armsman",
      "sergeant",
      "veteran",
      "scout",
    ]);
  });

  it("places purchases under their Career-table source rank, even when that rank is older", () => {
    const conscript = buildRankCards(makeCharacter()).find((card) => card.rankId === "conscript")!;
    expect(conscript.careerPurchases.map((entry) => entry.name)).toEqual([
      "Awareness — Trained",
      "Basic Weapon Training (Las)",
      "Sound Constitution",
    ]);
    expect(conscript.careerPurchasesTotal).toBe(300);
  });

  it("places non-rank-specific spending under Rank Up XP Spent for the current rank", () => {
    const scout = buildRankCards(makeCharacter()).find((card) => card.rankId === "scout")!;
    expect(scout.careerPurchases.map((entry) => entry.name)).toEqual(["Awareness — +10"]);
    expect(scout.rankUpXpSpent.map((entry) => entry.name)).toEqual([
      "Exotic Weapon Training (Needle Pistol)",
      "Off-career Trait",
      "Weapon Skill — Simple Advance",
    ]);
    expect(scout.careerPurchasesTotal).toBe(100);
    expect(scout.rankUpXpSpentTotal).toBe(350);
    expect(scout.spentTotal).toBe(450);
    expect(scout.isCurrent).toBe(true);
  });

  it("excludes granted and legacy unattributed entries rather than guessing their rank", () => {
    const names = buildRankCards(makeCharacter()).flatMap((card) => [
      ...card.careerPurchases,
      ...card.rankUpXpSpent,
    ]).map((entry) => entry.name);
    expect(names).not.toContain("Granted Chem Geld");
    expect(names).not.toContain("Legacy Unattributed Skill — Trained");
  });

  it("has card totals that reconcile to attributed Spent XP exactly once", () => {
    const spent = buildRankCards(makeCharacter()).reduce((sum, card) => sum + card.spentTotal, 0);
    expect(spent).toBe(750);
  });
});
