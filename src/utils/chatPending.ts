// src/utils/chatPending.ts
//
// A message the person has just sent shows in their own conversation at once, before the server
// has stored it. It is dimmed until the real message arrives.

import { Timestamp } from "firebase/firestore";
import type { ChatMessage } from "../types/Firestore";

export interface PendingChatMessage {
  localId: string;
  text: string;
  sentAt: number;
  /** The id the server gave the message, once the send call has returned. */
  serverId: string | null;
}

const PENDING_PREFIX = "pending:";

export function pendingToMessage(pending: PendingChatMessage, accountId: string): ChatMessage {
  return {
    id: `${PENDING_PREFIX}${pending.localId}`,
    fromAccountId: accountId,
    text: pending.text,
    timestamp: Timestamp.fromMillis(pending.sentAt),
  };
}

export function isPendingMessage(message: ChatMessage): boolean {
  return message.id.startsWith(PENDING_PREFIX);
}
