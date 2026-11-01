import { inferCustomItemStatus } from "../../../services/customItemService";
import type { ArcheotechItem } from "../../../types/Character";
import type { CampaignCustomItem, CustomArcheotechData } from "../../../types/CustomItems";

export function toCustomArcheotechData(item: ArcheotechItem): CustomArcheotechData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    personalNotes: _personalNotes,
    equipped: _equipped,
    installed: _installed,
    ...data
  } = item;

  return data;
}

export function buildArcheotechSnapshot(
  id: string,
  equipped: boolean | undefined,
  data: CustomArcheotechData,
  customLibraryId: string,
  customLibraryVersionId: string,
  installed?: boolean
): ArcheotechItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
    ...(equipped !== undefined ? { equipped } : {}),
    ...(installed !== undefined ? { installed } : {}),
  };
}

export function buildFallbackArcheotechLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: ArcheotechItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"archeotech"> {
  const data = toCustomArcheotechData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "archeotech",
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
