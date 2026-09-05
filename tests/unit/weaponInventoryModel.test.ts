import { describe, expect, it } from "vitest";
import type {
  ArcheotechItem,
  CyberneticItem,
  GrenadeItem,
  MeleeWeapon,
  RangedWeapon,
  ShieldItem,
} from "../../src/types/Character";
import {
  buildWeaponInventoryModel,
  MAX_GRENADE_TYPES,
  MAX_WEAPON_SLOTS,
  type WeaponInventoryModelInput,
} from "../../src/pages/CharacterSheet/WeaponsTab/weaponInventoryModel";

function ranged(id: string, name: string, fields: Partial<RangedWeapon> = {}): RangedWeapon {
  return { id, name, damage: "1d10", pen: "0", ...fields };
}

function melee(id: string, name: string, fields: Partial<MeleeWeapon> = {}): MeleeWeapon {
  return { id, name, damage: "1d10", pen: "0", ...fields };
}

function grenade(id: string, name: string, fields: Partial<GrenadeItem> = {}): GrenadeItem {
  return { id, name, quantity: 1, ...fields };
}

function shield(id: string, name: string, fields: Partial<ShieldItem> = {}): ShieldItem {
  return { id, name, ap: 1, ...fields };
}

function archeotech(
  id: string,
  name: string,
  type: string,
  fields: Partial<ArcheotechItem> = {}
): ArcheotechItem {
  return { id, name, type, ...fields };
}

function cybernetic(id: string, name: string, referenceId: string): CyberneticItem {
  return { id, name, referenceId };
}

function model(overrides: Partial<WeaponInventoryModelInput> = {}) {
  return buildWeaponInventoryModel({
    rangedWeapons: [],
    meleeWeapons: [],
    grenades: [],
    ...overrides,
  });
}

