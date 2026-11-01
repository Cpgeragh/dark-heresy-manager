import { inferCustomItemStatus } from "../../../services/customItemService";
import type { DrugItem } from "../../../types/Character";
import type { CampaignCustomItem, CustomDrugData } from "../../../types/CustomItems";

export function toCustomDrugData(item: DrugItem): CustomDrugData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    personalNotes: _personalNotes,
    quantity: _quantity,
    ...data
  } = item;

  return data;
}

export function buildDrugSnapshot(
  id: string,
  quantity: number,
  data: CustomDrugData,
  customLibraryId: string,
  customLibraryVersionId: string
): DrugItem {
  return {
    id,
    ...data,
    quantity,
    customLibraryId,
    customLibraryVersionId,
  };
}

export function buildFallbackDrugLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: DrugItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"drug"> {
  const data = toCustomDrugData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "drug",
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
