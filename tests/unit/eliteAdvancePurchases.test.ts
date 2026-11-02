import { describe, expect, it } from "vitest";
import {
  getEliteSkillPurchases,
  getEliteTalentPurchases,
  getEliteTrainingPurchases,
} from "../../src/mechanics/eliteAdvances/eliteAdvancePurchases";
import type { EliteAdvancePurchase, SkillEntry, TalentEntry } from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";

function skill(
  id: string,
  level: SkillEntry["level"],
  extra: Partial<SkillEntry> = {}
): SkillEntry {
  return { ...getSkillDefinition(id)!, level, ...extra };
}

const purchase: EliteAdvancePurchase = {
  source: "elite-package",
  cost: 100,
  sourceName: "The Cult of the Red Redemption",
  eliteAdvanceId: "cult-of-the-red-redemption",
};

describe("Elite Advance purchase lists", () => {
  it("lists one entry for every owned Elite skill tier and ignores stale records", () => {
    const result = getEliteSkillPurchases([
      skill("secret-tongue-redemption", "+10", {
        eliteAdvancePurchases: { "+10": purchase, "+20": purchase },
      }),
      skill("acrobatics", "trained"),
    ]);

    expect(result).toEqual([
      expect.objectContaining({ skillId: "secret-tongue-redemption", tier: "+10" }),
    ]);
  });

  it("sorts skill tiers by name and then by tier", () => {
    const result = getEliteSkillPurchases([
      skill("secret-tongue-redemption", "+20", {
        eliteAdvancePurchases: { "+20": purchase, trained: purchase },
      }),
      skill("acrobatics", "trained", { eliteAdvancePurchases: { trained: purchase } }),
    ]);

    expect(result.map((item) => `${item.skillId}:${item.tier}`)).toEqual([
      "acrobatics:trained",
      "secret-tongue-redemption:trained",
      "secret-tongue-redemption:+20",
    ]);
  });

  it("lists only Talents that an Elite Advance bought, in name order", () => {
    const entries: TalentEntry[] = [
      { uid: "b", talentId: "hatred", name: "Hatred", eliteAdvancePurchase: purchase },
      { uid: "a", talentId: "flagellant", name: "Flagellant" },
      { uid: "c", talentId: "battle-rage", name: "Battle Rage", eliteAdvancePurchase: purchase },
    ];

    expect(getEliteTalentPurchases(entries).map((entry) => entry.uid)).toEqual(["c", "b"]);
  });

  it("lists weapon training groups that an Elite Advance bought, with their names", () => {
    const result = getEliteTrainingPurchases({
      trained: ["basic-flame", "basic-las"],
      exoticWeapons: [],
      eliteAdvancePurchases: { "basic-flame": purchase },
    });

    expect(result).toEqual([
      expect.objectContaining({ id: "basic-flame", name: "Basic Weapon Training (Flame)" }),
    ]);
  });
});
