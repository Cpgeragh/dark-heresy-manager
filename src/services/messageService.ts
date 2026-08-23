// src/services/messageService.ts

import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { deleteQueryDocsInPages } from "../utils/firestoreQueryPages";

/**
 * Sends a message in a character-DM thread and updates the thread summary.
 * Thread is keyed by characterId — one thread per character, not per player.
 * Thread summary is created automatically on first message (setDoc + merge).
 * If sender is the player (isFromPlayer), increments unreadForDM on the summary.
 */
export async function sendMessage(
  campaignId: string,
  characterId: string,
  fromUid: string,
  text: string,
  isFromPlayer: boolean
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) throw new Error("Message cannot be empty.");
  if (trimmedText.length > PRODUCT_LIMITS.messageCharacters) {
    throw new Error(`Message cannot exceed ${PRODUCT_LIMITS.messageCharacters} characters.`);
  }

  const batch = writeBatch(db);

  const messagesRef = collection(db, "campaigns", campaignId, "threads", characterId, "messages");
  const messageRef = doc(messagesRef);

  batch.set(messageRef, {
    fromUid,
    text: trimmedText,
    timestamp: serverTimestamp(),
    read: false,
  });

  const threadRef = doc(db, "campaigns", campaignId, "threads", characterId);

  batch.set(
    threadRef,
    {
      characterId,
      lastMessage: trimmedText,
      lastTimestamp: serverTimestamp(),
      ...(isFromPlayer ? { unreadForDM: increment(1) } : {}),
    },
    { merge: true }
  );

  await batch.commit();
}

/**
 * Resets the unread counter on a thread — called when the DM opens a conversation.
 */
export async function markThreadRead(campaignId: string, characterId: string): Promise<void> {
  const threadRef = doc(db, "campaigns", campaignId, "threads", characterId);
  await updateDoc(threadRef, { unreadForDM: 0 });
}

/**
 * Deletes all messages in bounded pages and resets the thread summary only
 * after deletion completes. Retrying after an interruption is safe.
 */
export async function clearThread(campaignId: string, characterId: string): Promise<void> {
  const messagesRef = collection(db, "campaigns", campaignId, "threads", characterId, "messages");
  const threadRef = doc(db, "campaigns", campaignId, "threads", characterId);
  await deleteQueryDocsInPages(db, messagesRef);
  await setDoc(threadRef, {
    characterId,
    lastMessage: null,
    lastTimestamp: null,
    unreadForDM: 0,
  });
}
