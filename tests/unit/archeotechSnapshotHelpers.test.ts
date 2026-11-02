import { describe, expect, it } from "vitest";
import {
  ARCHEOTECH_WEAPON_TYPES,
  archeotechFromReference,
  buildArcheotechSnapshot,
  buildFallbackArcheotechLibraryItem,
  toCustomArcheotechData,
} from "../../src/pages/CharacterSheet/ArcheotechTab/archeotechSnapshotHelpers";
import { ARCHEOTECH_REFERENCE } from "../../src/data/reference/archeotechReference";
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

describe("archeotech reference builder", () => {
  const ref = ARCHEOTECH_REFERENCE[0];

  it("leaves assigned values empty until the GM assigns them", () => {
    expect(archeotechFromReference("picker-relic", ref, { value: "", availability: "" })).toEqual({
      id: "picker-relic",
      referenceId: ref.id,
      name: ref.name,
      type: ref.type,
      source: ref.source,
      value: undefined,
      availability: undefined,
      weight: undefined,
    });
  });

  it("stores the values the GM assigned", () => {
    expect(
      archeotechFromReference("picker-relic", ref, {
        value: "5,000 Thrones",
        availability: "Rare",
        weight: "12 kg",
      })
    ).toMatchObject({ value: "5,000 Thrones", availability: "Rare", weight: "12 kg" });
  });

  it("names the types drawn as weapon cards", () => {
    expect(ARCHEOTECH_WEAPON_TYPES).toEqual(["Weapon", "Integrated Weapon", "Grenade", "Mine"]);
  });
});
