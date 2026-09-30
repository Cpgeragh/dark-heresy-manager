// functions/tests/shared/sharedRules.test.ts
// Calls real exports from the shared-rules package with real inputs, confirming that
// functions/ can import and use the package's rule logic and data.

import { describe, it, expect } from "vitest";
import {
  getCharacteristicTierCosts,
  getCharacteristicAdvancesSpent,
  CHARACTERISTIC_ADVANCE_TIERS,
  TALENT_LIST,
  WEAPON_TRAINING_GROUPS,
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

  it("exposes every weapon training group and a talent entry for each group label", () => {
    const items = WEAPON_TRAINING_GROUPS.flatMap((group) => group.items);
    expect(items).toHaveLength(32);
    for (const group of WEAPON_TRAINING_GROUPS) {
      expect(TALENT_LIST.some((talent) => talent.name === group.label)).toBe(true);
    }
  });
});
