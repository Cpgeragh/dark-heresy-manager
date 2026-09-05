import { describe, expect, it } from "vitest";
import {
  getPurityFatePoints,
  getPurityRemovalInventory,
} from "../../src/mechanics/talents/purityOfFlesh";

describe("Purity of Flesh removal inventory", () => {
  it("counts installed bionics and integrated weapons while excluding Mechadendrites from Fate", () => {
    const inventory = getPurityRemovalInventory(
      [
        { id: "arm", referenceId: "cr-bionic-arm", name: "Bionic Arm", craftsmanship: "Common" },
        {
          id: "mech",
          referenceId: "cr-optical-mechadendrite",
          name: "Renamed implant",
          craftsmanship: "Good",
        },
      ],
      [
        { id: "integrated-ranged", name: "Built-in Pistol", integrated: true },
        { id: "ordinary-ranged", name: "Lasgun" },
      ],
      [{ id: "integrated-melee", name: "Claw", integrated: true }],
      [
        { id: "arch-cyber", name: "Ancient Eye", type: "Cybernetic" },
        { id: "arch-integrated", name: "Ancient Blade", type: "Integrated Weapon" },
        { id: "arch-ordinary", name: "Ancient Gun", type: "Weapon" },
      ]
    );

    expect(inventory.map((item) => item.name)).toEqual([
      "Bionic Arm",
      "Renamed implant",
      "Built-in Pistol",
      "Claw",
      "Ancient Eye",
      "Ancient Blade",
    ]);
    expect(inventory.find((item) => item.name === "Renamed implant")?.qualifiesForFate).toBe(false);
    expect(getPurityFatePoints(inventory)).toBe(2);
  });

  it("recognises a custom Mechadendrite by name", () => {
    const inventory = getPurityRemovalInventory(
      [{ id: "custom", name: "Custom Utility Mechadendrite", craftsmanship: "Common" }],
      [],
      [],
      []
    );

    expect(inventory[0].qualifiesForFate).toBe(false);
    expect(getPurityFatePoints(inventory)).toBe(0);
  });
});
