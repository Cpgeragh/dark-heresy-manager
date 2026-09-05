import { describe, expect, it } from "vitest";
import {
  buildCyberneticSnapshot,
  buildFallbackCyberneticLibraryItem,
  toCustomCyberneticData,
} from "../../src/pages/CharacterSheet/CyberneticsTab/cyberneticSnapshotHelpers";
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
