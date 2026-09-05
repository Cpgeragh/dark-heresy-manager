import { describe, expect, it } from "vitest";
import {
  PSYCHIC_DISCIPLINE_RULES,
  PSYCHIC_POWER_REFERENCE,
  getPsychicPowerDescription,
} from "../../src/data/reference/psychicReference";

const power = (id: string) => {
  const match = PSYCHIC_POWER_REFERENCE.find((entry) => entry.id === id);
  expect(match, `Missing psychic power: ${id}`).toBeDefined();
  return match!;
};

describe("psychic power reference data", () => {
  it("keeps the complete audited catalogue with unique IDs", () => {
    expect(PSYCHIC_POWER_REFERENCE).toHaveLength(95);
    expect(new Set(PSYCHIC_POWER_REFERENCE.map((entry) => entry.id)).size).toBe(95);
  });

  it("records Incinerate's complete rules without a placeholder or invented Overbleed", () => {
    const incinerate = power("incinerate");

    expect(incinerate.range).toBe("10m");
    expect(incinerate.description).toContain("1d10+1 Energy Damage");
    expect(incinerate.description).toContain("previous Round's Damage plus 1");
    expect(incinerate.description).toContain("within Range and line of sight");
    expect(incinerate.description).toContain("ignores both Armour and Toughness");
    expect(incinerate.description).not.toContain("Consult the Core Rulebook");
    expect(incinerate.description).not.toContain("Overbleed");
  });

  it("keeps Far Sight's one-kilometre-per-Willpower-Bonus range and full limitations", () => {
    const farSight = power("far-sight");

    expect(farSight.range).toBe("1km × Willpower Bonus");
    for (const detail of [
      "buildings, bodies of water, pockets of gas",
      "without manifesting the power again",
      "darkness still obscures your view normally",
      "Lip Reading",
      "no more than a Half Action",
      "-30 penalty",
      "double the Range",
    ]) {
      expect(farSight.description).toContain(detail);
    }
  });

  it("records Psychometry's fixed Overbleed timing breakpoints", () => {
    const description = power("psychometry").description;

    expect(description).toContain("by 10 points reduces the time to derive a new fact to 5 Rounds");
    expect(description).toContain("by 20 points, to 2 Rounds");
    expect(description).toContain("by 30 points, to every Round");
    expect(description).not.toContain("cut the time required by half");
  });

  it.each([
    ["soul-sight", "each time you wish to view an additional person's aura"],
    ["blinding-flash", "accidentally blind yourself"],
    ["beastmaster", "select one animal within Range"],
    ["mind-scan", "fully aware that their psyche is under attack"],
  ])("records the restored rule for %s", (id, detail) => {
    expect(power(id).description).toContain(detail);
  });

  it("stores discipline-wide rules once and includes them when powers are viewed or added", () => {
    expect(PSYCHIC_DISCIPLINE_RULES.Pyromancy).toContain("may also set the target on fire");
    expect(PSYCHIC_DISCIPLINE_RULES.Telepathy).toContain("psychic rot");
    expect(PSYCHIC_DISCIPLINE_RULES.Telepathy).toContain(
      "1d10 Insanity Points or Corruption Points"
    );
    expect(PSYCHIC_DISCIPLINE_RULES.Telepathy).toContain("second Willpower Test");

    expect(getPsychicPowerDescription(power("blinding-flash"))).toContain(
      "Discipline rule: Any Pyromancy power that inflicts Damage"
    );
    expect(getPsychicPowerDescription(power("mind-scan"))).toContain(
      "Discipline rule: If a Psyker uses a telepathic power"
    );
    expect(getPsychicPowerDescription(power("far-sight"))).toBe(power("far-sight").description);
  });

  it("does not duplicate the shared Pyromancy rule inside individual source descriptions", () => {
    for (const entry of PSYCHIC_POWER_REFERENCE.filter(
      (candidate) => candidate.discipline === "Pyromancy"
    )) {
      expect(entry.description).not.toContain("Any Pyromancy power that inflicts Damage");
    }
  });
});
