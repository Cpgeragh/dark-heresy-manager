import { describe, it, expect } from "vitest";
import {
  normaliseName,
  addSpecialRule,
  rangedRulesForCraftsmanship,
  modifyDamageBonus,
  meleeDamageForCraftsmanship,
  compareWeaponEntries,
} from "../../src/utils/weaponUtils";

// ============================================================
// normaliseName
// ============================================================

describe("normaliseName", () => {
  it("lowercases the string", () => {
    expect(normaliseName("Bolter")).toBe("bolter");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normaliseName("  Bolter  ")).toBe("bolter");
  });

  it("collapses multiple interior spaces to a single space", () => {
    expect(normaliseName("Bolt  Pistol")).toBe("bolt pistol");
  });

  it("handles a string that is already normalised", () => {
    expect(normaliseName("bolt pistol")).toBe("bolt pistol");
  });

  it("handles empty string", () => {
    expect(normaliseName("")).toBe("");
  });
});

// ============================================================
// addSpecialRule
// ============================================================

describe("addSpecialRule", () => {
  it("returns just the rule when existing rules is empty", () => {
    expect(addSpecialRule("", "Reliable")).toBe("Reliable");
  });

  it("returns just the rule when existing rules is whitespace-only", () => {
    expect(addSpecialRule("   ", "Reliable")).toBe("Reliable");
  });

  it("returns just the rule when existing rules is a dash placeholder", () => {
    expect(addSpecialRule("-", "Reliable")).toBe("Reliable");
  });

  it("returns just the rule when existing rules is an em-dash placeholder", () => {
    expect(addSpecialRule("—", "Reliable")).toBe("Reliable");
  });

  it("appends the new rule to existing rules", () => {
    expect(addSpecialRule("Tearing", "Reliable")).toBe("Tearing, Reliable");
  });

  it("appends to a list of multiple existing rules", () => {
    expect(addSpecialRule("Tearing, Primitive", "Reliable")).toBe("Tearing, Primitive, Reliable");
  });

  it("does not add a duplicate rule (exact match)", () => {
    expect(addSpecialRule("Tearing, Reliable", "Reliable")).toBe("Tearing, Reliable");
  });

  it("does not add a duplicate rule (case-insensitive)", () => {
    expect(addSpecialRule("Tearing, RELIABLE", "reliable")).toBe("Tearing, RELIABLE");
  });
});

// ============================================================
// rangedRulesForCraftsmanship
// ============================================================

describe("rangedRulesForCraftsmanship", () => {
  it("adds Unreliable for Poor craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("Tearing", "Poor")).toBe("Tearing, Unreliable");
  });

  it("adds Reliable for Good craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("Tearing", "Good")).toBe("Tearing, Reliable");
  });

  it("leaves rules unchanged for Common craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("Tearing", "Common")).toBe("Tearing");
  });

  it("leaves rules unchanged for Best craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("Tearing", "Best")).toBe("Tearing");
  });

  it("handles empty rules for Poor craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("-", "Poor")).toBe("Unreliable");
  });

  it("handles empty rules for Good craftsmanship", () => {
    expect(rangedRulesForCraftsmanship("-", "Good")).toBe("Reliable");
  });
});

// ============================================================
// modifyDamageBonus
// ============================================================

describe("modifyDamageBonus", () => {
  it("increases the bonus by delta", () => {
    expect(modifyDamageBonus("1d10+3 I", 1)).toBe("1d10+4 I");
  });

  it("decreases the bonus by delta", () => {
    expect(modifyDamageBonus("1d10+3 I", -1)).toBe("1d10+2 I");
  });

  it("removes the bonus when it reaches zero", () => {
    expect(modifyDamageBonus("1d10+3 I", -3)).toBe("1d10 I");
  });

  it("adds a bonus to a damage string that has none", () => {
    expect(modifyDamageBonus("1d10", 2)).toBe("1d10+2");
  });

  it("handles negative delta turning a positive bonus negative", () => {
    expect(modifyDamageBonus("1d10+1 I", -2)).toBe("1d10-1 I");
  });

  it("handles a damage string that already has a negative bonus", () => {
    expect(modifyDamageBonus("1d10-1 I", -1)).toBe("1d10-2 I");
  });

  it("returns the original string unchanged when it does not match the expected format", () => {
    expect(modifyDamageBonus("invalid", 1)).toBe("invalid");
    expect(modifyDamageBonus("", 1)).toBe("");
  });

  it("preserves the damage type in the output", () => {
    expect(modifyDamageBonus("1d5+3 R", 1)).toBe("1d5+4 R");
    expect(modifyDamageBonus("2d10+5 E", -5)).toBe("2d10 E");
  });

  it("uppercases the damage type", () => {
    // Regex has the `i` flag, match[3] is uppercased explicitly
    expect(modifyDamageBonus("1d10+2 i", 1)).toBe("1d10+3 I");
  });

  it("handles dice-only notation without a bonus or type", () => {
    expect(modifyDamageBonus("2d10", 3)).toBe("2d10+3");
  });

  it("keeps the string clean when delta is zero", () => {
    expect(modifyDamageBonus("1d10+2 I", 0)).toBe("1d10+2 I");
  });
});

