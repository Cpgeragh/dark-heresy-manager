import { describe, it, expect } from "vitest";
import {
  nextCraftsmanship,
  hasQualityText,
  availableCraftsmanship,
  defaultCraftsmanship,
  nextAvailableCraftsmanship,
  craftsmanshipDescription,
  concealedWeaponBionicDescription,
  craftsmanshipValue,
  craftsmanshipAvailability,
} from "../../src/pages/characterSheet/CyberneticsTab/cyberneticsHelpers";
import { CYBERNETICS_REFERENCE } from "../../src/data/reference/cyberneticsReference";

// Real reference entries (src/data/reference/cyberneticsReference.ts), not fabricated:
// - has real poor/common/good tiers.
const CONCEALED_WEAPON_BIONIC = CYBERNETICS_REFERENCE.find(
  (r) => r.id === "ih-concealed-weapon-bionic"
)!;
// - notes contain the literal "All mechadendrites are Good craftsmanship unless noted"
//   special-case string, forcing a single-tier "Good" result regardless of its own
//   poor/common/good fields.
const BALLISTIC_MECHADENDRITE = CYBERNETICS_REFERENCE.find(
  (r) => r.id === "cr-ballistic-mechadendrite"
)!;

describe("nextCraftsmanship", () => {
  it("cycles Poor -> Common -> Good -> Poor regardless of any reference", () => {
    expect(nextCraftsmanship("Poor")).toBe("Common");
    expect(nextCraftsmanship("Common")).toBe("Good");
    expect(nextCraftsmanship("Good")).toBe("Poor");
  });
});

describe("hasQualityText", () => {
  it("is false with no reference", () => {
    expect(hasQualityText(undefined)).toBe(false);
  });

  it("is true when any of poor/common/good is set", () => {
    expect(hasQualityText(CONCEALED_WEAPON_BIONIC)).toBe(true);
  });
});

describe("availableCraftsmanship", () => {
  it("defaults to Common only when there is no reference", () => {
    expect(availableCraftsmanship(undefined)).toEqual(["Common"]);
  });

  it("returns all three tiers for a reference with poor, common, and good text", () => {
    expect(availableCraftsmanship(CONCEALED_WEAPON_BIONIC)).toEqual(["Poor", "Common", "Good"]);
  });

  it("forces a single Good tier for the mechadendrite special-case notes", () => {
    expect(availableCraftsmanship(BALLISTIC_MECHADENDRITE)).toEqual(["Good"]);
  });
});

describe("defaultCraftsmanship", () => {
  it("is Common when Common is available", () => {
    expect(defaultCraftsmanship(CONCEALED_WEAPON_BIONIC)).toBe("Common");
  });

  it("falls back to the only available tier when Common isn't one of them", () => {
    expect(defaultCraftsmanship(BALLISTIC_MECHADENDRITE)).toBe("Good");
  });
});

describe("nextAvailableCraftsmanship", () => {
  it("cycles only through the reference's own available tiers", () => {
    expect(nextAvailableCraftsmanship("Poor", CONCEALED_WEAPON_BIONIC)).toBe("Common");
    expect(nextAvailableCraftsmanship("Common", CONCEALED_WEAPON_BIONIC)).toBe("Good");
    expect(nextAvailableCraftsmanship("Good", CONCEALED_WEAPON_BIONIC)).toBe("Poor");
  });

  it("stays on the single available tier for a mechadendrite", () => {
    expect(nextAvailableCraftsmanship("Good", BALLISTIC_MECHADENDRITE)).toBe("Good");
  });
});

describe("craftsmanshipDescription", () => {
  it("returns the matching tier's real rules text", () => {
    expect(craftsmanshipDescription(CONCEALED_WEAPON_BIONIC, "Poor")).toBe(
      CONCEALED_WEAPON_BIONIC.poor
    );
    expect(craftsmanshipDescription(CONCEALED_WEAPON_BIONIC, "Good")).toBe(
      CONCEALED_WEAPON_BIONIC.good
    );
  });
});

describe("concealedWeaponBionicDescription", () => {
  it("adds the Unreliable penalty for Poor quality", () => {
    expect(concealedWeaponBionicDescription("Poor")).toMatch(/Unreliable/);
  });

  it("gives the plain baseline description for Common quality", () => {
    const description = concealedWeaponBionicDescription("Common");
    expect(description).toMatch(/cannot be removed with a Disarm/);
    expect(description).not.toMatch(/jams or overheats/);
  });

  it("adds the ranged-specific bonus for Good quality on a ranged weapon", () => {
    expect(concealedWeaponBionicDescription("Good", "ranged")).toMatch(/never jams or overheats/);
  });

  it("adds the melee-specific bonus for Good quality on a melee weapon", () => {
    expect(concealedWeaponBionicDescription("Good", "melee")).toMatch(/\+10 to attack Tests/);
  });

  it("lists both bonuses for Good quality with no specific weapon type yet chosen", () => {
    const description = concealedWeaponBionicDescription("Good");
    expect(description).toMatch(/never jams or overheats/);
    expect(description).toMatch(/\+10 to attack Tests/);
  });
});

describe("craftsmanshipValue", () => {
  it("uses the tier-specific value when set", () => {
    expect(craftsmanshipValue(CONCEALED_WEAPON_BIONIC, "Poor")).toBe(
      CONCEALED_WEAPON_BIONIC.poorValue
    );
    expect(craftsmanshipValue(CONCEALED_WEAPON_BIONIC, "Good")).toBe(
      CONCEALED_WEAPON_BIONIC.goodValue
    );
  });

  it("falls back to the base value for Common", () => {
    expect(craftsmanshipValue(CONCEALED_WEAPON_BIONIC, "Common")).toBe(
      CONCEALED_WEAPON_BIONIC.value
    );
  });
});

describe("craftsmanshipAvailability", () => {
  it("falls back to the base availability when no tier-specific override exists", () => {
    expect(craftsmanshipAvailability(CONCEALED_WEAPON_BIONIC, "Poor")).toBe(
      CONCEALED_WEAPON_BIONIC.availability
    );
  });

  it("uses the tier-specific availability when set", () => {
    expect(craftsmanshipAvailability(CONCEALED_WEAPON_BIONIC, "Good")).toBe(
      CONCEALED_WEAPON_BIONIC.goodAvailability
    );
  });
});
