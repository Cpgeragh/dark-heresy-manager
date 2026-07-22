import { describe, expect, it } from "vitest";
import type { CharacteristicModifier } from "../../src/features/corruption/characteristicModifiers";
import {
  areRollModifierValuesValid,
  getRoll1d10Modifiers,
} from "../../src/features/corruption/rollModifierValues";

const MODIFIERS: CharacteristicModifier[] = [
  { characteristic: "s", kind: "flat", sign: 1, value: 10 },
  { characteristic: "int", kind: "roll1d10", sign: -1 },
  { characteristic: "fel", kind: "roll1d10", sign: -1 },
];

describe("roll modifier values", () => {
  it("keeps only 1d10 modifiers", () => {
    expect(getRoll1d10Modifiers(MODIFIERS).map((modifier) => modifier.characteristic)).toEqual([
      "int",
      "fel",
    ]);
  });

  it("accepts both inclusive limits", () => {
    expect(
      areRollModifierValuesValid(getRoll1d10Modifiers(MODIFIERS), { int: "1", fel: "10" })
    ).toBe(true);
  });

  it.each([
    [{ int: "", fel: "5" }],
    [{ int: "0", fel: "5" }],
    [{ int: "11", fel: "5" }],
    [{ int: "1.5", fel: "5" }],
  ])("rejects missing, out-of-range or fractional rolls", (rolls) => {
    expect(areRollModifierValuesValid(getRoll1d10Modifiers(MODIFIERS), rolls)).toBe(false);
  });
});
