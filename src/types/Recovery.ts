import type { Character } from "./Character";
import type { CampaignDocument } from "./Firestore";

export type OwnershipState = "unclaimed" | "claimed-by-you" | "claimed-by-other" | "locked";

export interface RecoveryLookupResult {
  campaignId: string;
  characterId: string;
  character: Character;
  campaign: CampaignDocument;
  ownership: OwnershipState;
}
