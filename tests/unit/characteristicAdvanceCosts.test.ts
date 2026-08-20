import { describe, it, expect } from "vitest";
import {
  getCharacteristicTierCosts,
  getCharacteristicAdvancesSpent,
} from "../../src/features/experience/characteristicAdvanceCosts";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character, Characteristics } from "../../src/types/Character";

function makeCharacter(overrides: {
  career?: string;
  advances?: Partial<Record<keyof Characteristics, number>>;
}): Character {
  const data = createEmptyCharacterData({ campaignId: "c", recoveryCode: "r" });
  const characteristics = { ...data.characteristics };
  for (const [key, advances] of Object.entries(overrides.advances ?? {})) {
    characteristics[key as keyof Characteristics] = { base: 30, advances: advances! };
  }
  return {
    ...data,
    id: "test-char",
    header: { ...data.header, career: overrides.career ?? "" },
    characteristics,
  };
}

describe("getCharacteristicTierCosts", () => {
  it("returns Guardsman's real Weapon Skill tier costs", () => {
    expect(getCharacteristicTierCosts("Guardsman", "ws")).toEqual([100, 250, 500, 750]);
  });

  it("returns Guardsman's real Intelligence tier costs (Expert differs from the rest)", () => {
    expect(getCharacteristicTierCosts("Guardsman", "int")).toEqual([500, 750, 1000, 2500]);
  });

  it("returns four undefined entries for a career with no data yet", () => {
    expect(getCharacteristicTierCosts("Made-Up Career", "ws")).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("returns four undefined entries when no career is set", () => {
    expect(getCharacteristicTierCosts(undefined, "ws")).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("returns four null entries for a characteristic that's confirmed unbuyable for a career", () => {
    expect(getCharacteristicTierCosts("Tech-Priest", "fel")).toEqual([null, null, null, null]);
  });
});

describe("getCharacteristicAdvancesSpent", () => {
  it("is zero when no characteristic has any advances", () => {
    expect(getCharacteristicAdvancesSpent(makeCharacter({ career: "Guardsman" }))).toBe(0);
  });

  it("sums the cost of every tier already bought for one characteristic", () => {
    // Weapon Skill Simple + Intermediate = 100 + 250
    const char = makeCharacter({ career: "Guardsman", advances: { ws: 2 } });
    expect(getCharacteristicAdvancesSpent(char)).toBe(350);
  });

  it("sums across multiple characteristics independently", () => {
    // WS Simple+Intermediate (100+250) + BS Simple (100)
    const char = makeCharacter({ career: "Guardsman", advances: { ws: 2, bs: 1 } });
    expect(getCharacteristicAdvancesSpent(char)).toBe(450);
  });

  it("is zero for a character with no career set, regardless of advances owned", () => {
    const char = makeCharacter({ advances: { ws: 3 } });
    expect(getCharacteristicAdvancesSpent(char)).toBe(0);
  });

  it("treats a null (unbuyable) tier as zero spent, even if advances were somehow set", () => {
    const char = makeCharacter({ career: "Tech-Priest", advances: { fel: 2 } });
    expect(getCharacteristicAdvancesSpent(char)).toBe(0);
  });
});
