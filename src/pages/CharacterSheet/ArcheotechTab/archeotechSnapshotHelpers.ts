import { inferCustomItemStatus } from "../../../services/customItemService";
import type { ArcheotechRef } from "../../../data/reference/archeotechReference";
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

/** The Archeotech types that the Archeotech tab draws as weapon cards. */
export const ARCHEOTECH_WEAPON_TYPES: readonly string[] = [
  "Weapon",
  "Integrated Weapon",
  "Grenade",
  "Mine",
];

export function archeotechFromReference(
  id: string,
  ref: ArcheotechRef,
  assigned: { value?: string; availability?: string; weight?: string } = {}
): ArcheotechItem {
  return {
    id,
    referenceId: ref.id,
    name: ref.name,
    type: ref.type,
    source: ref.source,
    // Store GM-assigned values directly on the item so they override "—"
    value: assigned.value || undefined,
    availability: assigned.availability || undefined,
    weight: assigned.weight || undefined,
  };
}
