import { inferCustomItemStatus } from "../../../services/customItemService";
import type { WornArmourPiece } from "../../../types/Character";
import type { CampaignCustomItem, CustomArmourData } from "../../../types/CustomItems";

export function toCustomArmourData(piece: WornArmourPiece): CustomArmourData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    worn: _worn,
    upgrades: _upgrades,
    ...data
  } = piece;

  return {
    ...data,
    armourKind: "worn",
  };
}

export function stripArmourKind(data: CustomArmourData): Omit<WornArmourPiece, "id" | "worn"> {
  if (data.armourKind !== "worn") {
    throw new Error("Unsupported armour library item for Armour tab.");
  }

  const { armourKind: _armourKind, ...pieceData } = data;
  return pieceData;
}

export function buildArmourSnapshot(
  id: string,
  worn: boolean,
  data: CustomArmourData,
  customLibraryId: string,
  customLibraryVersionId: string
): WornArmourPiece {
  if (data.armourKind !== "worn") {
    throw new Error("Unsupported armour library item for Armour tab.");
  }

  const { armourKind: _armourKind, ...pieceData } = data;
  return {
    id,
    ...pieceData,
    worn,
    customLibraryId,
    customLibraryVersionId,
  };
}

export function buildFallbackArmourLibraryItem({
  campaignId,
  piece,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  piece: WornArmourPiece;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"armour"> {
  const data = toCustomArmourData(piece);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: piece.customLibraryId ?? "",
    campaignId,
    category: "armour",
    status: inferCustomItemStatus(piece),
    name: piece.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: piece.customLibraryVersionId ?? null,
    latestVersionId: piece.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