// ============================================================
// meleeDamageForCraftsmanship
// ============================================================

describe("meleeDamageForCraftsmanship", () => {
  it("adds +1 to damage bonus for Best craftsmanship", () => {
    expect(meleeDamageForCraftsmanship("1d10+2 R", "Best")).toBe("1d10+3 R");
  });

  it("leaves damage unchanged for Poor craftsmanship", () => {
    expect(meleeDamageForCraftsmanship("1d10+2 R", "Poor")).toBe("1d10+2 R");
  });

  it("leaves damage unchanged for Common craftsmanship", () => {
    expect(meleeDamageForCraftsmanship("1d10+2 R", "Common")).toBe("1d10+2 R");
  });

  it("leaves damage unchanged for Good craftsmanship", () => {
    expect(meleeDamageForCraftsmanship("1d10+2 R", "Good")).toBe("1d10+2 R");
  });
});

// ============================================================
// compareWeaponEntries
// ============================================================

describe("compareWeaponEntries", () => {
  const makeRegular = (name: string, equipped: boolean) =>
    ({ kind: "regular" as const, weapon: { equipped }, name });

  const makeCybernetic = (name: string) =>
    ({ kind: "cybernetic" as const, name });

  const makeArcheotech = (name: string, equipped: boolean) =>
    ({ kind: "archeotech" as const, item: { equipped }, name });

  it("sorts cybernetic before regular", () => {
    expect(compareWeaponEntries(makeCybernetic("Mechadendrite"), makeRegular("Bolter", true))).toBeLessThan(0);
  });

  it("sorts regular after cybernetic", () => {
    expect(compareWeaponEntries(makeRegular("Bolter", true), makeCybernetic("Mechadendrite"))).toBeGreaterThan(0);
  });

  it("sorts cybernetic before archeotech", () => {
    expect(compareWeaponEntries(makeCybernetic("Mechadendrite"), makeArcheotech("Archeotech Pistol", true))).toBeLessThan(0);
  });

  it("sorts two cybernetics alphabetically by name", () => {
    expect(compareWeaponEntries(makeCybernetic("Alpha"), makeCybernetic("Beta"))).toBeLessThan(0);
    expect(compareWeaponEntries(makeCybernetic("Beta"), makeCybernetic("Alpha"))).toBeGreaterThan(0);
  });

  it("sorts equipped regular before unequipped regular", () => {
    expect(compareWeaponEntries(makeRegular("Bolter", true), makeRegular("Bolter", false))).toBeLessThan(0);
  });

  it("sorts unequipped regular after equipped regular", () => {
    expect(compareWeaponEntries(makeRegular("Bolter", false), makeRegular("Bolter", true))).toBeGreaterThan(0);
  });

  it("sorts two equipped regulars alphabetically by name", () => {
    expect(compareWeaponEntries(makeRegular("Autogun", true), makeRegular("Bolter", true))).toBeLessThan(0);
    expect(compareWeaponEntries(makeRegular("Bolter", true), makeRegular("Autogun", true))).toBeGreaterThan(0);
  });

  it("sorts two unequipped regulars alphabetically by name", () => {
    expect(compareWeaponEntries(makeRegular("Autogun", false), makeRegular("Bolter", false))).toBeLessThan(0);
  });

  it("sorts equipped archeotech before unequipped archeotech", () => {
    expect(compareWeaponEntries(makeArcheotech("Arc Pistol", true), makeArcheotech("Arc Pistol", false))).toBeLessThan(0);
  });

  it("sorts equipped regular before unequipped archeotech (cross-kind equipped check)", () => {
    // regular equipped (aEq=0) vs archeotech unequipped (bEq=1) → regular comes first
    expect(compareWeaponEntries(makeRegular("Bolter", true), makeArcheotech("Arc Pistol", false))).toBeLessThan(0);
  });

  it("sorts unequipped regular after equipped archeotech (cross-kind equipped check)", () => {
    // regular unequipped (aEq=1) vs archeotech equipped (bEq=0) → archeotech comes first
    expect(compareWeaponEntries(makeRegular("Bolter", false), makeArcheotech("Arc Pistol", true))).toBeGreaterThan(0);
  });
});
