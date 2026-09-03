// src/pages/CharacterSheet/weapons/weaponSnapshotHelpers.ts
// Pure data-transform helpers for converting between a character's owned
// weapon/shield instances and their campaign custom-item library data.

import type { RangedWeapon, MeleeWeapon, GrenadeItem, ShieldItem } from "../../../types/Character";
import type {
  CampaignCustomItem,
  CustomArmourData,
  CustomGrenadeData,
  CustomWeaponData,
} from "../../../types/CustomItems";
import { inferCustomItemStatus } from "../../../services/customItemService";

export type CustomRangedWeaponData = Extract<CustomWeaponData, { weaponKind: "ranged" }>;
export type CustomMeleeWeaponData = Extract<CustomWeaponData, { weaponKind: "melee" }>;
export type CustomShieldData = Extract<CustomArmourData, { armourKind: "shield" }>;

export function toCustomRangedWeaponData(weapon: RangedWeapon): CustomRangedWeaponData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    ammoEntries: _ammoEntries,
    equipped: _equipped,
    quantity: _quantity,
    upgrades: _upgrades,
    ...data
  } = weapon;

  return {
    ...data,
    weaponKind: "ranged",
  };
}

export function toCustomMeleeWeaponData(weapon: MeleeWeapon): CustomMeleeWeaponData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    quantity: _quantity,
    upgrades: _upgrades,
    ...data
  } = weapon;

  return {
    ...data,
    weaponKind: "melee",
  };
}

export function toCustomGrenadeData(grenade: GrenadeItem): CustomGrenadeData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    quantity: _quantity,
    custom: _custom,
    ...data
  } = grenade;

  return {
    ...data,
    weaponKind: "grenade",
  };
}

export function toCustomShieldData(shield: ShieldItem): CustomShieldData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    ...data
  } = shield;

  return {
    ...data,
    armourKind: "shield",
  };
}

export function stripWeaponKind<TData extends CustomWeaponData>(data: TData): Omit<TData, "weaponKind"> {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  return weaponData;
}

export function stripArmourKind<TData extends CustomArmourData>(data: TData): Omit<TData, "armourKind"> {
  const { armourKind: _armourKind, ...armourData } = data;
  return armourData;
}

export function buildRangedWeaponSnapshot(
  id: string,
  copyFields: Partial<RangedWeapon>,
  data: CustomRangedWeaponData,
  customLibraryId: string,
  customLibraryVersionId: string
): RangedWeapon {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  const quantity =
    copyFields.quantity ??
    (weaponData.class?.toLowerCase().includes("thrown") ? 1 : undefined);

  return {
    id,
    ...weaponData,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.ammoEntries ? { ammoEntries: copyFields.ammoEntries } : {}),
    ...(copyFields.upgrades ? { upgrades: copyFields.upgrades } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

export function buildMeleeWeaponSnapshot(
  id: string,
  copyFields: Partial<MeleeWeapon>,
  data: CustomMeleeWeaponData,
  customLibraryId: string,
  customLibraryVersionId: string
): MeleeWeapon {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  const quantity =
    copyFields.quantity ??
    (weaponData.class?.toLowerCase().includes("thrown") ? 1 : undefined);

  return {
    id,
    ...weaponData,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.upgrades ? { upgrades: copyFields.upgrades } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

export function buildGrenadeSnapshot(
  id: string,
  copyFields: Partial<GrenadeItem>,
  data: CustomGrenadeData,
  customLibraryId: string,
  customLibraryVersionId: string
): GrenadeItem {
  const { weaponKind: _weaponKind, ...grenadeData } = data;

  return {
    id,
    ...grenadeData,
    custom: true,
    quantity: copyFields.quantity ?? 1,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

export function buildShieldSnapshot(
  id: string,
  copyFields: Partial<ShieldItem>,
  data: CustomShieldData,
  customLibraryId: string,
  customLibraryVersionId: string
): ShieldItem {
  const { armourKind: _armourKind, ...shieldData } = data;

  return {
    id,
    ...shieldData,
    custom: true,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

export function buildFallbackWeaponLibraryItem({
  campaignId,
  weapon,
  kind,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  weapon: RangedWeapon | MeleeWeapon;
  kind: "ranged" | "melee";
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"weapon"> {
  const data =
    kind === "ranged"
      ? toCustomRangedWeaponData(weapon as RangedWeapon)
      : toCustomMeleeWeaponData(weapon as MeleeWeapon);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: weapon.customLibraryId ?? "",
    campaignId,
    category: "weapon",
    status: inferCustomItemStatus(weapon),
    name: weapon.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: weapon.customLibraryVersionId ?? null,
    latestVersionId: weapon.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}

export function buildFallbackGrenadeLibraryItem({
  campaignId,
  grenade,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  grenade: GrenadeItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"weapon"> {
  const data = toCustomGrenadeData(grenade);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: grenade.customLibraryId ?? "",
    campaignId,
    category: "weapon",
    status: inferCustomItemStatus(grenade),
    name: grenade.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: grenade.customLibraryVersionId ?? null,
    latestVersionId: grenade.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}

export function buildFallbackShieldLibraryItem({
  campaignId,
  shield,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  shield: ShieldItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"armour"> {
  const data = toCustomShieldData(shield);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: shield.customLibraryId ?? "",
    campaignId,
    category: "armour",
    status: inferCustomItemStatus(shield),
    name: shield.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: shield.customLibraryVersionId ?? null,
    latestVersionId: shield.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
