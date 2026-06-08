// src/pages/characterSheet/ArcheotechTab/archeotechConstants.ts

export const ITEM_TYPES = ["Weapon", "Grenade", "Mine", "Device", "Tool", "Other"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const RARITY_OPTIONS = [
  "Plentiful",
  "Common",
  "Average",
  "Scarce",
  "Rare",
  "Very Rare",
  "Extremely Rare",
  "Near Unique",
  "Unique",
] as const;
