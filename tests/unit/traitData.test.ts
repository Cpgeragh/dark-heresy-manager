import { describe, expect, it } from "vitest";
import { TRAIT_LIST } from "../../src/data/reference/traitData";
import { TRAIT_DESCRIPTIONS } from "../../src/data/reference/traitDescriptions";

function find(id: string) {
  return TRAIT_LIST.find((trait) => trait.id === id)!;
}

describe("Trait catalogue", () => {
  it("requires the numeric values the source leaves to each creature entry", () => {
    for (const id of ["burrower", "flyer", "hoverer", "unnatural-senses"]) {
      expect(find(id)).toEqual(
        expect.objectContaining({
          hasSpecialisation: true,
          positiveIntegerInput: true,
          specialisationMin: 1,
        })
      );
    }
  });

  it("uses the source's fixed Fear, Machine and Size limits", () => {
    expect(find("fear").specialisationOptions).toHaveLength(4);
    expect(find("machine")).toEqual(
      expect.objectContaining({
        specialisationMin: 1,
        specialisationMax: 5,
      })
    );
    expect(find("size").specialisationOptions).toEqual([
      "Minuscule",
      "Puny",
      "Scrawny",
      "Average",
      "Hulking",
      "Enormous",
      "Massive",
    ]);
  });

  it("marks Traits with required acquisition decisions explicitly", () => {
    expect(find("soul-bound").acquisition).toBe("soul-bound");
    expect(find("blank-slate").acquisition).toBe("blank-slate");
    expect(find("sanctioned-psyker").acquisition).toBe("sanctioned-psyker");
    expect(find("skin-of-iron").acquisition).toBe("skin-of-iron");
    expect(find("skin-of-iron")).toEqual(
      expect.objectContaining({ repeatable: true, maxPurchases: 4 })
    );
  });

  it("retains the audited missing rule details", () => {
    expect(TRAIT_DESCRIPTIONS.possession).toContain("memories and skills");
    expect(TRAIT_DESCRIPTIONS["stuff-of-nightmares"]).toContain("destroy the creature outright");
    expect(TRAIT_DESCRIPTIONS["unnatural-characteristic"]).toContain("degrees of success");
    expect(TRAIT_DESCRIPTIONS["mechanicus-implants"]).toContain("properly trained");
  });
});
