// src/tests/unit/calculateCharacteristicTotal.test.ts

import { describe, it, expect } from "vitest";
import { calculateCharacteristicTotal } from "../../src/utils/stats";

describe("calculateCharacteristicTotal", () => {
  it("works for normal values", () => {
    expect(calculateCharacteristicTotal(30, 2)).toBe(40);
  });

  it("advances multiply correctly", () => {
    expect(calculateCharacteristicTotal(25, 4)).toBe(45);
  });

  it("handles zero values", () => {
    expect(calculateCharacteristicTotal(0, 0)).toBe(0);
  });
});