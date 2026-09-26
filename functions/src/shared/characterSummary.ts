// functions/src/shared/characterSummary.ts
//
// Server-side mirror of characterService.ts's computeCharacterSummary and
// touchesCharacterSummary — the restricted per-character summary record
// (campaigns/{campaignId}/characterSummaries/{characterId}) other campaign
// members can read. functions/ cannot import from src/, so this is
// deliberately duplicated and must be kept in sync by hand.

export interface CharacterSummaryFields {
  campaignId: string;
  characterName: string;
  playerName?: string;
  career?: string;
  rank?: string;
  portraitUrl?: string;
  userId?: string | null;
}

const SUMMARY_RELEVANT_FIELDS = new Set(["header", "portraitUrl"]);

export function isSummaryRelevantField(field: string): boolean {
  return SUMMARY_RELEVANT_FIELDS.has(field);
}

export function computeCharacterSummary(
  characterData: Record<string, unknown>,
  livePlayerName?: string | null
): CharacterSummaryFields {
  const header = (characterData.header ?? {}) as Record<string, unknown>;
  if (typeof characterData.campaignId !== "string") {
    throw new Error("Character data is missing a valid campaignId.");
  }
  if (typeof header.characterName !== "string") {
    throw new Error("Character data is missing a valid header.characterName.");
  }
  const summary: CharacterSummaryFields = {
    campaignId: characterData.campaignId,
    characterName: header.characterName,
  };
  const profileName = typeof livePlayerName === "string" ? livePlayerName.trim() : "";
  const storedName = typeof header.playerName === "string" ? header.playerName.trim() : "";
  const playerName = profileName || storedName;
  if (playerName) summary.playerName = playerName;
  if (typeof header.career === "string") summary.career = header.career;
  if (typeof header.rank === "string") summary.rank = header.rank;
  if (typeof characterData.portraitUrl === "string")
    summary.portraitUrl = characterData.portraitUrl;
  if (typeof characterData.userId === "string" || characterData.userId === null) {
    summary.userId = characterData.userId;
  }
  return summary;
}
