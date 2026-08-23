import { describe, it, expect } from "vitest";
import { createEmptyCharacterData, isBackgroundComplete } from "../../src/utils/characterFactory";
import type { Character } from "../../src/types/Character";

const base = { campaignId: "campaign-123", recoveryCode: "DH-ABCD-1234" };

describe("createEmptyCharacterData", () => {
  it("applies campaignId and recoveryCode", () => {
    const char = createEmptyCharacterData(base);
    expect(char.campaignId).toBe("campaign-123");
    expect(char.recoveryCode).toBe("DH-ABCD-1234");
  });

  it("sets userId to null by default", () => {
    expect(createEmptyCharacterData(base).userId).toBeNull();
  });

  it("accepts explicit userId", () => {
    const char = createEmptyCharacterData({ ...base, userId: "user-abc" });
    expect(char.userId).toBe("user-abc");
  });

  it("defaults character name to New Acolyte", () => {
    expect(createEmptyCharacterData(base).header.characterName).toBe("New Acolyte");
  });

  it("applies custom characterName", () => {
    const char = createEmptyCharacterData({ ...base, characterName: "Brother Corvus" });
    expect(char.header.characterName).toBe("Brother Corvus");
  });

  it("sets isEditableByPlayer to false", () => {
    expect(createEmptyCharacterData(base).isEditableByPlayer).toBe(false);
  });

  it("starts without a preselected Homeworld", () => {
    expect(createEmptyCharacterData(base).talentsAndTraits.homeworld).toBe("");
  });

  it("initialises all characteristics to zero", () => {
    const { characteristics } = createEmptyCharacterData(base);
    for (const key of Object.keys(characteristics)) {
      const stat = characteristics[key as keyof typeof characteristics];
      expect(stat.base).toBe(0);
      expect(stat.advances).toBe(0);
    }
  });

  it("initialises wounds and fate to zero", () => {
    const char = createEmptyCharacterData(base);
    expect(char.wounds.total).toBe(0);
    expect(char.wounds.current).toBe(0);
    expect(char.fate.total).toBe(0);
    expect(char.fate.current).toBe(0);
  });

  it("initialises experience totals to zero with empty ranks", () => {
    const char = createEmptyCharacterData(base);
    expect(char.experience.total).toBe(0);
    expect(char.experience.spent).toBe(0);
    expect(char.experience.ranks).toHaveLength(0);
  });

  it("starts with no owned skills", () => {
    const char = createEmptyCharacterData(base);
    expect(char.skills).toEqual([]);
  });

  it("initialises empty arrays for weapons and gear", () => {
    const char = createEmptyCharacterData(base);
    expect(char.rangedWeapons).toHaveLength(0);
    expect(char.meleeWeapons).toHaveLength(0);
    expect(char.gear).toHaveLength(0);
  });
});

function makeCharacter(overrides: {
  homeworld?: string;
  career?: string;
  rank?: string;
  backgroundComplete?: boolean;
}): Character {
  const data = createEmptyCharacterData(base);
  return {
    ...data,
    id: "test-char",
    header: { ...data.header, career: overrides.career ?? "", rank: overrides.rank ?? "" },
    talentsAndTraits: { ...data.talentsAndTraits, homeworld: overrides.homeworld ?? "" },
    backgroundComplete: overrides.backgroundComplete,
  };
}

describe("isBackgroundComplete", () => {
  it("is false when none of Homeworld, Career, or Rank are set", () => {
    expect(isBackgroundComplete(makeCharacter({}))).toBe(false);
  });

  it("is false when only some of the three are set", () => {
    expect(isBackgroundComplete(makeCharacter({ homeworld: "hive-world", career: "Guardsman" }))).toBe(false);
  });

  it("remains false until the player confirms, even when all required selections exist", () => {
    expect(
      isBackgroundComplete(
        makeCharacter({ homeworld: "hive-world", career: "Guardsman", rank: "Conscript" })
      )
    ).toBe(false);
  });

  it("is true when the flag is already set, regardless of the live fields", () => {
    expect(isBackgroundComplete(makeCharacter({ backgroundComplete: true }))).toBe(true);
  });
});
