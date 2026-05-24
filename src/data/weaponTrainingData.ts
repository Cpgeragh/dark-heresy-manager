// src/data/weaponTrainingData.ts

import type { WeaponTrainingTalentId } from "../types/Character";

export interface WeaponTrainingItem {
  id: WeaponTrainingTalentId;
  display: string;
}

export interface WeaponTrainingGroup {
  label: string;
  items: readonly WeaponTrainingItem[];
}

export const WEAPON_TRAINING_GROUPS: readonly WeaponTrainingGroup[] = [
  {
    label: "Basic Weapon Training",
    items: [
      { id: "basic-las",       display: "Las" },
      { id: "basic-sp",        display: "SP" },
      { id: "basic-bolt",      display: "Bolt" },
      { id: "basic-flame",     display: "Flame" },
      { id: "basic-plasma",    display: "Plasma" },
      { id: "basic-melta",     display: "Melta" },
      { id: "basic-launcher",  display: "Launcher" },
      { id: "basic-primitive", display: "Primitive" },
    ],
  },
  {
    label: "Heavy Weapon Training",
    items: [
      { id: "heavy-las",       display: "Las" },
      { id: "heavy-sp",        display: "SP" },
      { id: "heavy-bolt",      display: "Bolt" },
      { id: "heavy-flame",     display: "Flame" },
      { id: "heavy-plasma",    display: "Plasma" },
      { id: "heavy-melta",     display: "Melta" },
      { id: "heavy-launcher",  display: "Launcher" },
      { id: "heavy-primitive", display: "Primitive" },
    ],
  },
  {
    label: "Pistol Training",
    items: [
      { id: "pistol-las",       display: "Las" },
      { id: "pistol-sp",        display: "SP" },
      { id: "pistol-bolt",      display: "Bolt" },
      { id: "pistol-flame",     display: "Flame" },
      { id: "pistol-plasma",    display: "Plasma" },
      { id: "pistol-melta",     display: "Melta" },
      { id: "pistol-launcher",  display: "Launcher" },
      { id: "pistol-primitive", display: "Primitive" },
    ],
  },
  {
    label: "Melee Weapon Training",
    items: [
      { id: "melee-primitive", display: "Primitive" },
      { id: "melee-chain",     display: "Chain" },
      { id: "melee-shock",     display: "Shock" },
      { id: "melee-power",     display: "Power" },
    ],
  },
  {
    label: "Thrown Weapon Training",
    items: [
      { id: "thrown-primitive", display: "Primitive" },
      { id: "thrown-chain",     display: "Chain" },
      { id: "thrown-shock",     display: "Shock" },
      { id: "thrown-power",     display: "Power" },
    ],
  },
];
