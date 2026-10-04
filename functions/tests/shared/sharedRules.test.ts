// functions/tests/shared/sharedRules.test.ts
// Calls real exports from the shared-rules package with real inputs, confirming that
// functions/ can import and use the package's rule logic and data.

import { describe, it, expect } from "vitest";
import {
  getCharacteristicTierCosts,
  getCharacteristicAdvancesSpent,
  getNextTalentOrTraitPurchase,
  getUnlockedTalentOrTraitSlots,
  matchesTalentOrTraitAdvance,
  isRecoveryCodeFormat,
  CHARACTERISTIC_ADVANCE_TIERS,
  CLAIM_LOG_ACTIONS,
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_PREFIX,
  RECOVERY_CODE_SEGMENT_LENGTH,
  RECOVERY_CODE_SEGMENTS,
  TALENT_LIST,
  WEAPON_TRAINING_GROUPS,
  type CharacterForCharacteristicCosts,
} from "shared-rules";
import { generateRecoveryCode } from "../../src/shared/recoveryCode.js";

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

describe("shared Talent and Trait slot rules", () => {
  it("lists every unlocked slot for a repeatable Talent, cheapest first", () => {
    const slots = getUnlockedTalentOrTraitSlots(
      "Guardsman",
      "Veteran",
      "sound-constitution",
      undefined
    );
    expect(slots.map((slot) => slot.cost)).toEqual([100, 100, 100, 100, 100, 100, 200, 200]);
  });

  it("prices the next purchase from the same slot list", () => {
    const owned = Array.from({ length: 6 }, () => ({ talentId: "sound-constitution" }));
    const slots = getUnlockedTalentOrTraitSlots(
      "Guardsman",
      "Veteran",
      "sound-constitution",
      undefined
    );
    expect(
      getNextTalentOrTraitPurchase("Guardsman", "Veteran", "sound-constitution", undefined, owned)
        ?.cost
    ).toBe(slots[owned.length].cost);
  });

  it("returns no slots for a Talent that is not on the career table", () => {
    expect(
      getUnlockedTalentOrTraitSlots("Guardsman", "Veteran", "psy-rating-1", undefined)
    ).toEqual([]);
  });

  it("matches a Talent id and specialisation without regard to case", () => {
    expect(
      matchesTalentOrTraitAdvance({ talentId: "hatred", specialisation: "Xeno" }, "hatred", "xeno")
    ).toBe(true);
  });

  it("matches a specialisation written with a trailing detail after a colon", () => {
    expect(
      matchesTalentOrTraitAdvance(
        { talentId: "hatred", specialisation: "Xeno" },
        "hatred",
        "Xeno: Orks"
      )
    ).toBe(true);
  });

  it("matches a Trait id and rejects a different id", () => {
    expect(
      matchesTalentOrTraitAdvance({ traitId: "unnatural-strength" }, "unnatural-strength")
    ).toBe(true);
    expect(matchesTalentOrTraitAdvance({ traitId: "unnatural-strength" }, "other")).toBe(false);
  });
});

describe("shared recovery code format", () => {
  it("accepts a well-formed code and rejects malformed values", () => {
    expect(isRecoveryCodeFormat("DH-ABCD-1234")).toBe(true);
    expect(isRecoveryCodeFormat("dh-abcd-1234")).toBe(false);
    expect(isRecoveryCodeFormat("XX-ABCD-1234")).toBe(false);
    expect(isRecoveryCodeFormat("DH-ABC-1234")).toBe(false);
    expect(isRecoveryCodeFormat("DH-ABCD-1234-5678")).toBe(false);
    expect(isRecoveryCodeFormat(" DH-ABCD-1234")).toBe(false);
    expect(isRecoveryCodeFormat(undefined)).toBe(false);
    expect(isRecoveryCodeFormat(1234)).toBe(false);
  });

  it("accepts every code the server generates", () => {
    for (let index = 0; index < 50; index += 1) {
      expect(isRecoveryCodeFormat(generateRecoveryCode())).toBe(true);
    }
  });

  it("describes a prefix, two segments of four characters, over uppercase letters and digits", () => {
    expect(RECOVERY_CODE_PREFIX).toBe("DH");
    expect(RECOVERY_CODE_SEGMENTS).toBe(2);
    expect(RECOVERY_CODE_SEGMENT_LENGTH).toBe(4);
    expect(RECOVERY_CODE_ALPHABET).toBe("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });
});

describe("shared claim log actions", () => {
  it("lists the four ownership actions", () => {
    expect([...CLAIM_LOG_ACTIONS]).toEqual(["claim", "release", "force-assign", "force-release"]);
  });
});
