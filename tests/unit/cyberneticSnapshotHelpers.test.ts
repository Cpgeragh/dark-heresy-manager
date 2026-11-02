import { describe, expect, it } from "vitest";
import {
  buildCyberneticSnapshot,
  buildFallbackCyberneticLibraryItem,
  cyberneticFromReference,
  toCustomCyberneticData,
} from "../../src/pages/CharacterSheet/CyberneticsTab/cyberneticSnapshotHelpers";
import { CYBERNETICS_REFERENCE } from "../../src/data/reference/cyberneticsReference";
import { craftsmanshipValue } from "../../src/pages/CharacterSheet/CyberneticsTab/cyberneticsHelpers";
import type { CyberneticItem } from "../../src/types/Character";

describe("cybernetic snapshot helpers", () => {
  const item: CyberneticItem = {
    id: "implant-instance",
    referenceId: "implant-reference",
    customLibraryId: "implant-library",
    customLibraryVersionId: "implant-version",
    name: "Bionic Arm",
    craftsmanship: "Good",
    bodyLocation: ["rightArm"],
  };

  it("keeps one character's personal note out of reusable data", () => {
    expect(toCustomCyberneticData({ ...item, personalNotes: "Mine" })).toEqual({
      name: "Bionic Arm",
      craftsmanship: "Good",
    });
  });

  it("removes character-instance links and installed locations from reusable data", () => {
    const data = toCustomCyberneticData(item);

    expect(data).toEqual({ name: "Bionic Arm", craftsmanship: "Good" });
  });

  it("restores installed locations and library identities in a character snapshot", () => {
    const snapshot = buildCyberneticSnapshot(
      "new-instance",
      ["leftArm"],
      toCustomCyberneticData(item),
      "new-library",
      "new-version"
    );

    expect(snapshot).toMatchObject({
      id: "new-instance",
      name: "Bionic Arm",
      bodyLocation: ["leftArm"],
      customLibraryId: "new-library",
      customLibraryVersionId: "new-version",
    });
  });

  it("does not add an absent installed location to a snapshot", () => {
    const snapshot = buildCyberneticSnapshot(
      "new-instance",
      undefined,
      toCustomCyberneticData(item),
      "new-library",
      "new-version"
    );

    expect(snapshot).not.toHaveProperty("bodyLocation");
  });

  it("builds a cybernetic fallback record and infers published status", () => {
    const fallback = buildFallbackCyberneticLibraryItem({
      campaignId: "campaign",
      item,
      userId: "user",
      characterId: "character",
    });

    expect(fallback).toMatchObject({
      category: "cybernetic",
      name: "Bionic Arm",
      status: "published",
    });
    expect(fallback.data).not.toHaveProperty("bodyLocation");
  });
});

describe("cybernetic reference builder", () => {
  const ref = CYBERNETICS_REFERENCE.find((entry) => entry.name === "Auger Arrays")!;

  it("builds a not installed implant with no craftsmanship by default", () => {
    const built = cyberneticFromReference("picker-implant", ref);
    expect(built).toMatchObject({
      id: "picker-implant",
      referenceId: ref.id,
      name: ref.name,
      availability: ref.availability,
      source: ref.source,
      installed: false,
    });
    expect(built).not.toHaveProperty("craftsmanship");
  });

  it("prices a chosen craftsmanship unless a value is assigned", () => {
    expect(cyberneticFromReference("picker-implant", ref, { craftsmanship: "Good" })).toMatchObject(
      {
        craftsmanship: "Good",
        value: craftsmanshipValue(ref, "Good"),
      }
    );
    expect(
      cyberneticFromReference("picker-implant", ref, {
        craftsmanship: "Good",
        value: "9 Thrones",
        weight: "3 kg",
        bodyLocation: ["leftArm"],
      })
    ).toMatchObject({ value: "9 Thrones", weight: "3 kg", bodyLocation: ["leftArm"] });
  });
});
