// src/services/chatService.ts

import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
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

export interface ChatExportFile {
  exportId: string;
  fileName: string;
  text: string;
  fingerprint: string;
  messageCount: number;
}

const callExportChat = httpsCallable<{ chatId: string; timeZone: string }, ChatExportFile>(
  functions,
  "exportChat"
);

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

/** Moves this account's copy of a chat to the bin. The other person's copy is untouched. */
export async function clearChat(accountId: string, chatId: string): Promise<void> {
  assertFirestoreDocumentId(accountId, "Account ID");
  assertFirestoreDocumentId(chatId, "Chat ID");
  await measurePerformanceMutation("chat:clear", () =>
    updateDoc(doc(db, "users", accountId, "chats", chatId), {
      clearedAt: serverTimestamp(),
      unreadCount: 0,
    })
  );
}

/** Takes this account's copy of a chat out of the bin, bringing its history back. */
export async function restoreChat(accountId: string, chatId: string): Promise<void> {
  assertFirestoreDocumentId(accountId, "Account ID");
  assertFirestoreDocumentId(chatId, "Chat ID");
  await measurePerformanceMutation("chat:restore", () =>
    updateDoc(doc(db, "users", accountId, "chats", chatId), { clearedAt: deleteField() })
  );
}

/** Asks the server for a text export of this account's copy of a chat, in the browser's time zone. */
export async function exportChat(chatId: string): Promise<ChatExportFile> {
  assertFirestoreDocumentId(chatId, "Chat ID");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return measurePerformanceMutation("chat:export", async () => {
    const result = await callExportChat({ chatId, timeZone });
    return result.data;
  });
}
