// src/components/chat/chatTarget.ts

import { buildChatId } from "shared-rules";

export interface ChatTarget {
  campaignId: string;
  characterId: string;
  playerAccountId: string | null;
  characterName?: string;
}

export function getChatId(target: ChatTarget): string | null {
  return target.playerAccountId
    ? buildChatId(target.campaignId, target.characterId, target.playerAccountId)
    : null;
}
