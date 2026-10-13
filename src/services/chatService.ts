// src/services/chatService.ts

import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CHAT_LIMITS } from "shared-rules";
import { db, functions } from "../firebase";
import { assertFirestoreDocumentId } from "../firestore/firebaseValidation";
import { runSingleFlight } from "../firestore/singleFlight";
import { measurePerformanceMutation } from "../performance/performanceMetrics";
import { createLocalId } from "../utils/createLocalId";

const callSendChatMessage = httpsCallable<
  { campaignId: string; characterId: string; text: string; operationId: string },
  { chatId: string; messageId: string }
>(functions, "sendChatMessage");

export async function sendChatMessage(
  campaignId: string,
  characterId: string,
  text: string
): Promise<{ chatId: string; messageId: string }> {
  assertFirestoreDocumentId(campaignId, "Campaign ID");
  assertFirestoreDocumentId(characterId, "Character ID");
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");
  if (trimmed.length > CHAT_LIMITS.messageCharacters) {
    throw new Error(`Message cannot exceed ${CHAT_LIMITS.messageCharacters} characters.`);
  }

  return measurePerformanceMutation("chat:send", () =>
    runSingleFlight("chat:send", [campaignId, characterId, trimmed], async () => {
      const result = await callSendChatMessage({
        campaignId,
        characterId,
        text: trimmed,
        operationId: createLocalId("send-chat-message"),
      });
      return result.data;
    })
  );
}

/** Sets this account's own unread count on a chat to zero. */
export async function markChatRead(
  accountId: string,
  chatId: string,
  unreadCount: number
): Promise<void> {
  assertFirestoreDocumentId(accountId, "Account ID");
  assertFirestoreDocumentId(chatId, "Chat ID");
  if (!Number.isInteger(unreadCount) || unreadCount < 0) {
    throw new Error("Unread count must be a non-negative whole number.");
  }
  if (unreadCount === 0) return;
  await measurePerformanceMutation("chat:mark-read", () =>
    updateDoc(doc(db, "users", accountId, "chats", chatId), { unreadCount: 0 })
  );
}
