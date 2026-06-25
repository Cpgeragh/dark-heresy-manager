// tests/unit/customItemService.test.ts

import { describe, expect, it } from "vitest";
import { buildCharacterCopyUpdate } from "../../src/services/customItemService";
import type { Character } from "../../src/types/Character";
import type {
  CustomArcheotechData,
  CustomArmourData,
  CustomConsumableData,
  CustomCyberneticData,
  CustomDrugData,
  CustomWeaponData,
} from "../../src/types/CustomItems";

function characterWithItems(overrides: Partial<Character>): Character {
  return {
    id: "char-1",
    campaignId: "camp-1",
    userId: "player-1",
    recoveryCode: "CODE",
    isEditableByPlayer: true,
    header: { characterName: "Acolyte" },
    characteristics: {
      ws: { base: 25, advances: 0 },
      bs: { base: 25, advances: 0 },
      s: { base: 25, advances: 0 },
      t: { base: 25, advances: 0 },
      ag: { base: 25, advances: 0 },
      int: { base: 25, advances: 0 },
      per: { base: 25, advances: 0 },
      wp: { base: 25, advances: 0 },
      fel: { base: 25, advances: 0 },
    },
    skills: [],
    wounds: { total: 10, current: 10, criticalDamage: 0, fatigue: 0 },
    fate: { total: 1, current: 1 },
    insanity: { points: 0, disorders: "" },
    corruption: { points: 0, malignancies: "" },
    movement: { half: 2, full: 4, charge: 6, run: 12 },
    rangedWeapons: [],
    meleeWeapons: [],
    armour: [],
    talentsAndTraits: { homeworld: "", talents: [], traits: [] },
    gear: [],
    ...overrides,
    weaponTraining: { trained: [], exoticWeapons: [] },
    experience: { ranks: [], total: 0, spent: 0 },
    psychic: { psyRating: 0, minorPowers: [], majorPowers: [] },
  };
}

function characterWithConsumables(consumables: Character["consumables"]): Character {
  return characterWithItems({ consumables });
}

function characterWithDrugs(drugs: Character["drugs"]): Character {
  return characterWithItems({ drugs });
}

function characterWithCybernetics(cybernetics: Character["cybernetics"]): Character {
  return characterWithItems({ cybernetics });
}

function characterWithArcheotech(archeotech: Character["archeotech"]): Character {
  return characterWithItems({ archeotech });
}

function characterWithArmour(armour: Character["armour"]): Character {
  return characterWithItems({ armour });
}

function characterWithShields(shields: Character["shields"]): Character {
  return characterWithItems({ shields });
}

function characterWithRangedWeapons(rangedWeapons: Character["rangedWeapons"]): Character {
  return characterWithItems({ rangedWeapons });
}

function characterWithMeleeWeapons(meleeWeapons: Character["meleeWeapons"]): Character {
  return characterWithItems({ meleeWeapons });
}

function characterWithGrenades(grenades: Character["grenades"]): Character {
  return characterWithItems({ grenades });
}

