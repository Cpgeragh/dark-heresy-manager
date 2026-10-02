// shared-rules/src/weaponTrainingData.ts

import type { WeaponTrainingTalentId } from "./types.js";

export interface WeaponTrainingItem {
  id: WeaponTrainingTalentId;
  display: string;
}

export interface WeaponTrainingGroup {
  label: string;
  items: readonly WeaponTrainingItem[];
}

/**
 * Exotic Weapon Training specialisations whose referenced weapons are pistols only.
 * Knave of Pistols may acquire these specialisations, but not mixed-class training such as
 * Integrated Ranged Weapon.
 */
export const PISTOL_ONLY_EXOTIC_WEAPON_TRAINING = [
  "Galvian",
  "Hypo Pistol",
  "Needle Pistol",
  "Shock Blaster",
  "Shuriken Pistol",
  "Slugga",
  "Web Pistol",
  "Widower",
] as const;

const pistolOnlyExoticTrainingNames = new Set<string>(
  PISTOL_ONLY_EXOTIC_WEAPON_TRAINING.map((name) => name.toLocaleLowerCase())
);

export function isPistolOnlyExoticWeaponTraining(name: string): boolean {
  return pistolOnlyExoticTrainingNames.has(name.trim().toLocaleLowerCase());
}

export const WEAPON_TRAINING_GROUPS: readonly WeaponTrainingGroup[] = [
  {
    label: "Basic Weapon Training",
    items: [
      { id: "basic-bolt", display: "Bolt" },
      { id: "basic-flame", display: "Flame" },
      { id: "basic-las", display: "Las" },
      { id: "basic-launcher", display: "Launcher" },
      { id: "basic-melta", display: "Melta" },
      { id: "basic-plasma", display: "Plasma" },
      { id: "basic-primitive", display: "Primitive" },
      { id: "basic-sp", display: "SP" },
    ],
  },
  {
    label: "Heavy Weapon Training",
    items: [
      { id: "heavy-bolt", display: "Bolt" },
      { id: "heavy-flame", display: "Flame" },
      { id: "heavy-las", display: "Las" },
      { id: "heavy-launcher", display: "Launcher" },
      { id: "heavy-melta", display: "Melta" },
      { id: "heavy-plasma", display: "Plasma" },
      { id: "heavy-primitive", display: "Primitive" },
      { id: "heavy-sp", display: "SP" },
    ],
  },
  {
    label: "Melee Weapon Training",
    items: [
      { id: "melee-chain", display: "Chain" },
      { id: "melee-power", display: "Power" },
      { id: "melee-primitive", display: "Primitive" },
      { id: "melee-shock", display: "Shock" },
    ],
  },
  {
    label: "Pistol Training",
    items: [
      { id: "pistol-bolt", display: "Bolt" },
      { id: "pistol-flame", display: "Flame" },
      { id: "pistol-las", display: "Las" },
      { id: "pistol-launcher", display: "Launcher" },
      { id: "pistol-melta", display: "Melta" },
      { id: "pistol-plasma", display: "Plasma" },
      { id: "pistol-primitive", display: "Primitive" },
      { id: "pistol-sp", display: "SP" },
    ],
  },
  {
    label: "Thrown Weapon Training",
    items: [
      { id: "thrown-chain", display: "Chain" },
      { id: "thrown-power", display: "Power" },
      { id: "thrown-primitive", display: "Primitive" },
      { id: "thrown-shock", display: "Shock" },
    ],
  },
];
