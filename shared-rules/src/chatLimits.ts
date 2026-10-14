// shared-rules/src/chatLimits.ts
//
// Limits and identifiers shared by the browser and the chat functions.

export const CHAT_LIMITS = {
  messageCharacters: 2_000,
  previewCharacters: 500,
  binRetentionDays: 7,
} as const;

export function buildChatId(
  campaignId: string,
  characterId: string,
  playerAccountId: string
): string {
  return `${campaignId}__${characterId}__${playerAccountId}`;
}
