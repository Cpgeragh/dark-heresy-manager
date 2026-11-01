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
  PsychicPower,
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
  | "archeotech"
  | "power"
  | "trait";

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
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "personalNotes"
>;

export type CustomConsumableData = Omit<
  ConsumableItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "quantity" | "personalNotes"
>;

export type CustomDrugData = Omit<
  DrugItem,
  "id" | "referenceId" | "customLibraryId" | "customLibraryVersionId" | "quantity" | "personalNotes"
>;

export type CustomCyberneticData = Omit<
  CyberneticItem,
  | "id"
  | "referenceId"
  | "customLibraryId"
  | "customLibraryVersionId"
  | "bodyLocation"
  | "installed"
  | "personalNotes"
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
  | "personalNotes"
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
  | "personalNotes"
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
  | "personalNotes"
> & {
  weaponKind: "grenade";
};

export type CustomWeaponData = CustomRangedWeaponData | CustomMeleeWeaponData | CustomGrenadeData;

export type CustomArmourData =
  | (Omit<
      WornArmourPiece,
      | "id"
      | "referenceId"
      | "customLibraryId"
      | "customLibraryVersionId"
      | "worn"
      | "upgrades"
      | "personalNotes"
    > & {
      armourKind: "worn";
    })
  | (Omit<
      ShieldItem,
      | "id"
      | "referenceId"
      | "customLibraryId"
      | "customLibraryVersionId"
      | "equipped"
      | "personalNotes"
    > & {
      armourKind: "shield";
    });

export type CustomArcheotechData = Omit<
  ArcheotechItem,
  | "id"
  | "referenceId"
  | "customLibraryId"
  | "customLibraryVersionId"
  | "equipped"
  | "installed"
  | "personalNotes"
>;

export type CustomPsychicPowerData = Omit<
  PsychicPower,
  "id" | "talentEntryUid" | "customLibraryId" | "customLibraryVersionId" | "known" | "personalNotes"
>;

export type CustomTraitData = {
  name: string;
  description: string;
  itemNotes?: string;
  source: string;
};

export interface CustomItemDataByCategory {
  gear: CustomGearData;
  consumable: CustomConsumableData;
  drug: CustomDrugData;
  cybernetic: CustomCyberneticData;
  weapon: CustomWeaponData;
  armour: CustomArmourData;
  archeotech: CustomArcheotechData;
  power: CustomPsychicPowerData;
  trait: CustomTraitData;
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
