import { describe, it, expect } from "vitest";
import { getSpentXp } from "../../src/features/experience/xpSpent";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character } from "../../src/types/Character";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
  return { ...data, id: "test-char", ...overrides };
}

describe("getSpentXp", () => {
  it("sums manual rank advances", () => {
    const char = makeCharacter({
      experience: {
        total: 1000,
        spent: 0,
        ranks: [{ rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }] }],
      },
    });
    expect(getSpentXp(char)).toBe(100);
  });

  it("sums manual rank advances across multiple ranks and advances", () => {
    const char = makeCharacter({
      experience: {
        total: 1000,
        spent: 0,
        ranks: [
          { rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }, { id: "a2", name: "Dodge", cost: 100 }] },
          { rank: 2, advances: [{ id: "a3", name: "Quick Draw", cost: 100 }] },
        ],
      },
    });
    expect(getSpentXp(char)).toBe(300);
  });

  it("sums manual rank advances and Characteristic Advances together", () => {
    const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
    const char: Character = {
      ...data,
      id: "test-char",
      header: { ...data.header, career: "Guardsman" },
      characteristics: { ...data.characteristics, ws: { base: 30, advances: 1 } },
      experience: {
        total: 1000,
        spent: 0,
        ranks: [{ rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }] }],
      },
    };
    // 100 (manual advance) + 100 (WS Simple tier for Guardsman)
    expect(getSpentXp(char)).toBe(200);
  });

  it("is zero for a brand new character", () => {
    expect(getSpentXp(makeCharacter())).toBe(0);
  });

  it("includes DM spending but not DM XP awards", () => {
    const char = makeCharacter({
      experience: {
        total: 1_000,
        spent: 0,
        ranks: [],
        transactions: [
          { id: "award", type: "add", amount: 200, rankId: "conscript" },
          { id: "spend", type: "spend", amount: 150, rankId: "conscript" },
        ],
      },
    });
    expect(getSpentXp(char)).toBe(150);
  });

  it("sums manual rank advances, Characteristic Advances, and Skills together", () => {
    const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
    const char: Character = {
      ...data,
      id: "test-char",
      header: { ...data.header, career: "Guardsman", rank: "Conscript" },
      characteristics: { ...data.characteristics, ws: { base: 30, advances: 1 } },
      skills: [
        { id: "awareness", name: "Awareness", characteristic: "per", level: "trained", category: "General", advanced: false, source: "CR" },
      ],
      experience: {
        total: 1000,
        spent: 0,
        ranks: [{ rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }] }],
      },
    };
    // 100 (manual advance) + 100 (WS Simple) + 100 (Awareness Trained)
    expect(getSpentXp(char)).toBe(300);
  });

  it("sums manual rank advances, Characteristic Advances, Skills, and Talents together", () => {
    const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
    const char: Character = {
      ...data,
      id: "test-char",
      header: { ...data.header, career: "Guardsman", rank: "Conscript" },
      characteristics: { ...data.characteristics, ws: { base: 30, advances: 1 } },
      skills: [
        { id: "awareness", name: "Awareness", characteristic: "per", level: "trained", category: "General", advanced: false, source: "CR" },
      ],
      talentsAndTraits: {
        ...data.talentsAndTraits,
        talents: [{ uid: "s1", talentId: "sound-constitution", name: "Sound Constitution" }],
      },
      experience: {
        total: 1000,
        spent: 0,
        ranks: [{ rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }] }],
      },
    };
    // 100 (manual advance) + 100 (WS Simple) + 100 (Awareness Trained) + 100 (Sound Constitution)
    expect(getSpentXp(char)).toBe(400);
  });

  it("sums manual rank advances, Characteristic Advances, Skills, Talents, and Weapon Training together", () => {
    const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
    const char: Character = {
      ...data,
      id: "test-char",
      header: { ...data.header, career: "Guardsman", rank: "Conscript" },
      characteristics: { ...data.characteristics, ws: { base: 30, advances: 1 } },
      skills: [
        { id: "awareness", name: "Awareness", characteristic: "per", level: "trained", category: "General", advanced: false, source: "CR" },
      ],
      talentsAndTraits: {
        ...data.talentsAndTraits,
        talents: [{ uid: "s1", talentId: "sound-constitution", name: "Sound Constitution" }],
      },
      weaponTraining: {
        trained: ["basic-las"],
        exoticWeapons: [],
      },
      experience: {
        total: 1000,
        spent: 0,
        ranks: [{ rank: 1, advances: [{ id: "a1", name: "+5 WS", cost: 100 }] }],
      },
    };
    // 100 (manual advance) + 100 (WS Simple) + 100 (Awareness Trained) + 100 (Sound Constitution) + 100 (Basic Weapon Training Las)
    expect(getSpentXp(char)).toBe(500);
  });

  it("uses persisted paid costs instead of repricing owned advances from the current table", () => {
    const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
    const char: Character = {
      ...data,
      id: "test-char",
      header: { ...data.header, career: "Guardsman", rank: "Scout" },
      characteristics: {
        ...data.characteristics,
        ws: {
          base: 30,
          advances: 1,
          advancePurchases: {
            simple: { cost: 125, careerId: "guardsman", purchasedAtRankId: "conscript" },
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
            trained: { cost: 110, careerId: "guardsman", sourceRankId: "conscript" },
            "+10": { cost: 115, careerId: "guardsman", sourceRankId: "scout" },
          },
        },
      ],
      talentsAndTraits: {
        ...data.talentsAndTraits,
        talents: [
          {
            uid: "sound",
            talentId: "sound-constitution",
            name: "Sound Constitution",
            xpPurchase: { cost: 120, careerId: "guardsman", sourceRankId: "conscript" },
          },
        ],
      },
      weaponTraining: {
        trained: ["basic-las"],
        xpPurchases: {
          "basic-las": { cost: 130, careerId: "guardsman", sourceRankId: "conscript" },
        },
        exoticWeapons: [
          {
            name: "Needle Pistol",
            cost: 999,
            xpPurchase: { cost: 140, careerId: "guardsman", purchasedAtRankId: "scout" },
          },
        ],
      },
    };

    expect(getSpentXp(char)).toBe(740);
  });
});
