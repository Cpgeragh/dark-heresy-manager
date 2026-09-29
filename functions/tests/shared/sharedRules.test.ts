// functions/tests/shared/sharedRules.test.ts
// Proves the shared-rules package is genuinely wired into functions/, not just that
// `npm install` succeeded. This is Stage 1 of the server-side rule validation plan:
// the package itself, no real patchCharacterField validation built on it yet.

import { describe, it, expect } from "vitest";
import {
  getCharacteristicTierCosts,
  getCharacteristicAdvancesSpent,
  CHARACTERISTIC_ADVANCE_TIERS,
  type CharacterForCharacteristicCosts,
} from "shared-rules";

describe("shared-rules wiring", () => {
  it("returns four undefined tier costs when no career is set", () => {
    expect(getCharacteristicTierCosts(undefined, "ws")).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("computes zero XP spent when no characteristic advances have been bought", () => {
    const character: CharacterForCharacteristicCosts = {
      header: { career: undefined },
      characteristics: {
        ws: { base: 30, advances: 0 },
        bs: { base: 30, advances: 0 },
        s: { base: 30, advances: 0 },
        t: { base: 30, advances: 0 },
        ag: { base: 30, advances: 0 },
        int: { base: 30, advances: 0 },
        per: { base: 30, advances: 0 },
        wp: { base: 30, advances: 0 },
        fel: { base: 30, advances: 0 },
      },
    };

    expect(getCharacteristicAdvancesSpent(character)).toBe(0);
  });

  it("charges the manually recorded cost for a purchased advance even with no career table", () => {
    const character: CharacterForCharacteristicCosts = {
      header: { career: undefined },
      characteristics: {
        ws: {
          base: 30,
          advances: 1,
          advancePurchases: { simple: { cost: 100 } },
        },
        bs: { base: 30, advances: 0 },
        s: { base: 30, advances: 0 },
        t: { base: 30, advances: 0 },
        ag: { base: 30, advances: 0 },
        int: { base: 30, advances: 0 },
        per: { base: 30, advances: 0 },
        wp: { base: 30, advances: 0 },
        fel: { base: 30, advances: 0 },
      },
    };

    expect(getCharacteristicAdvancesSpent(character)).toBe(100);
  });

  it("exposes the four characteristic advance tiers in order", () => {
    expect(CHARACTERISTIC_ADVANCE_TIERS).toEqual(["simple", "intermediate", "trained", "expert"]);
  });
});
