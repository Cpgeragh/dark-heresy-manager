// src/pages/characterSheet/ArcheotechTab/archeotechConstants.ts

export const ITEM_TYPES = [
  "Weapon",
  "Grenade",
  "Mine",
  "Armour",
  "Cybernetic",
  "Integrated Weapon",
  "Shield",
  "Force Field",
  "Device",
  "Other",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
