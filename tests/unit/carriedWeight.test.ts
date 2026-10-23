import { describe, expect, it } from "vitest";
import { calcCarriedWeightKg } from "../../src/mechanics/carriedWeight";
import { resolveAmmoEntryTracking } from "../../src/pages/CharacterSheet/weapons/weaponHelpers";

const NOTHING = { rangedWeapons: [], meleeWeapons: [], armour: [] };

describe("calcCarriedWeightKg", () => {
  it("is 0 for a character who owns nothing", () => {
    expect(calcCarriedWeightKg(NOTHING)).toBe(0);
  });

  it("adds gear, shields, and armour at their weights, worn or stowed", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        gear: [{ id: "g1", name: "Rope", weight: "2 kg" }],
        shields: [{ id: "s1", name: "Buckler", ap: 1, weight: "3 kg" }],
        armour: [
          { id: "a1", name: "Flak", locations: ["body"], ap: 3, worn: false, weight: "5 kg" },
        ],
      })
    ).toBe(10);
  });

  it("counts an unusable weight as 0", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        gear: [
          { id: "g1", name: "Unknown", weight: "Varies" },
          { id: "g2", name: "Dash", weight: "—" },
          { id: "g3", name: "Blank" },
          { id: "g4", name: "Real", weight: "1 kg" },
        ],
      })
    ).toBe(1);
  });

  it("multiplies consumables, drugs, and grenades by their quantity", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        consumables: [{ id: "c1", name: "Ration", quantity: 3, weight: "2 kg" }],
        drugs: [{ id: "d1", name: "Stimm", quantity: 4, weight: "0.5 kg" }],
        grenades: [{ id: "n1", name: "Frag", quantity: 5, weight: "1 kg" }],
      })
    ).toBe(13);
  });

  it("multiplies thrown weapons by their quantity and skips integrated weapons", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        rangedWeapons: [
          { id: "r1", name: "Throwing Star", weight: "1 kg", quantity: 4 },
          { id: "r2", name: "Built-in Gun", weight: "9 kg", integrated: true },
        ],
        meleeWeapons: [
          { id: "m1", name: "Throwing Knife", weight: "2 kg", quantity: 2 },
          { id: "m2", name: "Built-in Claw", weight: "8 kg", integrated: true },
        ],
      })
    ).toBe(8);
  });

  it("adds spare ammunition by clips, using a tenth of the weapon weight for a clip", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        rangedWeapons: [
          {
            id: "r1",
            name: "Test Gun",
            weight: "10 kg",
            clip: "20",
            ammoEntries: [{ id: "e1", name: "Rounds", clips: 2, rounds: 0, loaded: false }],
          },
        ],
      })
    ).toBe(12);
  });

  it("adds loose rounds for a weapon that tracks rounds", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        rangedWeapons: [
          {
            id: "r1",
            name: "Test Gun",
            weight: "10 kg",
            clip: "20",
            ammoTracking: "loose",
            ammoEntries: [{ id: "e1", name: "Rounds", clips: 0, rounds: 10, loaded: false }],
          },
        ],
      })
    ).toBe(10.5);
  });

  it("adds the 6 kg of a loaded backpack feed and uses that weight for the other ammunition", () => {
    const feed = {
      id: "feed",
      referenceId: "cr-flamer-backpack-fuel-hose",
      name: "Feed",
      clips: 1,
      rounds: 0,
      loaded: true,
    };
    const fuel = { id: "fuel", name: "Fuel", clips: 1, rounds: 0, loaded: false };
    const flamer = { id: "r1", name: "Test Flamer", weight: "10 kg", clip: "10" };

    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        rangedWeapons: [{ ...flamer, ammoEntries: [feed, fuel] }],
      })
    ).toBeCloseTo(17.6);
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        rangedWeapons: [{ ...flamer, ammoEntries: [{ ...feed, loaded: false }, fuel] }],
      })
    ).toBeCloseTo(11);
  });

  it("adds the ammunition of a melee weapon's pistol profile", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        meleeWeapons: [
          {
            id: "m1",
            referenceId: "ih-chimera-pistol-sword",
            name: "Chimera Pistol Sword",
            weight: "3.5 kg",
            alternateRangedAmmoEntries: [
              { id: "p1", name: "Bullets", clips: 0, rounds: 10, loaded: true },
            ],
          },
        ],
      })
    ).toBeCloseTo(7);
  });

  it("counts an installed cybernetic as 0 and one that is not installed at its weight", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        cybernetics: [
          { id: "c1", name: "Installed Eye", weight: "3 kg" },
          { id: "c2", name: "Spare Eye", weight: "4 kg", installed: false },
        ],
      })
    ).toBe(4);
  });

  it("counts Archeotech at its weight, except integrated weapons and installed cybernetics", () => {
    expect(
      calcCarriedWeightKg({
        ...NOTHING,
        archeotech: [
          { id: "a1", name: "Relic", type: "Device", weight: "2 kg" },
          { id: "a2", name: "Blade", type: "Integrated Weapon", weight: "5 kg" },
          { id: "a3", name: "Eye", type: "Cybernetic", weight: "6 kg" },
          { id: "a4", name: "Spare Eye", type: "Cybernetic", weight: "7 kg", installed: false },
        ],
      })
    ).toBe(9);
  });
});

describe("resolveAmmoEntryTracking", () => {
  const entry = { id: "e1", name: "Rounds", clips: 1, rounds: 0, loaded: false };

  it("uses the weapon's tracking and clip when the ammunition has no reference", () => {
    expect(resolveAmmoEntryTracking(entry, undefined, "20", "loose")).toEqual({
      ammoTracking: "loose",
      capacity: "20",
    });
  });

  it("treats a backpack feed as a clip", () => {
    expect(
      resolveAmmoEntryTracking(
        { ...entry, referenceId: "cr-flamer-backpack-fuel-hose" },
        undefined,
        "20",
        "loose"
      ).ammoTracking
    ).toBe("clip");
  });
});