describe("buildWeaponInventoryModel categorisation", () => {
  it("categorises regular and equipped integrated character weapons and preserves source indexes", () => {
    const inventory = model({
      rangedWeapons: [
        ranged("r-zulu", "Zulu Rifle"),
        ranged("r-integrated", "Arm Cannon", { integrated: true, equipped: true }),
        ranged("r-alpha", "Alpha Rifle"),
        ranged("r-hidden", "Hidden Arm Gun", { integrated: true, equipped: false }),
      ],
      meleeWeapons: [
        melee("m-zulu", "Zulu Blade"),
        melee("m-integrated", "Arm Blade", { integrated: true, equipped: true }),
        melee("m-alpha", "Alpha Blade"),
        melee("m-hidden", "Hidden Arm Blade", { integrated: true, equipped: false }),
      ],
    });

    expect(inventory.allRangedEntries.map(({ kind, name }) => ({ kind, name }))).toEqual([
      { kind: "integrated", name: "Arm Cannon" },
      { kind: "regular", name: "Alpha Rifle" },
      { kind: "regular", name: "Zulu Rifle" },
    ]);
    expect(inventory.allMeleeEntries.map(({ kind, name }) => ({ kind, name }))).toEqual([
      { kind: "integrated", name: "Arm Blade" },
      { kind: "regular", name: "Alpha Blade" },
      { kind: "regular", name: "Zulu Blade" },
    ]);
    expect(inventory.allRangedEntries.find((entry) => entry.name === "Alpha Rifle")).toMatchObject({
      index: 2,
    });
    expect(inventory.allMeleeEntries.find((entry) => entry.name === "Zulu Blade")).toMatchObject({
      index: 0,
    });
    expect(inventory.allRangedEntries.some((entry) => entry.name === "Hidden Arm Gun")).toBe(false);
    expect(inventory.allMeleeEntries.some((entry) => entry.name === "Hidden Arm Blade")).toBe(
      false
    );
  });

  it("categorises ranged and melee cybernetic weapons and ignores implants without weapons", () => {
    const inventory = model({
      cybernetics: [
        cybernetic("c-ranged", "Ballistic Mechadendrite", "cr-ballistic-mechadendrite"),
        cybernetic("c-melee", "Manipulator Mechadendrite", "cr-manipulator-mechadendrite"),
        cybernetic("c-none", "Cortex Implants", "cr-cortex-implants"),
      ],
    });

    expect(inventory.allRangedEntries).toHaveLength(1);
    expect(inventory.allRangedEntries[0]).toMatchObject({
      kind: "cybernetic",
      name: "Laspistol (Compact)",
      cybernetic: { id: "c-ranged" },
    });
    expect(inventory.allMeleeEntries).toHaveLength(1);
    expect(inventory.allMeleeEntries[0]).toMatchObject({
      kind: "cybernetic",
      name: "Crushing Pincers",
      cybernetic: { id: "c-melee" },
    });
  });

  it("categorises normal and integrated archeotech by explicit weapon class", () => {
    const inventory = model({
      archeotech: [
        archeotech("a-ranged", "Archeotech Rifle", "Weapon", { weaponClass: "Basic" }),
        archeotech("a-melee", "Archeotech Blade", "Weapon", { weaponClass: "Melee" }),
        archeotech("a-int-r", "Integrated Rifle", "Integrated Weapon", {
          weaponClass: "Basic",
          equipped: true,
        }),
        archeotech("a-int-m", "Integrated Blade", "Integrated Weapon", {
          weaponClass: "Melee",
          equipped: true,
        }),
        archeotech("a-int-hidden", "Dormant Integrated Blade", "Integrated Weapon", {
          weaponClass: "Melee",
          equipped: false,
        }),
      ],
    });

    expect(inventory.allRangedEntries.map((entry) => entry.name)).toEqual([
      "Integrated Rifle",
      "Archeotech Rifle",
    ]);
    expect(inventory.allMeleeEntries.map((entry) => entry.name)).toEqual([
      "Integrated Blade",
      "Archeotech Blade",
    ]);
    expect(
      inventory.allMeleeEntries.some((entry) => entry.name === "Dormant Integrated Blade")
    ).toBe(false);
  });

  it("falls back to authoritative archeotech reference classes", () => {
    const inventory = model({
      archeotech: [
        archeotech("fallback-melee", "Reference Melee", "Weapon", {
          referenceId: "lw-midath-power-glove",
        }),
        archeotech("fallback-ranged", "Reference Ranged", "Weapon", {
          referenceId: "lw-reclamator-rifle",
        }),
      ],
    });

    expect(inventory.allMeleeEntries.map((entry) => entry.name)).toEqual(["Reference Melee"]);
    expect(inventory.allRangedEntries.map((entry) => entry.name)).toEqual(["Reference Ranged"]);
  });

  it("categorises regular and archeotech explosives and both shield sources", () => {
    const inventory = model({
      grenades: [grenade("g", "Regular Grenade")],
      shields: [shield("s", "Regular Shield")],
      archeotech: [
        archeotech("a-g", "Archeotech Grenade", "Grenade"),
        archeotech("a-m", "Archeotech Mine", "Mine"),
        archeotech("a-s", "Archeotech Shield", "Shield"),
      ],
    });

    expect(inventory.allGrenadeEntries.map(({ kind, name }) => ({ kind, name }))).toEqual([
      { kind: "archeotech", name: "Archeotech Grenade" },
      { kind: "archeotech", name: "Archeotech Mine" },
      { kind: "regular", name: "Regular Grenade" },
    ]);
    expect(inventory.archeotechGrenadeItems.map((item) => item.name)).toEqual([
      "Archeotech Grenade",
    ]);
    expect(inventory.sortedShields.map((item) => item.name)).toEqual(["Regular Shield"]);
    expect(inventory.archeotechShieldItems.map((item) => item.name)).toEqual(["Archeotech Shield"]);
  });
});

