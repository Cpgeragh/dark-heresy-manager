import { describe, expect, it } from "vitest";

import { SkillSource } from "../../src/types/SkillSource";
import { chipColours } from "../../src/ui/styles/colourTokens";
import {
  availabilityChipColour,
  characteristicChipColour,
  sourceChipColour,
} from "../../src/ui/styles/sourceStyles";

const isPaletteKey = (value: string) => Object.keys(chipColours).includes(value);

describe("sourceChipColour", () => {
  it("gives every real source a palette colour", () => {
    for (const source of Object.values(SkillSource)) {
      expect(isPaletteKey(sourceChipColour(source))).toBe(true);
    }
  });

  it("gives every source except the core rulebook its own colour", () => {
    const colours = Object.values(SkillSource)
      .filter((source) => source !== SkillSource.CR)
      .map((source) => sourceChipColour(source));

    expect(new Set(colours).size).toBe(colours.length);
    expect(colours).not.toContain("slate");
  });

  it("uses slate for the core rulebook and for unknown sources", () => {
    expect(sourceChipColour("CR")).toBe("slate");
    expect(sourceChipColour("Unknown Book")).toBe("slate");
  });

  it("has colours for the Custom and 2nd Ed labels", () => {
    expect(sourceChipColour("Custom")).toBe("fuchsia");
    expect(sourceChipColour("2nd Ed")).toBe("lime");
  });
});

describe("availabilityChipColour", () => {
  it.each([
    "Abundant",
    "Plentiful",
    "Common",
    "Average",
    "Uncommon",
    "Scarce",
    "Rare",
    "Very Rare",
    "Extremely Rare",
    "Near Unique",
    "Unique",
    "Issued Only",
    "Adeptus Mechanicus Only",
    "Tech-Priest Only",
  ])("maps %s to a palette colour", (availability) => {
    expect(isPaletteKey(availabilityChipColour(availability))).toBe(true);
  });

  it("uses one colour for both Mechanicus restrictions", () => {
    expect(availabilityChipColour("Adeptus Mechanicus Only")).toBe("red");
    expect(availabilityChipColour("Tech-Priest Only")).toBe("red");
  });

  it("uses slate for missing and unrecognised values", () => {
    expect(availabilityChipColour(undefined)).toBe("slate");
    expect(availabilityChipColour("—")).toBe("slate");
    expect(availabilityChipColour("Scarce (Common for Orks)")).toBe("slate");
  });
});

describe("characteristicChipColour", () => {
  it("groups combat, physical, mental and social characteristics", () => {
    expect(characteristicChipColour("ws")).toBe("amber");
    expect(characteristicChipColour("bs")).toBe("amber");
    expect(characteristicChipColour("s")).toBe("green");
    expect(characteristicChipColour("t")).toBe("green");
    expect(characteristicChipColour("ag")).toBe("green");
    expect(characteristicChipColour("int")).toBe("blue");
    expect(characteristicChipColour("per")).toBe("blue");
    expect(characteristicChipColour("wp")).toBe("blue");
    expect(characteristicChipColour("fel")).toBe("pink");
  });

  it("ignores case and falls back to slate", () => {
    expect(characteristicChipColour("WS")).toBe("amber");
    expect(characteristicChipColour("other")).toBe("slate");
  });
});
