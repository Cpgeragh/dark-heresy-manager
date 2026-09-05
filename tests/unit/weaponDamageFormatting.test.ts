import { describe, it, expect } from "vitest";
import {
  splitWeaponQualities,
  parseWeaponDamage,
  getKnownSpecialRuleNames,
} from "../../src/pages/CharacterSheet/weapons/weaponDamageFormatting";

// ============================================================
// splitWeaponQualities
// ============================================================

describe("splitWeaponQualities", () => {
  it("returns an empty array for undefined", () => {
    expect(splitWeaponQualities(undefined)).toEqual([]);
  });

  it("returns an empty array for a dash placeholder", () => {
    expect(splitWeaponQualities("-")).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(splitWeaponQualities("")).toEqual([]);
  });

  it("splits a single quality", () => {
    expect(splitWeaponQualities("Tearing")).toEqual(["Tearing"]);
  });

  it("splits and trims multiple qualities", () => {
    expect(splitWeaponQualities("Tearing,  Reliable ,Primitive")).toEqual([
      "Tearing",
      "Reliable",
      "Primitive",
    ]);
  });

  it("drops empty entries from stray commas", () => {
    expect(splitWeaponQualities("Tearing,,Reliable")).toEqual(["Tearing", "Reliable"]);
  });
});

// ============================================================
// parseWeaponDamage
// ============================================================

describe("parseWeaponDamage", () => {
  it("parses base dice, bonus, and type", () => {
    expect(parseWeaponDamage("1d10+3 I", "R")).toEqual({ base: "1d10", plus: "3", type: "I" });
  });

  it("defaults plus to 0 when there is no bonus", () => {
    expect(parseWeaponDamage("1d10 I", "R")).toEqual({ base: "1d10", plus: "0", type: "I" });
  });

  it("falls back to the given type when none is present", () => {
    expect(parseWeaponDamage("2d10+2", "E")).toEqual({ base: "2d10", plus: "2", type: "E" });
  });

  it("uppercases a lowercase damage type", () => {
    expect(parseWeaponDamage("1d10+1 r", "I")).toEqual({ base: "1d10", plus: "1", type: "R" });
  });

  it("falls back to 1d10 and the given type for undefined input", () => {
    expect(parseWeaponDamage(undefined, "X")).toEqual({ base: "1d10", plus: "0", type: "X" });
  });

  it("falls back to 1d10 and the given type for unparseable input", () => {
    expect(parseWeaponDamage("not a dice string", "R")).toEqual({
      base: "1d10",
      plus: "0",
      type: "R",
    });
  });
});

// ============================================================
// getKnownSpecialRuleNames
// ============================================================

describe("getKnownSpecialRuleNames", () => {
  it("returns an empty array for undefined", () => {
    expect(getKnownSpecialRuleNames(undefined)).toEqual([]);
  });

  it("returns an empty array for an empty string", () => {
    expect(getKnownSpecialRuleNames("")).toEqual([]);
  });

  it("returns known rule names", () => {
    expect(getKnownSpecialRuleNames("Tearing, Reliable")).toEqual(["Tearing", "Reliable"]);
  });

  it("strips a parenthetical suffix before matching", () => {
    expect(getKnownSpecialRuleNames("Blast (5)")).toEqual(["Blast"]);
  });

  it("drops names with no entry in the special-rules table", () => {
    expect(getKnownSpecialRuleNames("Tearing, Not A Real Quality")).toEqual(["Tearing"]);
  });

  it("drops a dash placeholder", () => {
    expect(getKnownSpecialRuleNames("—")).toEqual([]);
  });
});
