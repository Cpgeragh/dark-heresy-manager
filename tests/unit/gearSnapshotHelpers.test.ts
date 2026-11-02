import { describe, expect, it } from "vitest";
import {
  buildConsumableSnapshot,
  buildFallbackConsumableLibraryItem,
  buildFallbackGearLibraryItem,
  buildGearSnapshot,
  consumableFromReference,
  gearFromReference,
  toCustomConsumableData,
  toCustomGearData,
} from "../../src/pages/CharacterSheet/GearTab/gearSnapshotHelpers";
import { CONSUMABLES_REFERENCE } from "../../src/data/reference/consumablesReference";
import { GEAR_REFERENCE } from "../../src/data/reference/gearReference";
import type { ConsumableItem, GearItem } from "../../src/types/Character";

describe("gear snapshot helpers", () => {
  it("keeps one character's personal note out of reusable gear and consumable data", () => {
    expect(
      toCustomGearData({ id: "g", name: "Auspex", personalNotes: "Mine" } as GearItem)
    ).toEqual({ name: "Auspex" });
    expect(
      toCustomConsumableData({
        id: "c",
        name: "Ration Pack",
        quantity: 2,
        personalNotes: "Mine",
      } as ConsumableItem)
    ).toEqual({ name: "Ration Pack" });
  });

  it("removes character-instance links from reusable gear data", () => {
    const item: GearItem = {
      id: "gear-instance",
      referenceId: "gear-reference",
      customLibraryId: "gear-library",
      customLibraryVersionId: "gear-version",
      name: "Auspex",
      weight: "0.5 kg",
    };

    expect(toCustomGearData(item)).toEqual({ name: "Auspex", weight: "0.5 kg" });
  });

  it("keeps consumable quantity on the character snapshot rather than reusable data", () => {
    const item: ConsumableItem = {
      id: "consumable-instance",
      referenceId: "consumable-reference",
      customLibraryId: "consumable-library",
      customLibraryVersionId: "consumable-version",
      name: "Ration Pack",
      quantity: 4,
    };
    const data = toCustomConsumableData(item);

    expect(data).toEqual({ name: "Ration Pack" });
    expect(
      buildConsumableSnapshot("new-instance", 7, data, "new-library", "new-version")
    ).toMatchObject({
      id: "new-instance",
      name: "Ration Pack",
      quantity: 7,
      customLibraryId: "new-library",
      customLibraryVersionId: "new-version",
    });
  });

  it("assigns snapshot and library identities to reusable gear data", () => {
    const snapshot = buildGearSnapshot(
      "new-instance",
      { name: "Multikey" },
      "new-library",
      "new-version"
    );

    expect(snapshot).toEqual({
      id: "new-instance",
      name: "Multikey",
      customLibraryId: "new-library",
      customLibraryVersionId: "new-version",
    });
  });

  it("builds category-specific fallback library records and infers their status", () => {
    const gear = buildFallbackGearLibraryItem({
      campaignId: "campaign",
      item: { id: "gear", name: "Grapnel" },
      userId: "user",
      characterId: "character",
    });
    const consumable = buildFallbackConsumableLibraryItem({
      campaignId: "campaign",
      item: {
        id: "consumable",
        name: "Glow-globe Charge",
        quantity: 2,
        customLibraryVersionId: "published-version",
      },
      userId: "user",
      characterId: "character",
    });

    expect(gear).toMatchObject({ category: "gear", name: "Grapnel", status: "draft" });
    expect(consumable).toMatchObject({
      category: "consumable",
      name: "Glow-globe Charge",
      status: "published",
    });
    expect(consumable.data).not.toHaveProperty("quantity");
  });
});

describe("gear and consumable reference builders", () => {
  it("builds a gear item from a reference, with assigned values winning", () => {
    const ref = GEAR_REFERENCE[0];
    expect(gearFromReference("picker-gear", ref)).toMatchObject({
      id: "picker-gear",
      referenceId: ref.id,
      name: ref.name,
      weight: ref.weight,
      value: ref.value,
      availability: ref.availability,
      source: ref.source,
    });
    expect(
      gearFromReference("picker-gear", ref, {
        value: "500 Thrones",
        availability: "Rare",
        weight: "2 kg",
      })
    ).toMatchObject({ value: "500 Thrones", availability: "Rare", weight: "2 kg" });
  });

  it("builds a consumable from a reference with a quantity of one", () => {
    const ref = CONSUMABLES_REFERENCE[0];
    expect(consumableFromReference("picker-consumable", ref)).toMatchObject({
      id: "picker-consumable",
      referenceId: ref.id,
      name: ref.name,
      quantity: 1,
      value: ref.value,
    });
  });
});
