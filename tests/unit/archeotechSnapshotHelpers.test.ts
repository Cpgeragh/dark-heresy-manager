import { describe, expect, it } from "vitest";
import {
  buildArcheotechSnapshot,
  buildFallbackArcheotechLibraryItem,
  toCustomArcheotechData,
} from "../../src/pages/CharacterSheet/ArcheotechTab/archeotechSnapshotHelpers";
import type { ArcheotechItem } from "../../src/types/Character";

describe("archeotech snapshot helpers", () => {
  const item = {
    id: "relic-instance",
    referenceId: "relic-reference",
    customLibraryId: "relic-library",
    customLibraryVersionId: "relic-version",
    name: "Relic",
    type: "Gear",
    equipped: true,
    installed: true,
    personalNotes: "Mine",
  } as ArcheotechItem;

  it("removes character-instance state and the personal note from reusable data", () => {
    expect(toCustomArcheotechData(item)).toEqual({ name: "Relic", type: "Gear" });
  });

  it("restores equipped and installed state on the character snapshot", () => {
    const snapshot = buildArcheotechSnapshot(
      "new-instance",
      false,
      toCustomArcheotechData(item),
      "lib",
      "v2",
      true
    );

    expect(snapshot).toMatchObject({
      id: "new-instance",
      name: "Relic",
      equipped: false,
      installed: true,
      customLibraryId: "lib",
      customLibraryVersionId: "v2",
    });
    expect(snapshot).not.toHaveProperty("personalNotes");
  });

  it("builds a library item from an owned copy without its note", () => {
    const library = buildFallbackArcheotechLibraryItem({
      campaignId: "campaign-1",
      item,
      userId: "user-1",
      characterId: "character-1",
    });

    expect(library.id).toBe("relic-library");
    expect(library.category).toBe("archeotech");
    expect(library.data).toEqual({ name: "Relic", type: "Gear" });
  });
});
