import { describe, expect, it } from "vitest";
import {
  armourPieceFromReference,
  buildArmourSnapshot,
  buildFallbackArmourLibraryItem,
  stripArmourKind,
  toCustomArmourData,
} from "../../src/pages/CharacterSheet/ArmourTab/armourSnapshotHelpers";
import { ARMOUR_REFERENCE } from "../../src/data/reference/armourReference";
import type { WornArmourPiece } from "../../src/types/Character";

describe("armour snapshot helpers", () => {
  const piece: WornArmourPiece = {
    id: "armour-instance",
    referenceId: "armour-reference",
    customLibraryId: "armour-library",
    customLibraryVersionId: "armour-version",
    name: "Flak Coat",
    locations: ["body", "rightArm", "leftArm"],
    ap: 3,
    worn: true,
    upgrades: ["upgrade-reference"],
  };

  it("keeps one character's personal note out of reusable armour data", () => {
    expect(toCustomArmourData({ ...piece, personalNotes: "Mine" })).not.toHaveProperty(
      "personalNotes"
    );
  });

  it("removes character-instance state and tags reusable worn-armour data", () => {
    const data = toCustomArmourData(piece);

    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("referenceId");
    expect(data).not.toHaveProperty("customLibraryId");
    expect(data).not.toHaveProperty("customLibraryVersionId");
    expect(data).not.toHaveProperty("worn");
    expect(data).not.toHaveProperty("upgrades");
    expect(data).toMatchObject({ name: "Flak Coat", armourKind: "worn" });
  });

  it("restores per-character worn state and library identities in the snapshot", () => {
    const snapshot = buildArmourSnapshot(
      "new-instance",
      false,
      toCustomArmourData(piece),
      "new-library",
      "new-version"
    );

    expect(snapshot).toMatchObject({
      id: "new-instance",
      name: "Flak Coat",
      worn: false,
      customLibraryId: "new-library",
      customLibraryVersionId: "new-version",
    });
    expect(snapshot).not.toHaveProperty("armourKind");
  });

  it("rejects shield data at the Armour tab boundary", () => {
    const shieldData = { armourKind: "shield" as const, name: "Riot Shield", ap: 1 };

    expect(() => stripArmourKind(shieldData)).toThrow(
      "Unsupported armour library item for Armour tab."
    );
    expect(() =>
      buildArmourSnapshot("new-instance", true, shieldData, "new-library", "new-version")
    ).toThrow("Unsupported armour library item for Armour tab.");
  });

  it("builds an armour fallback record without instance-only fields", () => {
    const fallback = buildFallbackArmourLibraryItem({
      campaignId: "campaign",
      piece,
      userId: "user",
      characterId: "character",
    });

    expect(fallback).toMatchObject({
      category: "armour",
      name: "Flak Coat",
      status: "published",
    });
    expect(fallback.data).not.toHaveProperty("worn");
    expect(fallback.data).not.toHaveProperty("upgrades");
  });
});

describe("armour reference builder", () => {
  const flakJacket = ARMOUR_REFERENCE.find((ref) => ref.id === "cr-flak-jacket")!;
  const refractionBracer = ARMOUR_REFERENCE.find((ref) => ref.id === "dh-refraction-bracer")!;

  it("builds a worn Common piece from a reference", () => {
    expect(armourPieceFromReference("picker-armour", flakJacket)).toMatchObject({
      id: "picker-armour",
      referenceId: flakJacket.id,
      name: flakJacket.name,
      ap: flakJacket.ap,
      craftsmanship: "Common",
      worn: true,
      weight: flakJacket.weight,
    });
  });

  it("adds one armour point for Best craftsmanship", () => {
    const piece = armourPieceFromReference("picker-armour", flakJacket, "Best");
    expect(piece.ap).toBe(flakJacket.ap + 1);
    expect(piece.craftsmanship).toBe("Best");
  });

  it("keeps the force field marker and protection rating", () => {
    const piece = armourPieceFromReference("picker-field", refractionBracer);
    expect(piece.isForceField).toBe(true);
    expect(piece.protectionRating).toBe(refractionBracer.protectionRating);
  });
});
