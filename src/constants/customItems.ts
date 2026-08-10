import type { CustomItemCategory, CustomItemStatus } from "../types/CustomItems";

export const CUSTOM_ITEM_ORIGIN_OPTIONS = ["Custom", "2nd Ed"] as const;

export type CustomItemOrigin = (typeof CUSTOM_ITEM_ORIGIN_OPTIONS)[number];

export const CUSTOM_ITEM_CATEGORY_ORDER = [
  "gear",
  "consumable",
  "drug",
  "cybernetic",
  "weapon",
  "armour",
  "archeotech",
  "power",
] as const satisfies readonly CustomItemCategory[];

export const CUSTOM_ITEM_CATEGORY_LABELS = {
  gear: "Gear",
  consumable: "Consumable",
  drug: "Drug",
  cybernetic: "Cybernetic",
  weapon: "Weapon",
  armour: "Armour",
  archeotech: "Archeotech",
  power: "Psychic Power",
} as const satisfies Record<CustomItemCategory, string>;

export const CUSTOM_ITEM_STATUS_ORDER = [
  "draft",
  "published",
  "archived",
] as const satisfies readonly CustomItemStatus[];
