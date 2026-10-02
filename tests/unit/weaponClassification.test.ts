import { describe, expect, it } from "vitest";

import {
  MELEE_WEAPON_REFERENCE,
  RANGED_WEAPON_REFERENCE,
} from "../../src/data/reference/weaponReference";
import { PISTOL_ONLY_EXOTIC_WEAPON_TRAINING } from "../../src/data/reference/weaponTrainingData";

describe("weapon reference classification", () => {
  const references = [...RANGED_WEAPON_REFERENCE, ...MELEE_WEAPON_REFERENCE];

  it("gives every reference a physical class and weapon type", () => {
    for (const weapon of references) {
      expect(weapon.class, weapon.id).toBeTruthy();
      expect(weapon.type, weapon.id).toBeTruthy();
      expect(weapon.class, weapon.id).not.toContain("Exotic");
      expect(weapon.class, weapon.id).not.toContain("(");
    }
  });

  it("gives every Exotic weapon its required training specialisation", () => {
    for (const weapon of references.filter(({ type }) => type === "Exotic")) {
      expect(weapon.exoticTraining, weapon.id).toBeTruthy();
    }
  });

  it("classifies the Aegis Shock Blaster without confusing its training with its type", () => {
    const weapon = RANGED_WEAPON_REFERENCE.find(({ id }) => id === "ih-aegis-shock-blaster");
    expect(weapon).toMatchObject({
      class: "Pistol",
      type: "Exotic",
      exoticTraining: "Shock Blaster",
    });
  });

  it("classifies a conventional exotic pistol and an integrated weapon", () => {
    expect(RANGED_WEAPON_REFERENCE.find(({ id }) => id === "cr-needle-pistol")).toMatchObject({
      class: "Pistol",
      type: "Exotic",
      exoticTraining: "Needle Pistol",
    });
    expect(RANGED_WEAPON_REFERENCE.find(({ id }) => id === "lw-lathe-laspistol")).toMatchObject({
      class: "Pistol",
      type: "Exotic",
      exoticTraining: "Integrated Ranged Weapon",
    });
  });

  it("keeps the Gunslinger pistol-only list aligned with the classified references", () => {
    const classesByTraining = new Map<string, Set<string>>();
    for (const weapon of references.filter(({ type }) => type === "Exotic")) {
      const classes = classesByTraining.get(weapon.exoticTraining!) ?? new Set<string>();
      classes.add(weapon.class);
      classesByTraining.set(weapon.exoticTraining!, classes);
    }

    const pistolOnlyNames = [...classesByTraining]
      .filter(([, classes]) => classes.size === 1 && classes.has("Pistol"))
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));

    expect([...PISTOL_ONLY_EXOTIC_WEAPON_TRAINING].sort((a, b) => a.localeCompare(b))).toEqual(
      pistolOnlyNames
    );
  });
});