describe("buildWeaponInventoryModel ordering", () => {
  it("orders cybernetic first, then equipped, then unequipped entries alphabetically", () => {
    const inventory = model({
      rangedWeapons: [
        ranged("r-stowed", "Alpha Stowed"),
        ranged("r-equipped", "Zulu Equipped", { equipped: true }),
      ],
      cybernetics: [
        cybernetic("c-ranged", "Ballistic Mechadendrite", "cr-ballistic-mechadendrite"),
      ],
      archeotech: [
        archeotech("a-equipped", "Alpha Equipped", "Weapon", {
          weaponClass: "Basic",
          equipped: true,
        }),
        archeotech("a-stowed", "Zulu Stowed", "Weapon", { weaponClass: "Basic" }),
      ],
    });

    expect(inventory.allRangedEntries.map((entry) => entry.name)).toEqual([
      "Laspistol (Compact)",
      "Alpha Equipped",
      "Zulu Equipped",
      "Alpha Stowed",
      "Zulu Stowed",
    ]);
  });

  it("orders explosives and each shield source by equipped state then name", () => {
    const inventory = model({
      grenades: [
        grenade("g-stowed", "Alpha Stowed"),
        grenade("g-equipped", "Zulu Equipped", { equipped: true }),
      ],
      shields: [
        shield("s-stowed", "Alpha Stowed"),
        shield("s-equipped", "Zulu Equipped", { equipped: true }),
      ],
      archeotech: [
        archeotech("a-g-stowed", "Beta Stowed", "Grenade"),
        archeotech("a-g-equipped", "Alpha Equipped", "Mine", { equipped: true }),
        archeotech("a-s-stowed", "Beta Stowed", "Shield"),
        archeotech("a-s-equipped", "Alpha Equipped", "Shield", { equipped: true }),
      ],
    });

    expect(inventory.allGrenadeEntries.map((entry) => entry.name)).toEqual([
      "Alpha Equipped",
      "Zulu Equipped",
      "Alpha Stowed",
      "Beta Stowed",
    ]);
    expect(inventory.sortedShields.map((item) => item.name)).toEqual([
      "Zulu Equipped",
      "Alpha Stowed",
    ]);
    expect(inventory.archeotechShieldItems.map((item) => item.name)).toEqual([
      "Alpha Equipped",
      "Beta Stowed",
    ]);
  });

  it("does not mutate any source array while ordering", () => {
    const rangedWeapons = [ranged("z", "Zulu"), ranged("a", "Alpha", { equipped: true })];
    const grenades = [grenade("z", "Zulu"), grenade("a", "Alpha", { equipped: true })];
    const shields = [shield("z", "Zulu"), shield("a", "Alpha", { equipped: true })];
    const archeotechItems = [
      archeotech("z", "Zulu", "Shield"),
      archeotech("a", "Alpha", "Shield", { equipped: true }),
    ];
    const originalOrders = {
      ranged: rangedWeapons.map((item) => item.id),
      grenades: grenades.map((item) => item.id),
      shields: shields.map((item) => item.id),
      archeotech: archeotechItems.map((item) => item.id),
    };

    model({ rangedWeapons, grenades, shields, archeotech: archeotechItems });

    expect(rangedWeapons.map((item) => item.id)).toEqual(originalOrders.ranged);
    expect(grenades.map((item) => item.id)).toEqual(originalOrders.grenades);
    expect(shields.map((item) => item.id)).toEqual(originalOrders.shields);
    expect(archeotechItems.map((item) => item.id)).toEqual(originalOrders.archeotech);
  });
});

