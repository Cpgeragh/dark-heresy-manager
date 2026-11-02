import { inferCustomItemStatus } from "../../../services/customItemService";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import type {
  ArmourLocationKey,
  CyberneticCraftsmanship,
  CyberneticItem,
} from "../../../types/Character";
import { craftsmanshipValue } from "./cyberneticsHelpers";
import type { CampaignCustomItem, CustomCyberneticData } from "../../../types/CustomItems";

export function toCustomCyberneticData(item: CyberneticItem): CustomCyberneticData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    personalNotes: _personalNotes,
    bodyLocation: _bodyLocation,
    installed: _installed,
    ...data
  } = item;

  return data;
}

export function buildCyberneticSnapshot(
  id: string,
  bodyLocation: ArmourLocationKey[] | undefined,
  data: CustomCyberneticData,
  customLibraryId: string,
  customLibraryVersionId: string,
  installed?: boolean
): CyberneticItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
    ...(bodyLocation ? { bodyLocation } : {}),
    ...(installed !== undefined ? { installed } : {}),
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

export function cyberneticFromReference(
  id: string,
  ref: CyberneticRef,
  options: {
    craftsmanship?: CyberneticCraftsmanship;
    bodyLocation?: ArmourLocationKey[];
    value?: string;
    availability?: string;
    weight?: string;
  } = {}
): CyberneticItem {
  const { craftsmanship, bodyLocation, value, availability, weight } = options;
  return {
    id,
    referenceId: ref.id,
    name: ref.name,
    ...(craftsmanship ? { craftsmanship } : {}),
    ...(craftsmanship
      ? { value: value ?? craftsmanshipValue(ref, craftsmanship) }
      : value !== undefined
        ? { value }
        : {}),
    availability: availability ?? ref.availability,
    source: ref.source,
    installed: false,
    ...(weight ? { weight } : {}),
    ...(bodyLocation ? { bodyLocation } : {}),
  };
}
