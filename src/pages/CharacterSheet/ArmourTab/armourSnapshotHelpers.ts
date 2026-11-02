import { inferCustomItemStatus } from "../../../services/customItemService";
import type { ArmourRef } from "../../../data/reference/armourReference";
import type { ArmourCraftsmanship, WornArmourPiece } from "../../../types/Character";
import { readWeightKg } from "../../../ui/format/weightFormat";
import type { CampaignCustomItem, CustomArmourData } from "../../../types/CustomItems";

export function toCustomArmourData(piece: WornArmourPiece): CustomArmourData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    personalNotes: _personalNotes,
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

function formatKg(value: number): string {
  return `${Number(value.toFixed(2))} kg`;
}

function halveWeight(weight: string): string {
  const kg = readWeightKg(weight);
  if (kg === null) return weight;
  return formatKg(kg / 2);
}

function applyCraftsmanshipToRef(ref: ArmourRef, craftsmanship: ArmourCraftsmanship) {
  if (craftsmanship !== "Best") {
    return {
      ap: ref.ap,
      apOverrides: ref.apOverrides,
      weight: ref.weight,
    };
  }

  const apOverrides = ref.apOverrides
    ? (Object.fromEntries(
        Object.entries(ref.apOverrides).map(([location, ap]) => [location, (ap ?? ref.ap) + 1])
      ) as typeof ref.apOverrides)
    : undefined;

  return {
    ap: ref.ap + 1,
    apOverrides,
    weight: halveWeight(ref.weight),
  };
}

export function armourPieceFromReference(
  id: string,
  ref: ArmourRef,
  craftsmanship: ArmourCraftsmanship = "Common"
): WornArmourPiece {
  const crafted = applyCraftsmanshipToRef(ref, craftsmanship);
  return {
    id,
    referenceId: ref.id,
    name: ref.name,
    locations: ref.locations,
    ap: crafted.ap,
    ...(crafted.apOverrides ? { apOverrides: crafted.apOverrides } : {}),
    ...(ref.isForceField ? { isForceField: true } : {}),
    ...(ref.protectionRating !== undefined ? { protectionRating: ref.protectionRating } : {}),
    craftsmanship,
    worn: true,
    weight: crafted.weight,
    value: ref.value,
    availability: ref.availability,
    source: ref.source,
  };
}
