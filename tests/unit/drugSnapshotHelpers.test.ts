import { describe, expect, it } from "vitest";
import {
  buildDrugSnapshot,
  buildFallbackDrugLibraryItem,
  toCustomDrugData,
} from "../../src/pages/CharacterSheet/DrugsTab/drugSnapshotHelpers";
import type { DrugItem } from "../../src/types/Character";

describe("drug snapshot helpers", () => {
  const item: DrugItem = {
    id: "drug-instance",
    referenceId: "drug-reference",
    customLibraryId: "drug-library",
    customLibraryVersionId: "drug-version",
    name: "Stimm",
    quantity: 3,
    personalNotes: "Mine",
  };

  it("removes character-instance state and the personal note from reusable data", () => {
    expect(toCustomDrugData(item)).toEqual({ name: "Stimm" });
  });

  it("keeps the quantity on the character snapshot rather than the reusable data", () => {
    const snapshot = buildDrugSnapshot("new-instance", 7, toCustomDrugData(item), "lib", "v2");

    expect(snapshot).toMatchObject({
      id: "new-instance",
      name: "Stimm",
      quantity: 7,
      customLibraryId: "lib",
      customLibraryVersionId: "v2",
    });
    expect(snapshot).not.toHaveProperty("personalNotes");
  });

  it("builds a library item from an owned copy without its note", () => {
    const library = buildFallbackDrugLibraryItem({
      campaignId: "campaign-1",
      item,
      userId: "user-1",
      characterId: "character-1",
    });

    expect(library.id).toBe("drug-library");
    expect(library.category).toBe("drug");
    expect(library.data).toEqual({ name: "Stimm" });
  });
});
