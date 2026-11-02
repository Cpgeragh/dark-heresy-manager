import { describe, expect, it } from "vitest";
import { removeWeaponTrainingGroup } from "../../src/utils/weaponTrainingRemoval";

describe("removeWeaponTrainingGroup", () => {
  it("removes the group and its records and keeps the rest", () => {
    const result = removeWeaponTrainingGroup(
      {
        trained: ["basic-flame", "basic-las"],
        exoticWeapons: [],
        manualCosts: { "basic-flame": 200 },
        eliteAdvancePurchases: {
          "basic-flame": { source: "gm-approved", cost: 200, sourceName: "GM-approved Talent" },
        },
      },
      "basic-flame"
    );

    expect(result).toEqual({
      trained: ["basic-las"],
      exoticWeapons: [],
      xpPurchases: undefined,
      manualCosts: undefined,
      eliteAdvancePurchases: undefined,
    });
  });
});
