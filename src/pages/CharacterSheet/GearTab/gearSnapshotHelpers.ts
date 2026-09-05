import { inferCustomItemStatus } from "../../../services/customItemService";
import type { ConsumableItem, GearItem } from "../../../types/Character";
import type {
  CampaignCustomItem,
  CustomConsumableData,
  CustomGearData,
} from "../../../types/CustomItems";

export function toCustomGearData(item: GearItem): CustomGearData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    ...data
  } = item;

  return data;
}

export function toCustomConsumableData(item: ConsumableItem): CustomConsumableData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    quantity: _quantity,
    ...data
  } = item;

  return data;
}

export function buildGearSnapshot(
  id: string,
  data: CustomGearData,
  customLibraryId: string,
  customLibraryVersionId: string
): GearItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
  };
}

export function buildConsumableSnapshot(
  id: string,
  quantity: number,
  data: CustomConsumableData,
  customLibraryId: string,
  customLibraryVersionId: string
): ConsumableItem {
  return {
    id,
    ...data,
    quantity,
    customLibraryId,
    customLibraryVersionId,
  };
}

export function buildFallbackGearLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: GearItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"gear"> {
  const data = toCustomGearData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "gear",
    status: inferCustomItemStatus(item),
    name: item.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: item.customLibraryVersionId ?? null,
    latestVersionId: item.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}

export function buildFallbackConsumableLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: ConsumableItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"consumable"> {
  const data = toCustomConsumableData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "consumable",
    status: inferCustomItemStatus(item),
    name: item.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: item.customLibraryVersionId ?? null,
    latestVersionId: item.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
