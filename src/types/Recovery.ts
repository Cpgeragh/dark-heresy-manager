export type OwnershipState = "unclaimed" | "claimed-by-you" | "claimed-by-other" | "locked";

export interface RecoveryLookupResult {
  campaignId: string;
  characterId: string;
  characterName: string;
  campaignName: string;
  ownership: OwnershipState;
}
