import { describe, it, expect } from "vitest";
import {
  getWeaponTrainingCost,
  getUnlockedExoticWeaponSlots,
  getWeaponTrainingSpent,
} from "../../src/mechanics/experience/weaponTrainingAdvanceCosts";
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
});

describe("getUnlockedExoticWeaponSlots", () => {
  it("is zero when the career has no unlocked Exotic Weapon Training entries yet", () => {
    expect(getUnlockedExoticWeaponSlots("Guardsman", "Conscript")).toBe(0);
  });

  it("sums repeatableAtThisRank across unlocked entries", () => {
    expect(getUnlockedExoticWeaponSlots("Guardsman", "Captain")).toBe(1);
  });
});

describe("getWeaponTrainingSpent", () => {
  it("is zero when nothing is trained", () => {
    expect(getWeaponTrainingSpent(makeCharacter({ career: "Guardsman", rank: "Conscript" }))).toBe(0);
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
