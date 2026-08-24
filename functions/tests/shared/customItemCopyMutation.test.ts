// functions/tests/shared/customItemCopyMutation.test.ts
import { describe, it, expect } from "vitest";
import {
  buildCharacterCopyUpdate,
  buildCharacterCopyRemoval,
  type CharacterItemArrays,
} from "../../src/shared/customItemCopyMutation";

function makeCharacter(overrides: Partial<CharacterItemArrays> = {}): CharacterItemArrays {
  return {
    psychic: { minorPowers: [], majorPowers: [] },
    ...overrides,
  };
}

describe("buildCharacterCopyUpdate", () => {
  it("updates a matching ranged weapon and strips weaponKind", () => {
    const character = makeCharacter({
      rangedWeapons: [{ customLibraryId: "item-1", name: "Old" }, { customLibraryId: "other" }],
    });

    const result = buildCharacterCopyUpdate(character, "weapon", "item-1", "v2", {
      name: "New",
      weaponKind: "ranged",
    });

    expect(result).toEqual({
      rangedWeapons: [
        { customLibraryId: "item-1", customLibraryVersionId: "v2", name: "New" },
        { customLibraryId: "other" },
      ],
      updatedCopies: 1,
    });
  });

  it("updates a matching melee weapon", () => {
    const character = makeCharacter({ meleeWeapons: [{ customLibraryId: "item-1" }] });
    const result = buildCharacterCopyUpdate(character, "weapon", "item-1", "v2", {
      weaponKind: "melee",
    });
    expect(result?.updatedCopies).toBe(1);
    expect((result as { meleeWeapons: unknown[] }).meleeWeapons).toHaveLength(1);
  });

  it("updates a matching grenade", () => {
    const character = makeCharacter({ grenades: [{ customLibraryId: "item-1" }] });
    const result = buildCharacterCopyUpdate(character, "weapon", "item-1", "v2", {
      weaponKind: "grenade",
    });
    expect(result?.updatedCopies).toBe(1);
    expect((result as { grenades: unknown[] }).grenades).toHaveLength(1);
  });

  it("updates worn armour", () => {
    const character = makeCharacter({ armour: [{ customLibraryId: "item-1" }] });
    const result = buildCharacterCopyUpdate(character, "armour", "item-1", "v2", {
      armourKind: "worn",
    });
    expect((result as { armour: unknown[] }).armour).toHaveLength(1);
  });

  it("updates a shield", () => {
    const character = makeCharacter({ shields: [{ customLibraryId: "item-1" }] });
    const result = buildCharacterCopyUpdate(character, "armour", "item-1", "v2", {
      armourKind: "shield",
    });
    expect((result as { shields: unknown[] }).shields).toHaveLength(1);
  });

  it("updates a matching minor psychic power", () => {
    const character = makeCharacter({
      psychic: { minorPowers: [{ customLibraryId: "item-1" }], majorPowers: [] },
    });
    const result = buildCharacterCopyUpdate(character, "power", "item-1", "v2", { isMinor: true });
    expect(result).toMatchObject({ updatedCopies: 1 });
    expect((result as { psychic: { minorPowers: unknown[] } }).psychic.minorPowers).toHaveLength(1);
  });

  it("updates a matching major psychic power", () => {
    const character = makeCharacter({
      psychic: { minorPowers: [], majorPowers: [{ customLibraryId: "item-1" }] },
    });
    const result = buildCharacterCopyUpdate(character, "power", "item-1", "v2", { isMinor: false });
    expect((result as { psychic: { majorPowers: unknown[] } }).psychic.majorPowers).toHaveLength(1);
  });

  it.each([
    ["gear", "gear"],
    ["consumables", "consumable"],
    ["drugs", "drug"],
    ["cybernetics", "cybernetic"],
    ["archeotech", "archeotech"],
  ] as const)("updates a matching %s entry", (field, category) => {
    const character = makeCharacter({ [field]: [{ customLibraryId: "item-1" }] });
    const result = buildCharacterCopyUpdate(character, category, "item-1", "v2", {});
    expect((result as Record<string, unknown[]>)[field]).toHaveLength(1);
  });

  it("returns null when no copy matches", () => {
    const character = makeCharacter({ gear: [{ customLibraryId: "other" }] });
    expect(buildCharacterCopyUpdate(character, "gear", "item-1", "v2", {})).toBeNull();
  });

  it("returns null for the trait category", () => {
    const character = makeCharacter();
    expect(buildCharacterCopyUpdate(character, "trait", "item-1", "v2", {})).toBeNull();
  });
});

describe("buildCharacterCopyRemoval", () => {
  it("removes matching copies across multiple fields in one pass", () => {
    const character = makeCharacter({
      gear: [{ customLibraryId: "item-1" }, { customLibraryId: "other" }],
      rangedWeapons: [{ customLibraryId: "item-1" }],
    });

    const result = buildCharacterCopyRemoval(character, "item-1");

    expect(result).toEqual({
      gear: [{ customLibraryId: "other" }],
      rangedWeapons: [],
      removedCopies: 2,
    });
  });

  it("removes matching psychic powers from both minor and major", () => {
    const character = makeCharacter({
      psychic: {
        minorPowers: [{ customLibraryId: "item-1" }],
        majorPowers: [{ customLibraryId: "item-1" }, { customLibraryId: "other" }],
      },
    });

    const result = buildCharacterCopyRemoval(character, "item-1");

    expect(result).toEqual({
      psychic: { minorPowers: [], majorPowers: [{ customLibraryId: "other" }] },
      removedCopies: 2,
    });
  });

  it("returns null when the character holds no copies at all", () => {
    const character = makeCharacter({ gear: [{ customLibraryId: "other" }] });
    expect(buildCharacterCopyRemoval(character, "item-1")).toBeNull();
  });
});
