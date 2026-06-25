// tests/unit/customItemService.test.ts

import { describe, expect, it } from "vitest";
import { buildCharacterCopyUpdate } from "../../src/services/customItemService";
import type { Character } from "../../src/types/Character";
import type { CustomConsumableData, CustomDrugData } from "../../src/types/CustomItems";

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
});
