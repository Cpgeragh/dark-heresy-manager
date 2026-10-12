// shared-rules/src/characterSummary.ts
//
// The restricted per-character summary record
// (campaigns/{campaignId}/characterSummaries/{characterId}) that other campaign
// members can read. The browser and patchCharacterField both derive it here, so
// the two writers always produce the same fields.

export interface CharacterSummaryFields {
  campaignId: string;
  characterName: string;
  playerName?: string;
  career?: string;
  rank?: string;
  portraitUrl?: string;
  userId?: string | null;
}

export interface CharacterSummarySource {
  campaignId?: unknown;
  header?: unknown;
  portraitUrl?: unknown;
  userId?: unknown;
}

const SUMMARY_RELEVANT_FIELDS = new Set(["header", "portraitUrl"]);

export function isSummaryRelevantField(field: string): boolean {
  return SUMMARY_RELEVANT_FIELDS.has(field);
}

export function computeCharacterSummaryFields(
  character: CharacterSummarySource,
  livePlayerName?: string | null
): CharacterSummaryFields {
  const header = (character.header ?? {}) as Record<string, unknown>;
  if (typeof character.campaignId !== "string") {
    throw new Error("Character data is missing a valid campaignId.");
  }
  if (typeof header.characterName !== "string") {
    throw new Error("Character data is missing a valid header.characterName.");
  }
  const summary: CharacterSummaryFields = {
    campaignId: character.campaignId,
    characterName: header.characterName,
  };
  const profileName = typeof livePlayerName === "string" ? livePlayerName.trim() : "";
  const storedName = typeof header.playerName === "string" ? header.playerName.trim() : "";
  const playerName = profileName || storedName;
  if (playerName) summary.playerName = playerName;
  if (typeof header.career === "string") summary.career = header.career;
  if (typeof header.rank === "string") summary.rank = header.rank;
  if (typeof character.portraitUrl === "string") summary.portraitUrl = character.portraitUrl;
  if (typeof character.userId === "string" || character.userId === null) {
    summary.userId = character.userId;
  }
  return summary;
}
