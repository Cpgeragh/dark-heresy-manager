// src/types/CustomItems.ts

import type { FieldValue, Timestamp } from "firebase/firestore";
import type {
  ArcheotechItem,
  ConsumableItem,
  CyberneticItem,
  DrugItem,
  GearItem,
  GrenadeItem,
  MeleeWeapon,
  RangedWeapon,
  ShieldItem,
  WornArmourPiece,
} from "./Character";

export type CustomItemCategory =
  | "gear"
  | "consumable"
  | "drug"
  | "cybernetic"
  | "weapon"
  | "armour"
  | "archeotech";

export type CustomItemStatus = "draft" | "published" | "archived";

export interface CustomItemCreator {
  userId: string;
  characterId?: string;
  characterName?: string;
}

export interface CustomItemAuditFields {
  createdAt: Timestamp | Date | FieldValue;
  updatedAt: Timestamp | Date | FieldValue;
  createdBy: CustomItemCreator;
  updatedBy: CustomItemCreator;
}

export type CustomGearData = Omit<
  GearItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId"
>;

export type CustomConsumableData = Omit<
  ConsumableItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "quantity"
>;

export type CustomDrugData = Omit<
  DrugItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "quantity"
>;

export type CustomCyberneticData = Omit<
  CyberneticItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "bodyLocation"
>;

export type CustomRangedWeaponData = Omit<
  RangedWeapon,
  | "id"
  | "referenceId"
  | "customLibraryId"
  | "customLibraryVersionId"
  | "ammoEntries"
  | "equipped"
  | "quantity"
  | "upgrades"
> & {
  weaponKind: "ranged";
};

export type CustomMeleeWeaponData = Omit<
  MeleeWeapon,
  | "id"
  | "referenceId"
  | "customLibraryId"
  | "customLibraryVersionId"
  | "equipped"
  | "quantity"
  | "upgrades"
> & {
  weaponKind: "melee";
};

export type CustomGrenadeData = Omit<
  GrenadeItem,
  | "id"
  | "referenceId"
  | "customLibraryId"
  | "customLibraryVersionId"
  | "equipped"
  | "quantity"
  | "custom"
> & {
  weaponKind: "grenade";
};

export type CustomWeaponData =
  | CustomRangedWeaponData
  | CustomMeleeWeaponData
  | CustomGrenadeData;

export type CustomArmourData =
  | (Omit<
      WornArmourPiece,
      "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "worn"
    > & {
      armourKind: "worn";
    })
  | (Omit<
      ShieldItem,
      "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "equipped"
    > & {
      armourKind: "shield";
    });

export type CustomArcheotechData = Omit<
  ArcheotechItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "equipped"
>;

export interface CustomItemDataByCategory {
  gear: CustomGearData;
  consumable: CustomConsumableData;
  drug: CustomDrugData;
  cybernetic: CustomCyberneticData;
  weapon: CustomWeaponData;
  armour: CustomArmourData;
  archeotech: CustomArcheotechData;
}

export type CustomItemData = CustomItemDataByCategory[CustomItemCategory];

export interface CampaignCustomItemVersion<
  TCategory extends CustomItemCategory = CustomItemCategory,
> extends CustomItemAuditFields {
  id: string;
  campaignId: string;
  customItemId: string;
  category: TCategory;
  versionNumber: number;
  status: Exclude<CustomItemStatus, "archived">;
  data: CustomItemDataByCategory[TCategory];
  publishedAt?: Timestamp | Date | FieldValue | null;
  publishedByUserId?: string | null;
}

export interface CampaignCustomItem<
  TCategory extends CustomItemCategory = CustomItemCategory,
> extends CustomItemAuditFields {
  id: string;
  campaignId: string;
  category: TCategory;
  status: CustomItemStatus;
  name: string;
  creator: CustomItemCreator;
  publishedVersionId?: string | null;
  draftVersionId?: string | null;
  latestVersionId: string;
  latestVersionNumber: number;
  archivedAt?: Timestamp | Date | FieldValue | null;
  archivedByUserId?: string | null;
  data: CustomItemDataByCategory[TCategory];
}
