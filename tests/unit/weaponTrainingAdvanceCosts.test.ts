import { describe, it, expect } from "vitest";
import {
  getExoticWeaponTrainingPurchase,
  getExoticWeaponTrainingPurchases,
  getWeaponTrainingCost,
  getWeaponTrainingSpent,
} from "shared-rules";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character, WeaponTrainingTalentId } from "../../src/types/Character";

function makeCharacter(overrides: {
  career?: string;
  rank?: string;
  trained?: WeaponTrainingTalentId[];
  manualCosts?: Partial<Record<WeaponTrainingTalentId, number>>;
  exoticWeapons?: { name: string; cost: number; bonus?: boolean }[];
}): Character {
  const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
  return {
    ...data,
    id: "test-char",
    header: { ...data.header, career: overrides.career ?? "", rank: overrides.rank ?? "" },
    weaponTraining: {
      trained: overrides.trained ?? [],
      exoticWeapons: overrides.exoticWeapons ?? [],
      manualCosts: overrides.manualCosts,
    },
  };
}

describe("getWeaponTrainingCost", () => {
  it("returns the real cost when the specialisation is unlocked at the current rank", () => {
    expect(getWeaponTrainingCost("Guardsman", "Conscript", "basic-las")).toBe(100);
  });

  it("returns undefined when the specialisation is on the career table but not reached yet", () => {
    expect(getWeaponTrainingCost("Guardsman", "Conscript", "basic-bolt")).toBeUndefined();
  });

  it("returns undefined when no career is set", () => {
    expect(getWeaponTrainingCost(undefined, undefined, "basic-las")).toBeUndefined();
  });

  it("uses Weapon Training from a selected Alternate Rank table", () => {
    expect(
      getWeaponTrainingCost("Cleric", "Preacher", "melee-power", [
        {
          alternateRankId: "black-priest-of-maccabeus",
          replacedRankId: "preacher",
          takenAtTier: 4,
        },
      ])
    ).toBe(200);
  });
});

describe("getExoticWeaponTrainingPurchases", () => {
  const secutor = [
    {
      alternateRankId: "mechanicus-secutor",
      replacedRankId: "enginseer",
      takenAtTier: 4,
    },
  ];

  it("returns all five Mechanicus Secutor choices with their printed costs", () => {
    expect(getExoticWeaponTrainingPurchases("Tech-Priest", "Enginseer", secutor)).toEqual([
      {
        name: "Breacher",
        purchase: { cost: 200, careerId: "tech-priest", sourceRankId: "enginseer" },
      },
      {
        name: "Graviton Gun",
        purchase: { cost: 300, careerId: "tech-priest", sourceRankId: "enginseer" },
      },
      {
        name: "Needle Pistol",
        purchase: { cost: 300, careerId: "tech-priest", sourceRankId: "enginseer" },
      },
      {
        name: "Rad-Cleanser",
        purchase: { cost: 300, careerId: "tech-priest", sourceRankId: "enginseer" },
      },
      {
        name: "Shock Blaster",
        purchase: { cost: 200, careerId: "tech-priest", sourceRankId: "enginseer" },
      },
    ]);
  });

  it("returns the exact source-rank purchase for one specialisation", () => {
    expect(
      getExoticWeaponTrainingPurchase("Tech-Priest", "Enginseer", "rad-cleanser", secutor)
    ).toEqual({ cost: 300, careerId: "tech-priest", sourceRankId: "enginseer" });
  });

  it("keeps only pistol-compatible choices for a Metallican Gunslinger", () => {
    const metallican = [
      {
        alternateRankId: "metallican-gunslinger",
        replacedRankId: "sell-steel",
        takenAtTier: 1,
      },
    ];

    expect(getExoticWeaponTrainingPurchases("Assassin", "Assassin", metallican)).toEqual([
      {
        name: "Needle Pistol",
        purchase: { cost: 200, careerId: "assassin", sourceRankId: "secluse" },
      },
      {
        name: "Web Pistol",
        purchase: { cost: 200, careerId: "assassin", sourceRankId: "secluse" },
      },
    ]);
  });
});

describe("getWeaponTrainingSpent", () => {
  it("is zero when nothing is trained", () => {
    expect(getWeaponTrainingSpent(makeCharacter({ career: "Guardsman", rank: "Conscript" }))).toBe(
      0
    );
  });

  it("sums the real cost of each trained fixed-group id", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      trained: ["basic-las", "basic-primitive"],
    });
    expect(getWeaponTrainingSpent(char)).toBe(200);
  });

  it("falls back to a DM's manual cost when there's no real cost for that id", () => {
    const char = makeCharacter({
      career: "Guardsman",
      rank: "Conscript",
      trained: ["basic-bolt"],
      manualCosts: { "basic-bolt": 350 },
    });
    expect(getWeaponTrainingSpent(char)).toBe(350);
  });

  it("sums exotic weapon costs, including bonus entries", () => {
    const char = makeCharacter({
      exoticWeapons: [
        { name: "Needle Pistol", cost: 200 },
        { name: "Web Pistol", cost: 0, bonus: true },
      ],
    });
    expect(getWeaponTrainingSpent(char)).toBe(200);
  });
});
