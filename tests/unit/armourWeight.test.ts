import { describe, expect, it } from "vitest";
import { effectiveArmourWeight } from "../../src/pages/CharacterSheet/ArmourTab/armourHelpers";
import type { WornArmourPiece } from "../../src/types/Character";

type UpgradeRefs = Parameters<typeof effectiveArmourWeight>[1];

function piece(weight?: string): WornArmourPiece {
  return { id: "p1", name: "Piece", locations: ["body"], ap: 3, worn: true, weight };
}

function upgrades(...weights: string[]): UpgradeRefs {
  return weights.map((weight, index) => ({ id: `u${index}`, weight })) as unknown as UpgradeRefs;
}

describe("effectiveArmourWeight", () => {
  it("adds a fitted upgrade's weight to the base weight", () => {
    expect(effectiveArmourWeight(piece("10 kg"), upgrades("+2 kg"))).toBe("12 kg");
  });

  it("reads a base weight with a footnote dagger as its number", () => {
    expect(effectiveArmourWeight(piece("6 kg†"), upgrades())).toBe("6 kg");
  });

  it("reads a dash base weight as 0 kg, so an upgrade's weight is all it has", () => {
    expect(effectiveArmourWeight(piece("—"), upgrades("+2 kg"))).toBe("2 kg");
  });

  it("returns nothing when the base weight is Varies, even with upgrades", () => {
    expect(effectiveArmourWeight(piece("Varies"), upgrades("+2 kg"))).toBe("");
  });
});
