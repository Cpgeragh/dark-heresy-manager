import { describe, expect, it } from "vitest";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { SKILL_DESCRIPTIONS } from "../../src/data/reference/skillDescriptions";

const descriptionFor = (name: string): string => {
  const description = SKILL_DESCRIPTIONS[name];
  expect(description, `Missing description for ${name}`).toBeDefined();
  return description;
};

describe("skill reference data", () => {
  it("has one matching description for every default skill", () => {
    const names = DEFAULT_SKILLS.map((skill) => skill.name);
    const descriptionNames = Object.keys(SKILL_DESCRIPTIONS);

    expect(DEFAULT_SKILLS).toHaveLength(124);
    expect(new Set(names).size).toBe(124);
    expect(descriptionNames).toHaveLength(124);
    expect(new Set(descriptionNames).size).toBe(124);
    expect(descriptionNames.sort()).toEqual([...names].sort());
  });

  it("contains 122 Core Rules skills and two Lathe Worlds skills", () => {
    expect(DEFAULT_SKILLS.filter((skill) => skill.source === "CR")).toHaveLength(122);
    expect(DEFAULT_SKILLS.filter((skill) => skill.source === "LW")).toHaveLength(2);
  });

  it("uses Fellowship for Performer (Dancer)", () => {
    expect(DEFAULT_SKILLS.find((skill) => skill.id === "performer-dancer")?.characteristic).toBe(
      "fel"
    );
  });

  it("includes the complete Diplomacy resolution procedure", () => {
    const description = descriptionFor("Diplomacy");
    expect(description).toContain("Opposed Fellowship Test");
    expect(description).toContain("each Round");
    expect(description).toContain("degree of success");
    expect(description).toContain("every party fails");
  });

  it("includes the essential Logis Prophesying mechanics", () => {
    const description = descriptionFor("Logis Prophesying");
    expect(description).toContain("GM sets the Test Difficulty");
    expect(description).toContain("more relevant information makes the Test easier");
    expect(description).toContain("each additional degree of success");
    expect(description).toContain("not certainties");
  });

  it("includes opposed chase Tests for every Drive group", () => {
    for (const skill of DEFAULT_SKILLS.filter((entry) => entry.category === "Drive")) {
      expect(descriptionFor(skill.name)).toContain(
        "Opposed Drive Tests are made between pursuers and pursued during a chase"
      );
    }
  });

  it("includes the restored Medicae rules", () => {
    const description = descriptionFor("Medicae");
    expect(description).toContain("Full Action for both healer and patient");
    expect(description).toContain("Ordinary failure causes no additional harm");
    expect(description).toContain("each Wound only once");
    expect(description).toContain("each additional patient imposes a cumulative -10");
    expect(description).toContain("patients heal at their natural rates");
    expect(description).toContain("Failure by 3+ degrees");
    expect(description).toContain("failure by 5+ degrees");
    expect(description).toContain("1d10 Damage to every patient");
  });

  it("includes Performer's income rule for every group member", () => {
    for (const skill of DEFAULT_SKILLS.filter((entry) => entry.category === "Performer")) {
      expect(descriptionFor(skill.name)).toContain("earn an income much as with Trade");
    }
  });

  it("retains the source warning for every Forbidden Lore group member", () => {
    for (const skill of DEFAULT_SKILLS.filter((entry) => entry.category === "Forbidden Lore")) {
      expect(descriptionFor(skill.name)).toContain(
        "often sufficient to warrant termination at the hands of the Inquisition"
      );
    }
  });

  it("represents each Forbidden Lore (Ordos) choice separately", () => {
    expect(
      DEFAULT_SKILLS.filter((skill) => skill.id.startsWith("forbidden-ordos-")).map(
        (skill) => skill.name
      )
    ).toEqual([
      "Forbidden Lore (Ordos: Malleus)",
      "Forbidden Lore (Ordos: Hereticus)",
      "Forbidden Lore (Ordos: Xenos)",
    ]);
    expect(DEFAULT_SKILLS.some((skill) => skill.id === "forbidden-ordos")).toBe(false);
  });

  it("includes Blather's full duration and target restrictions", () => {
    const description = descriptionFor("Blather");
    expect(description).toContain("one Round, plus one additional Round per degree of success");
    expect(description).toContain("Targets in obvious danger");
    expect(description).toContain("if the target wins or both fail, they act normally");
  });

  it("includes Chem-Use identification and manufacturing", () => {
    const description = descriptionFor("Chem-Use");
    expect(description).toContain("identify");
    expect(description).toContain("manufacture toxins using the Crafting rules");
  });

  it("includes Command's authority and failure rules", () => {
    const description = descriptionFor("Command");
    expect(description).toContain("under your authority");
    expect(description).toContain("ordinary failure means they misinterpret it or do nothing");
  });

  it("includes Concealment's automatic-failure condition", () => {
    expect(descriptionFor("Concealment")).toContain("the Test automatically fails");
  });

  it("includes Contortionist's exact escape and timing rules", () => {
    const description = descriptionFor("Contortionist");
    expect(description).toContain("Hard (-20) when the captor's Intelligence exceeds your Agility");
    expect(description).toContain("reduced by ten seconds per degree of success");
  });

  it("includes the restored Demolition mechanics", () => {
    const description = descriptionFor("Demolition");
    expect(description).toContain("ordinary failure means the explosive will not activate");
    expect(description).toContain("grants +2 Damage per step or minute");
    expect(description).toContain("ordinary failure can normally be retried next Round");
    expect(description).toContain("manufacturing takes at least one minute");
  });

  it("includes Gamble's failure and deliberate-loss rules", () => {
    const description = descriptionFor("Gamble");
    expect(description).toContain("fewest degrees of failure if everyone fails");
    expect(description).toContain("deliberately throw the game");
  });

  it("distinguishes Interrogation's serious and five-degree failures", () => {
    const description = descriptionFor("Interrogation");
    expect(description).toContain("A serious failure deals 1d10 plus Willpower Bonus Damage");
    expect(description).toContain("Failing by 5+ degrees");
    expect(description).toContain("+30 to resist further interrogation");
  });

  it("includes Navigation's travel-time and unusual-condition rules", () => {
    for (const skill of DEFAULT_SKILLS.filter((entry) => entry.category === "Navigation")) {
      const description = descriptionFor(skill.name);
      expect(description).toContain("estimate travel times");
      expect(description).toContain("unusual conditions may require additional Tests");
      expect(description).toContain("normally takes several hours");
    }
  });

  it("includes the remaining Survival, Swim, Tech-Use and Wrangling rules", () => {
    expect(descriptionFor("Survival")).toContain("reduce the time to one minute");
    expect(descriptionFor("Swim")).toContain("need for protective clothing");
    expect(descriptionFor("Tech-Use")).toContain("build an item from scratch");
    expect(descriptionFor("Wrangling")).toContain("especially loyal or ornery animals");
  });
});