describe("custom item copy updates", () => {
  it("updates linked consumable definition fields while preserving quantity", () => {
    const definition: CustomConsumableData = {
      name: "Revised Medicae Kit",
      description: "Updated campaign rules.",
      weight: "2 kg",
      value: "75 Thrones",
      availability: "Scarce",
      source: "Custom",
    };

    const update = buildCharacterCopyUpdate(
      characterWithConsumables([
        {
          id: "copy-1",
          name: "Old Medicae Kit",
          quantity: 4,
          description: "Old rules.",
          weight: "1 kg",
          value: "50 Thrones",
          availability: "Rare",
          source: "Custom",
          customLibraryId: "library-1",
          customLibraryVersionId: "version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Rations",
          quantity: 9,
          value: "10 Thrones",
          availability: "Common",
        },
      ]),
      "consumable",
      "library-1",
      "version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.consumables?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Medicae Kit",
      quantity: 4,
      customLibraryId: "library-1",
      customLibraryVersionId: "version-2",
    });
    expect(update?.consumables?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Rations",
      quantity: 9,
    });
  });

  it("updates linked drug definition fields while preserving quantity", () => {
    const definition: CustomDrugData = {
      name: "Revised Stimm",
      notes: "Updated campaign drug rules.",
      weight: "0 kg",
      value: "30 Thrones",
      availability: "Average",
      source: "Custom",
    };

    const update = buildCharacterCopyUpdate(
      characterWithDrugs([
        {
          id: "copy-1",
          name: "Old Stimm",
          quantity: 6,
          notes: "Old rules.",
          weight: "0 kg",
          value: "20 Thrones",
          availability: "Average",
          source: "Custom",
          customLibraryId: "drug-library-1",
          customLibraryVersionId: "drug-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Slaught",
          quantity: 2,
          value: "75 Thrones",
          availability: "Scarce",
        },
      ]),
      "drug",
      "drug-library-1",
      "drug-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.drugs?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Stimm",
      quantity: 6,
      customLibraryId: "drug-library-1",
      customLibraryVersionId: "drug-version-2",
    });
    expect(update?.drugs?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Slaught",
      quantity: 2,
    });
  });

  it("updates linked cybernetic definition fields while preserving body location", () => {
    const definition: CustomCyberneticData = {
      name: "Revised Bionic Arm",
      craftsmanship: "Good",
      notes: "Updated campaign implant rules.",
      value: "2500 Thrones",
      availability: "Rare",
      source: "Custom",
    };

    const update = buildCharacterCopyUpdate(
      characterWithCybernetics([
        {
          id: "copy-1",
          name: "Old Bionic Arm",
          craftsmanship: "Common",
          notes: "Old rules.",
          value: "1500 Thrones",
          availability: "Scarce",
          source: "Custom",
          bodyLocation: ["leftArm"],
          customLibraryId: "cyber-library-1",
          customLibraryVersionId: "cyber-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Bionic Leg",
          craftsmanship: "Common",
          value: "1500 Thrones",
          availability: "Scarce",
          bodyLocation: ["rightLeg"],
        },
      ]),
      "cybernetic",
      "cyber-library-1",
      "cyber-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.cybernetics?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Bionic Arm",
      craftsmanship: "Good",
      bodyLocation: ["leftArm"],
      customLibraryId: "cyber-library-1",
      customLibraryVersionId: "cyber-version-2",
    });
    expect(update?.cybernetics?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Bionic Leg",
      bodyLocation: ["rightLeg"],
    });
  });

  it("updates linked archeotech definition fields while preserving equipped state", () => {
    const definition: CustomArcheotechData = {
      name: "Revised Null Box",
      type: "Containment",
      description: "Updated campaign relic rules.",
      notes: "Still deeply unsettling.",
      weight: "2 kg",
      value: "5000 Thrones",
      availability: "Very Rare",
      source: "Custom",
    };

    const update = buildCharacterCopyUpdate(
      characterWithArcheotech([
        {
          id: "copy-1",
          name: "Old Null Box",
          type: "Containment",
          description: "Old rules.",
          weight: "1 kg",
          value: "3000 Thrones",
          availability: "Rare",
          source: "Custom",
          equipped: true,
          customLibraryId: "archeotech-library-1",
          customLibraryVersionId: "archeotech-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Stasis Charm",
          type: "Charm",
          value: "1000 Thrones",
          availability: "Scarce",
          equipped: false,
        },
      ]),
      "archeotech",
      "archeotech-library-1",
      "archeotech-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.archeotech?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Null Box",
      equipped: true,
      customLibraryId: "archeotech-library-1",
      customLibraryVersionId: "archeotech-version-2",
    });
    expect(update?.archeotech?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Stasis Charm",
      equipped: false,
    });
  });

  it("updates linked armour definition fields while preserving worn state", () => {
    const definition: CustomArmourData = {
      armourKind: "worn",
      name: "Revised Flak Coat",
      locations: ["body", "rightArm", "leftArm"],
      ap: 4,
      notes: "Updated campaign armour rules.",
      weight: "6 kg",
      value: "150 Thrones",
      availability: "Scarce",
      source: "Custom",
      craftsmanship: "Common",
      custom: true,
    };

    const update = buildCharacterCopyUpdate(
      characterWithArmour([
        {
          id: "copy-1",
          name: "Old Flak Coat",
          locations: ["body"],
          ap: 3,
          worn: false,
          weight: "5 kg",
          value: "100 Thrones",
          availability: "Average",
          source: "Custom",
          customLibraryId: "armour-library-1",
          customLibraryVersionId: "armour-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Mesh Vest",
          locations: ["body"],
          ap: 4,
          worn: true,
          value: "400 Thrones",
          availability: "Rare",
        },
      ]),
      "armour",
      "armour-library-1",
      "armour-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.armour?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Flak Coat",
      ap: 4,
      worn: false,
      customLibraryId: "armour-library-1",
      customLibraryVersionId: "armour-version-2",
    });
    expect(update?.armour?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Mesh Vest",
      worn: true,
    });
  });

  it("updates linked shield definition fields while preserving equipped state", () => {
    const definition: CustomArmourData = {
      armourKind: "shield",
      name: "Revised Lockshield",
      ap: 5,
      locations: "Arm & Body",
      damage: "1d10+1 I",
      pen: "1",
      specialRules: "Defensive",
      notes: "Updated campaign shield rules.",
      weight: "5 kg",
      value: "120 Thrones",
      availability: "Rare",
      source: "Custom",
      custom: true,
    };

    const update = buildCharacterCopyUpdate(
      characterWithShields([
        {
          id: "copy-1",
          name: "Old Lockshield",
          ap: 4,
          locations: "Arm",
          damage: "1d10 I",
          pen: "0",
          equipped: true,
          customLibraryId: "shield-library-1",
          customLibraryVersionId: "shield-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Riot Shield",
          ap: 1,
          locations: "Arm & Body",
          damage: "1d10 I",
          pen: "0",
          equipped: false,
        },
      ]),
      "armour",
      "shield-library-1",
      "shield-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.shields?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Lockshield",
      ap: 5,
      equipped: true,
      customLibraryId: "shield-library-1",
      customLibraryVersionId: "shield-version-2",
    });
    expect(update?.shields?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Riot Shield",
      equipped: false,
    });
  });

  it("updates linked ranged weapon definition fields while preserving ammo, upgrades, quantity, and equipped state", () => {
    const definition: CustomWeaponData = {
      weaponKind: "ranged",
      name: "Revised Needle Pistol",
      class: "Pistol",
      range: "30m",
      rof: "S/2/-",
      damage: "1d10+2 R",
      pen: "3",
      clip: "6",
      rld: "Full",
      ammoTracking: "clip",
      ammoType: "Solid Projectile",
      specialRules: "Accurate",
      weight: "2 kg",
      value: "1200 Thrones",
      availability: "Very Rare",
      source: "Custom",
      craftsmanship: "Good",
      custom: true,
    };

    const update = buildCharacterCopyUpdate(
      characterWithRangedWeapons([
        {
          id: "copy-1",
          name: "Old Needle Pistol",
          class: "Pistol",
          range: "20m",
          rof: "S/-/-",
          damage: "1d10 R",
          pen: "2",
          clip: "3",
          rld: "Full",
          ammoTracking: "clip",
          ammoEntries: [
            {
              id: "ammo-1",
              name: "Needle Rounds",
              clips: 2,
              rounds: 1,
              loaded: true,
            },
          ],
          upgrades: ["red-dot-laser-sight"],
          quantity: 2,
          equipped: true,
          customLibraryId: "weapon-library-1",
          customLibraryVersionId: "weapon-version-1",
        },
      ]),
      "weapon",
      "weapon-library-1",
      "weapon-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.rangedWeapons?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Needle Pistol",
      damage: "1d10+2 R",
      ammoEntries: [{ id: "ammo-1", clips: 2, rounds: 1, loaded: true }],
      upgrades: ["red-dot-laser-sight"],
      quantity: 2,
      equipped: true,
      customLibraryId: "weapon-library-1",
      customLibraryVersionId: "weapon-version-2",
    });
  });

  it("updates linked melee weapon definition fields while preserving upgrades, quantity, and equipped state", () => {
    const definition: CustomWeaponData = {
      weaponKind: "melee",
      name: "Revised Power Blade",
      class: "Melee",
      damage: "1d10+4 E",
      pen: "6",
      specialRules: "Power Field",
      weight: "3 kg",
      value: "2500 Thrones",
      availability: "Very Rare",
      source: "Custom",
      craftsmanship: "Best",
      custom: true,
    };

    const update = buildCharacterCopyUpdate(
      characterWithMeleeWeapons([
        {
          id: "copy-1",
          name: "Old Power Blade",
          class: "Melee",
          damage: "1d10+2 E",
          pen: "5",
          upgrades: ["mono"],
          quantity: 1,
          equipped: false,
          customLibraryId: "melee-library-1",
          customLibraryVersionId: "melee-version-1",
        },
      ]),
      "weapon",
      "melee-library-1",
      "melee-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.meleeWeapons?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Power Blade",
      damage: "1d10+4 E",
      upgrades: ["mono"],
      quantity: 1,
      equipped: false,
      customLibraryId: "melee-library-1",
      customLibraryVersionId: "melee-version-2",
    });
  });

  it("updates linked grenade definition fields while preserving quantity and equipped state", () => {
    const definition: CustomWeaponData = {
      weaponKind: "grenade",
      name: "Revised Rad Bomb",
      type: "Grenade",
      class: "Thrown",
      damage: "2d10 X",
      pen: "4",
      specialRules: "Blast (5), Toxic (1)",
      weight: "0.5 kg",
      value: "250 Thrones",
      availability: "Rare",
      source: "Custom",
      description: "Updated campaign explosive rules.",
    };

    const update = buildCharacterCopyUpdate(
      characterWithGrenades([
        {
          id: "copy-1",
          name: "Old Rad Bomb",
          type: "Grenade",
          class: "Thrown",
          damage: "1d10 X",
          pen: "2",
          quantity: 5,
          equipped: true,
          customLibraryId: "grenade-library-1",
          customLibraryVersionId: "grenade-version-1",
        },
        {
          id: "copy-2",
          name: "Unlinked Frag Grenade",
          type: "Grenade",
          class: "Thrown",
          damage: "2d10 X",
          pen: "0",
          quantity: 2,
          equipped: false,
        },
      ]),
      "weapon",
      "grenade-library-1",
      "grenade-version-2",
      definition
    );

    expect(update?.updatedCopies).toBe(1);
    expect(update?.grenades?.[0]).toMatchObject({
      id: "copy-1",
      name: "Revised Rad Bomb",
      damage: "2d10 X",
      quantity: 5,
      equipped: true,
      customLibraryId: "grenade-library-1",
      customLibraryVersionId: "grenade-version-2",
    });
    expect(update?.grenades?.[1]).toMatchObject({
      id: "copy-2",
      name: "Unlinked Frag Grenade",
      quantity: 2,
      equipped: false,
    });
  });
});
