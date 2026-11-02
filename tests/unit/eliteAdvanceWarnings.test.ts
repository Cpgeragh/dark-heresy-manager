import { describe, expect, it } from "vitest";
import {
  getSkillEliteLockWarning,
  getSkillLoweringSteps,
  getTalentEliteLockWarning,
  getTrainingEliteLockWarning,
} from "../../src/mechanics/eliteAdvances/eliteAdvanceWarnings";
import type { EliteAdvancePurchase, SkillEntry } from "../../src/types/Character";
import { getSkillDefinition } from "../../src/utils/skillUtils";

function skill(level: SkillEntry["level"], extra: Partial<SkillEntry> = {}): SkillEntry {
  return { ...getSkillDefinition("secret-tongue-redemption")!, level, ...extra };
}

const purchase: EliteAdvancePurchase = {
  source: "elite-package",
  cost: 100,
  sourceName: "The Cult of the Red Redemption",
  eliteAdvanceId: "cult-of-the-red-redemption",
};

describe("Elite Advance warnings", () => {
  it("names each step from the top tier down, with the page to use", () => {
    const steps = getSkillLoweringSteps(
      skill("+20", { eliteAdvancePurchases: { "+20": purchase } }),
      "untrained"
    );

    expect(steps).toHaveLength(3);
    expect(steps[0]).toContain("Remove the +20 card");
    expect(steps[0]).toContain("Elite Skills page");
    expect(steps[1]).toContain("choose Downgrade to Trained");
    expect(steps[1]).toContain("Skills page");
    expect(steps[2]).toContain("Remove Secret Tongue (the Redemption) on the Skills page");
  });

  it("refuses to downgrade an Elite-bought top tier and says where to undo it", () => {
    const warning = getSkillEliteLockWarning(
      skill("+10", { eliteAdvancePurchases: { "+10": purchase } }),
      "downgrade"
    );

    expect(warning?.message).toContain("through The Cult of the Red Redemption");
    expect(warning?.message).toContain("Step 1: Remove the +10 card");
  });

  it("does not block a downgrade when a career bought the top tier", () => {
    expect(
      getSkillEliteLockWarning(
        skill("+20", { eliteAdvancePurchases: { "+10": purchase } }),
        "downgrade"
      )
    ).toBeUndefined();
  });

  it("blocks removing a whole skill when any tier was Elite-bought and lists every step", () => {
    const warning = getSkillEliteLockWarning(
      skill("+20", { eliteAdvancePurchases: { "+10": purchase } }),
      "remove"
    );

    expect(warning?.message).toContain("includes +10 bought through Elite Advances");
    expect(warning?.message).toContain("Step 1: On the Skills page");
    expect(warning?.message).toContain("Downgrade to +10");
    expect(warning?.message).toContain("Step 2: Remove the +10 card");
    expect(warning?.message).toContain(
      "Step 3: Remove Secret Tongue (the Redemption) on the Skills page"
    );
  });

  it("does not block removing a skill with no Elite-bought tier", () => {
    expect(getSkillEliteLockWarning(skill("+10"), "remove")).toBeUndefined();
  });

  it("points a Talent and a weapon training group at the Elite Talents page", () => {
    expect(
      getTalentEliteLockWarning({
        uid: "a",
        talentId: "hatred",
        name: "Hatred (Heretics)",
        eliteAdvancePurchase: purchase,
      })?.message
    ).toContain("Elite Talents page");
    expect(
      getTrainingEliteLockWarning("Basic Weapon Training (Flame)", purchase)?.message
    ).toContain("Remove the Basic Weapon Training (Flame) card");
    expect(getTrainingEliteLockWarning("Basic Weapon Training (Flame)", undefined)).toBeUndefined();
    expect(
      getTalentEliteLockWarning({ uid: "a", talentId: "hatred", name: "Hatred" })
    ).toBeUndefined();
  });
});
