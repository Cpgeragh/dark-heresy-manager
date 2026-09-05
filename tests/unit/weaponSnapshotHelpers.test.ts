// tests/unit/weaponSnapshotHelpers.test.ts
import { describe, it, expect } from "vitest";
import {
  toCustomRangedWeaponData,
  toCustomMeleeWeaponData,
  toCustomGrenadeData,
  toCustomShieldData,
  stripWeaponKind,
  stripArmourKind,
  buildRangedWeaponSnapshot,
  buildMeleeWeaponSnapshot,
  buildGrenadeSnapshot,
  buildShieldSnapshot,
  buildFallbackWeaponLibraryItem,
  buildFallbackGrenadeLibraryItem,
  buildFallbackShieldLibraryItem,
} from "../../src/pages/CharacterSheet/weapons/weaponSnapshotHelpers";
import type { RangedWeapon, MeleeWeapon, GrenadeItem, ShieldItem } from "../../src/types/Character";

describe("toCustomRangedWeaponData", () => {
  it("strips instance-specific fields and tags the weaponKind", () => {
    const weapon: RangedWeapon = {
      id: "r1",
      referenceId: "cr-lasgun",
      customLibraryId: "lib1",
      customLibraryVersionId: "v1",
      ammoEntries: [],
      equipped: true,
      quantity: 2,
      upgrades: ["cr-mono"],
      name: "Lasgun",
      class: "Basic",
      damage: "1d10+3",
      pen: "0",
    };
    const data = toCustomRangedWeaponData(weapon);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("referenceId");
    expect(data).not.toHaveProperty("customLibraryId");
    expect(data).not.toHaveProperty("ammoEntries");
    expect(data).not.toHaveProperty("equipped");
    expect(data).not.toHaveProperty("quantity");
    expect(data).not.toHaveProperty("upgrades");
    expect(data.name).toBe("Lasgun");
    expect(data.weaponKind).toBe("ranged");
  });
});

describe("toCustomMeleeWeaponData", () => {
  it("strips instance-specific fields and tags the weaponKind", () => {
    const weapon: MeleeWeapon = {
      id: "m1",
      customLibraryId: "lib1",
      quantity: 1,
      upgrades: [],
      name: "Chainsword",
      damage: "1d10+2",
      pen: "2",
    };
    const data = toCustomMeleeWeaponData(weapon);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("quantity");
    expect(data.weaponKind).toBe("melee");
  });
});

describe("toCustomGrenadeData", () => {
  it("strips instance-specific fields, including custom, and tags the weaponKind", () => {
    const grenade: GrenadeItem = {
      id: "g1",
      name: "Frag Grenade",
      quantity: 3,
      custom: true,
    };
    const data = toCustomGrenadeData(grenade);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("quantity");
    expect(data).not.toHaveProperty("custom");
    expect(data.weaponKind).toBe("grenade");
  });
});

describe("toCustomShieldData", () => {
  it("strips instance-specific fields and tags the armourKind", () => {
    const shield: ShieldItem = {
      id: "s1",
      name: "Riot Shield",
      ap: 1,
      equipped: true,
    };
    const data = toCustomShieldData(shield);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("equipped");
    expect(data.armourKind).toBe("shield");
  });
});

describe("stripWeaponKind / stripArmourKind", () => {
  it("removes just the kind discriminator", () => {
    const weaponData = { weaponKind: "ranged" as const, name: "Lasgun" };
    expect(stripWeaponKind(weaponData)).toEqual({ name: "Lasgun" });

    const armourData = { armourKind: "shield" as const, name: "Riot Shield", ap: 4 };
    expect(stripArmourKind(armourData)).toEqual({ name: "Riot Shield", ap: 4 });
  });
});

describe("buildRangedWeaponSnapshot", () => {
  const data = toCustomRangedWeaponData({
    id: "ignored",
    name: "Lasgun",
    class: "Basic",
    damage: "1d10+3",
    pen: "0",
  });

  it("assigns the new id and library ids", () => {
    const result = buildRangedWeaponSnapshot("new-id", {}, data, "lib1", "v1");
    expect(result.id).toBe("new-id");
    expect(result.customLibraryId).toBe("lib1");
    expect(result.customLibraryVersionId).toBe("v1");
    expect(result.name).toBe("Lasgun");
  });

  it("defaults quantity to 1 for a Thrown-class weapon with no copyFields quantity", () => {
    const thrownData = toCustomRangedWeaponData({
      id: "ignored",
      name: "Frag Cannon",
      class: "Thrown",
      damage: "2d10",
      pen: "0",
    });
    const result = buildRangedWeaponSnapshot("new-id", {}, thrownData, "lib1", "v1");
    expect(result.quantity).toBe(1);
  });

  it("does not set a quantity for a non-Thrown weapon with no copyFields quantity", () => {
    const result = buildRangedWeaponSnapshot("new-id", {}, data, "lib1", "v1");
    expect(result.quantity).toBeUndefined();
  });

  it("preserves ammoEntries, upgrades, quantity and equipped from copyFields", () => {
    const result = buildRangedWeaponSnapshot(
      "new-id",
      {
        ammoEntries: [{ id: "a1", name: "Bullets", clips: 1, rounds: 0, loaded: true }],
        upgrades: ["cr-mono"],
        quantity: 5,
        equipped: true,
      },
      data,
      "lib1",
      "v1"
    );
    expect(result.ammoEntries).toHaveLength(1);
    expect(result.upgrades).toEqual(["cr-mono"]);
    expect(result.quantity).toBe(5);
    expect(result.equipped).toBe(true);
  });
});

