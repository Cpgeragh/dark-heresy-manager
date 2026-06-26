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

export const AVAILABILITY_OPTIONS = [
  "Abundant",
  "Plentiful",
  "Common",
  "Average",
  "Uncommon",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
  "Issued Only",
  "Adeptus Mechanicus Only",
] as const;
