import { describe, it, expect } from "vitest";
import { naturalArmourBonus } from "../../src/pages/CharacterSheet/ArmourTab/armourHelpers";
import type { TalentEntry } from "../../src/types/Character";

describe("naturalArmourBonus", () => {
  it("returns 0 when there's no Natural Armour trait", () => {
    expect(naturalArmourBonus([])).toBe(0);
  });

  it("returns the specialisation value when the trait is present", () => {
    const traits: TalentEntry[] = [
      { uid: "t1", talentId: "natural-armour", name: "Natural Armour (3)", specialisation: "3" },
    ];
    expect(naturalArmourBonus(traits)).toBe(3);
  });

  it("returns 0 when the specialisation isn't a valid number", () => {
    const traits: TalentEntry[] = [
      { uid: "t1", talentId: "natural-armour", name: "Natural Armour", specialisation: "" },
    ];
    expect(naturalArmourBonus(traits)).toBe(0);
  });

  it("ignores unrelated traits", () => {
    const traits: TalentEntry[] = [
      { uid: "t1", talentId: "armour-plating", name: "Armour Plating" },
    ];
    expect(naturalArmourBonus(traits)).toBe(0);
  });
});
