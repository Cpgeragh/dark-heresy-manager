import { inferCustomItemStatus } from "../../../services/customItemService";
import type { ArmourLocationKey, CyberneticItem } from "../../../types/Character";
import type { CampaignCustomItem, CustomCyberneticData } from "../../../types/CustomItems";

export function toCustomCyberneticData(item: CyberneticItem): CustomCyberneticData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    bodyLocation: _bodyLocation,
    ...data
  } = item;

  return data;
}

export function buildCyberneticSnapshot(
  id: string,
  bodyLocation: ArmourLocationKey[] | undefined,
  data: CustomCyberneticData,
  customLibraryId: string,
  customLibraryVersionId: string
): CyberneticItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
    ...(bodyLocation ? { bodyLocation } : {}),
  };
}

export function buildFallbackCyberneticLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: CyberneticItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"cybernetic"> {
  const data = toCustomCyberneticData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "cybernetic",
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
