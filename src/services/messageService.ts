// src/services/messageService.ts

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Sends a message in a player-DM thread and updates the thread summary.
 * Thread summary is created automatically on first message (setDoc + merge).
 * If sender is the player, increments unreadForDM on the summary.
 */
export async function sendMessage(
  campaignId: string,
  playerUid: string,
  fromUid: string,
  text: string
): Promise<void> {
  const batch = writeBatch(db);

  const messagesRef = collection(db, "campaigns", campaignId, "threads", playerUid, "messages");
  const messageRef = doc(messagesRef);

  batch.set(messageRef, {
    fromUid,
    text: text.trim(),
    timestamp: serverTimestamp(),
    read: false,
  });

  const threadRef = doc(db, "campaigns", campaignId, "threads", playerUid);
  const isFromPlayer = fromUid === playerUid;

  batch.set(
    threadRef,
    {
      playerUid,
      lastMessage: text.trim(),
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
export async function markThreadRead(
  campaignId: string,
  playerUid: string
): Promise<void> {
  const threadRef = doc(db, "campaigns", campaignId, "threads", playerUid);
  await updateDoc(threadRef, { unreadForDM: 0 });
}

/**
 * Deletes all messages in a thread and resets the thread summary.
 * Splits into chunks of 499 to stay under Firestore's 500-op batch limit.
 */
export async function clearThread(
  campaignId: string,
  playerUid: string
): Promise<void> {
  const messagesRef = collection(
    db, "campaigns", campaignId, "threads", playerUid, "messages"
  );
  const snap = await getDocs(messagesRef);
  const docs = snap.docs;
  const threadRef = doc(db, "campaigns", campaignId, "threads", playerUid);

  const CHUNK = 499; // leave 1 slot for the summary reset in the final batch

  if (docs.length === 0) {
    // No messages — just reset the summary
    await setDoc(threadRef, {
      playerUid,
      lastMessage: null,
      lastTimestamp: null,
      unreadForDM: 0,
    });
    return;
  }

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));

    // Reset summary on the final batch
    if (i + CHUNK >= docs.length) {
      batch.set(threadRef, {
        playerUid,
        lastMessage: null,
        lastTimestamp: null,
        unreadForDM: 0,
      });
    }

    await batch.commit();
  }
}