describe("buildWeaponInventoryModel slot calculation", () => {
  it.each<{
    source: string;
    input: Partial<WeaponInventoryModelInput>;
    expectedSlots: number;
  }>([
    {
      source: "ordinary ranged weapon",
      input: { rangedWeapons: [ranged("r", "Lasgun", { class: "Basic", equipped: true })] },
      expectedSlots: 1,
    },
    {
      source: "heavy ranged weapon",
      input: { rangedWeapons: [ranged("r", "Heavy Bolter", { class: "Heavy", equipped: true })] },
      expectedSlots: 2,
    },
    {
      source: "ordinary melee weapon",
      input: { meleeWeapons: [melee("m", "Sword", { class: "Melee", equipped: true })] },
      expectedSlots: 1,
    },
    {
      source: "two-handed melee weapon",
      input: {
        meleeWeapons: [melee("m", "Great Weapon", { class: "Two-Handed", equipped: true })],
      },
      expectedSlots: 2,
    },
    {
      source: "stored integrated ranged weapon",
      input: {
        rangedWeapons: [
          ranged("r", "Integrated Heavy Gun", {
            class: "Heavy",
            integrated: true,
            equipped: true,
          }),
        ],
      },
      expectedSlots: 2,
    },
    {
      source: "stored integrated melee weapon",
      input: {
        meleeWeapons: [
          melee("m", "Integrated Great Blade", {
            class: "Two-Handed",
            integrated: true,
            equipped: true,
          }),
        ],
      },
      expectedSlots: 2,
    },
    {
      source: "archeotech ranged weapon",
      input: {
        archeotech: [
          archeotech("a", "Archeotech Rifle", "Weapon", {
            weaponClass: "Basic",
            equipped: true,
          }),
        ],
      },
      expectedSlots: 1,
    },
    {
      source: "archeotech melee weapon",
      input: {
        archeotech: [
          archeotech("a", "Archeotech Blade", "Weapon", {
            weaponClass: "Melee",
            equipped: true,
          }),
        ],
      },
      expectedSlots: 1,
    },
    {
      source: "archeotech integrated weapon",
      input: {
        archeotech: [
          archeotech("a", "Archeotech Implant Gun", "Integrated Weapon", {
            weaponClass: "Basic",
            equipped: true,
          }),
        ],
      },
      expectedSlots: 1,
    },
    {
      source: "regular shield",
      input: { shields: [shield("s", "Riot Shield", { equipped: true })] },
      expectedSlots: 1,
    },
    {
      source: "archeotech shield",
      input: {
        archeotech: [archeotech("a", "Archeotech Shield", "Shield", { equipped: true })],
      },
      expectedSlots: 1,
    },
    {
      source: "cybernetic weapon",
      input: {
        cybernetics: [cybernetic("c", "Ballistic Mechadendrite", "cr-ballistic-mechadendrite")],
      },
      expectedSlots: 0,
    },
    {
      source: "grenade",
      input: { grenades: [grenade("g", "Frag Grenade", { equipped: true })] },
      expectedSlots: 0,
    },
    {
      source: "unequipped weapon",
      input: { rangedWeapons: [ranged("r", "Lasgun", { equipped: false })] },
      expectedSlots: 0,
    },
  ])("counts $source as $expectedSlots weapon slots", ({ input, expectedSlots }) => {
    const inventory = model(input);

    expect(inventory.equippedWeaponSlots).toBe(expectedSlots);
    expect(inventory.slotsRemaining).toBe(MAX_WEAPON_SLOTS - expectedSlots);
  });

  it("counts equipped regular grenades, archeotech grenades, and mines as separate types", () => {
    const inventory = model({
      grenades: [
        grenade("g-equipped", "Frag Grenade", { equipped: true }),
        grenade("g-stowed", "Photon Flash Grenade"),
      ],
      archeotech: [
        archeotech("a-g", "Archeotech Grenade", "Grenade", { equipped: true }),
        archeotech("a-m", "Archeotech Mine", "Mine", { equipped: true }),
      ],
    });

    expect(MAX_GRENADE_TYPES).toBe(2);
    expect(inventory.equippedGrenadeTypes).toBe(3);
    expect(inventory.equippedWeaponSlots).toBe(0);
  });
});
