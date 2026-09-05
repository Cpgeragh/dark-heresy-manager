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
}

const SUMMARY_RELEVANT_FIELDS = new Set(["header", "portraitUrl"]);

export function isSummaryRelevantField(field: string): boolean {
  return SUMMARY_RELEVANT_FIELDS.has(field);
}

export function computeCharacterSummary(
  characterData: Record<string, unknown>
): CharacterSummaryFields {
  const header = (characterData.header ?? {}) as Record<string, unknown>;
  const summary: CharacterSummaryFields = {
    campaignId: characterData.campaignId as string,
    characterName: header.characterName as string,
  };
  if (typeof header.playerName === "string") summary.playerName = header.playerName;
  if (typeof header.career === "string") summary.career = header.career;
  if (typeof header.rank === "string") summary.rank = header.rank;
  if (typeof characterData.portraitUrl === "string")
    summary.portraitUrl = characterData.portraitUrl;
  return summary;
}