describe("buildMeleeWeaponSnapshot", () => {
  it("defaults quantity to 1 for a Thrown-class weapon", () => {
    const data = toCustomMeleeWeaponData({
      id: "ignored",
      name: "Throwing Knife",
      class: "Thrown",
      damage: "1d5",
      pen: "0",
    });
    const result = buildMeleeWeaponSnapshot("new-id", {}, data, "lib1", "v1");
    expect(result.quantity).toBe(1);
  });

  it("assigns the new id and preserves copyFields.equipped", () => {
    const data = toCustomMeleeWeaponData({
      id: "ignored",
      name: "Chainsword",
      damage: "1d10+2",
      pen: "2",
    });
    const result = buildMeleeWeaponSnapshot("new-id", { equipped: true }, data, "lib1", "v1");
    expect(result.id).toBe("new-id");
    expect(result.equipped).toBe(true);
  });
});

describe("buildGrenadeSnapshot", () => {
  it("always sets custom: true and defaults quantity to 1", () => {
    const data = toCustomGrenadeData({ id: "ignored", name: "Frag Grenade", quantity: 1 });
    const result = buildGrenadeSnapshot("new-id", {}, data, "lib1", "v1");
    expect(result.custom).toBe(true);
    expect(result.quantity).toBe(1);
  });

  it("uses copyFields.quantity when provided", () => {
    const data = toCustomGrenadeData({ id: "ignored", name: "Frag Grenade", quantity: 1 });
    const result = buildGrenadeSnapshot("new-id", { quantity: 4 }, data, "lib1", "v1");
    expect(result.quantity).toBe(4);
  });
});

describe("buildShieldSnapshot", () => {
  it("always sets custom: true and assigns the new id", () => {
    const data = toCustomShieldData({ id: "ignored", name: "Riot Shield", ap: 1 });
    const result = buildShieldSnapshot("new-id", {}, data, "lib1", "v1");
    expect(result.custom).toBe(true);
    expect(result.id).toBe("new-id");
  });
});

describe("buildFallbackWeaponLibraryItem", () => {
  it("infers a draft status when there is no customLibraryVersionId", () => {
    const weapon: RangedWeapon = {
      id: "r1",
      name: "Lasgun",
      class: "Basic",
      damage: "1d10+3",
      pen: "0",
    };
    const item = buildFallbackWeaponLibraryItem({
      campaignId: "camp1",
      weapon,
      kind: "ranged",
      userId: "u1",
      characterId: "c1",
    });
    expect(item.status).toBe("draft");
    expect(item.category).toBe("weapon");
    expect(item.name).toBe("Lasgun");
  });

  it("infers a published status when a customLibraryVersionId is present", () => {
    const weapon: RangedWeapon = {
      id: "r1",
      name: "Lasgun",
      class: "Basic",
      damage: "1d10+3",
      pen: "0",
      customLibraryVersionId: "v1",
    };
    const item = buildFallbackWeaponLibraryItem({
      campaignId: "camp1",
      weapon,
      kind: "ranged",
      userId: "u1",
      characterId: "c1",
    });
    expect(item.status).toBe("published");
  });
});

describe("buildFallbackGrenadeLibraryItem", () => {
  it("builds a weapon-category fallback item for a grenade", () => {
    const grenade: GrenadeItem = { id: "g1", name: "Frag Grenade", quantity: 1 };
    const item = buildFallbackGrenadeLibraryItem({
      campaignId: "camp1",
      grenade,
      userId: "u1",
      characterId: "c1",
    });
    expect(item.category).toBe("weapon");
    expect(item.name).toBe("Frag Grenade");
  });
});

describe("buildFallbackShieldLibraryItem", () => {
  it("builds an armour-category fallback item for a shield", () => {
    const shield: ShieldItem = { id: "s1", name: "Riot Shield", ap: 1 };
    const item = buildFallbackShieldLibraryItem({
      campaignId: "camp1",
      shield,
      userId: "u1",
      characterId: "c1",
    });
    expect(item.category).toBe("armour");
    expect(item.name).toBe("Riot Shield");
  });
});
