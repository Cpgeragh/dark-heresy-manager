import { describe, expect, it } from "vitest";
import { makeCurrentRankPurchase } from "shared-rules";
import {
  buildEliteSkillTierRemoval,
  buildPackageRemoval,
  type PackageRemovalState,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceRemoval";
import type {
  EliteAdvancePurchase,
  SkillEntry,
  TalentsAndTraitsBlock,
} from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";

const PACKAGE_ID = "cult-of-the-red-redemption";
const purchase = (cost = 100): EliteAdvancePurchase => ({
  source: "elite-package",
  cost,
  sourceName: "The Cult of the Red Redemption",
  eliteAdvanceId: PACKAGE_ID,
});
const paid = (cost = 100) => makeCurrentRankPurchase("Cleric", "Novice", cost);

function skill(level: SkillEntry["level"], extra: Partial<SkillEntry> = {}): SkillEntry {
  return { ...getSkillDefinition("secret-tongue-redemption")!, level, ...extra };
}

const NO_PACKAGE: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };
const WITH_PACKAGE: TalentsAndTraitsBlock = {
  ...NO_PACKAGE,
  eliteAdvances: [
    {
      uid: "redemption",
      eliteAdvanceId: PACKAGE_ID,
      name: "The Cult of the Red Redemption",
      xpPurchase: paid(150),
    },
  ],
};

function state(overrides: Partial<PackageRemovalState> = {}): PackageRemovalState {
  return {
    talents: WITH_PACKAGE,
    skills: [],
    weaponTraining: { trained: [], exoticWeapons: [] },
    psychic: { psyRating: 0, minorPowers: [], majorPowers: [] },
    insanity: { points: 0, disorders: [] },
    cybernetics: [],
    rangedWeapons: [],
    meleeWeapons: [],
    archeotech: [],
    ...overrides,
  };
}

describe("removing one Elite skill tier", () => {
  it("lowers the skill by one tier and deletes only that purchase", () => {
    const result = buildEliteSkillTierRemoval({
      skills: [
        skill("+10", {
          xpPurchases: { trained: paid(), "+10": paid() },
          eliteAdvancePurchases: { "+10": purchase() },
        }),
      ],
      skillId: "secret-tongue-redemption",
      tier: "+10",
      talents: NO_PACKAGE,
      career: "Cleric",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.update.skills).toEqual([
      expect.objectContaining({
        level: "trained",
        xpPurchases: { trained: paid() },
        eliteAdvancePurchases: undefined,
      }),
    ]);
  });

  it("refuses while a higher tier exists and names every step", () => {
    const result = buildEliteSkillTierRemoval({
      skills: [
        skill("+20", {
          eliteAdvancePurchases: { "+10": purchase() },
          xpPurchases: { "+10": paid(), "+20": paid() },
        }),
      ],
      skillId: "secret-tongue-redemption",
      tier: "+10",
      talents: NO_PACKAGE,
      career: "Cleric",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warning.message).toContain("Step 1: On the Skills page");
    expect(result.warning.message).toContain("Downgrade to +10");
    expect(result.warning.message).toContain("Step 2: Remove the +10 card");
  });

  it("drops the skill when only unpaid granted training would be left", () => {
    const result = buildEliteSkillTierRemoval({
      skills: [
        skill("+10", {
          xpPurchases: { "+10": paid() },
          eliteAdvancePurchases: { "+10": purchase() },
        }),
      ],
      skillId: "secret-tongue-redemption",
      tier: "+10",
      talents: WITH_PACKAGE,
      career: "Cleric",
    });

    expect(result).toEqual({ ok: true, update: { skills: [] } });
  });
});

describe("removing a package", () => {
  it("removes everything bought through it and the skill level it granted", () => {
    const result = buildPackageRemoval(
      state({
        skills: [
          skill("+10", {
            xpPurchases: { "+10": paid() },
            eliteAdvancePurchases: { "+10": purchase() },
          }),
        ],
        talents: {
          ...WITH_PACKAGE,
          talents: [
            {
              uid: "hatred",
              talentId: "hatred",
              name: "Hatred (Heretics)",
              eliteAdvancePurchase: purchase(),
            },
            { uid: "other", talentId: "flagellant", name: "Flagellant" },
          ],
        },
        weaponTraining: {
          trained: ["basic-flame", "basic-las"],
          exoticWeapons: [],
          eliteAdvancePurchases: { "basic-flame": purchase(200) },
        },
        career: "Cleric",
      }),
      "redemption"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.update.talentsAndTraits?.eliteAdvances).toEqual([]);
    expect(result.update.talentsAndTraits?.talents.map((entry) => entry.uid)).toEqual(["other"]);
    expect(result.update.skills).toEqual([]);
    expect(result.update.weaponTraining?.trained).toEqual(["basic-las"]);
  });

  it("refuses while a tier bought another way sits above what the package gives", () => {
    const result = buildPackageRemoval(
      state({
        skills: [
          skill("+20", {
            xpPurchases: { "+10": paid(), "+20": paid() },
            eliteAdvancePurchases: { "+10": purchase() },
          }),
        ],
        career: "Cleric",
      }),
      "redemption"
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warning.title).toBe("Cannot Remove The Cult of the Red Redemption");
    expect(result.warning.message).toContain("Downgrade to +10");
    expect(result.warning.message).toContain("Remove the +10 card");
    expect(result.warning.message).toContain("Elite Packages page");
  });

  it("refuses while a package Talent is linked to psychic powers", () => {
    const result = buildPackageRemoval(
      state({
        talents: {
          ...WITH_PACKAGE,
          talents: [
            {
              uid: "linked",
              talentId: "hatred",
              name: "Hatred (Heretics)",
              eliteAdvancePurchase: purchase(),
            },
          ],
        },
        psychic: {
          psyRating: 1,
          minorPowers: [
            { id: "power", name: "Power", known: true, psyRatingTalentEntryUid: "linked" },
          ],
          majorPowers: [],
        },
      }),
      "redemption"
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warning.message).toContain("Remove the linked powers on the Psychic page");
  });

  it("clears the package's own psychic grant and insanity", () => {
    const result = buildPackageRemoval(
      state({
        talents: {
          ...WITH_PACKAGE,
          eliteAdvances: [
            {
              uid: "redemption",
              eliteAdvanceId: PACKAGE_ID,
              name: "The Cult of the Red Redemption",
              acquisition: { insanityGained: 3 },
            },
          ],
        },
        insanity: { points: 5, disorders: [] },
        psychic: {
          psyRating: 0,
          minorPowers: [
            {
              id: "granted",
              name: "Granted",
              known: true,
              talentEntryUid: "elite-advance:redemption:minor-psychic-power:0",
            },
            { id: "kept", name: "Kept", known: true },
          ],
          majorPowers: [],
        },
      }),
      "redemption"
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.update.insanity?.points).toBe(2);
    expect(result.update.psychic?.minorPowers.map((power) => power.id)).toEqual(["kept"]);
  });
});
