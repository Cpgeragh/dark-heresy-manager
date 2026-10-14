// functions/src/operations/purgeBinnedChats.ts
//
// Really deletes chats that have sat in their owner's bin for longer than the retention
// period. Each page of deletions runs in a transaction that first re-reads the chat entry, so a
// Restore, or a newer message, that happens while the job is working is never overwritten.

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { CHAT_LIMITS } from "shared-rules";

const DAY_MS = 24 * 60 * 60 * 1000;

export const PURGE_CHATS_PER_RUN = 100;
export const PURGE_MESSAGES_PER_RUN = 10_000;
export const PURGE_PAGE_SIZE = 400;

export interface PurgeLimits {
  chatsPerRun: number;
  messagesPerRun: number;
  pageSize: number;
}

export interface PurgeBinnedChatsResult {
  chatsProcessed: number;
  messagesDeleted: number;
  entriesDeleted: number;
  entriesReset: number;
  chatsSkipped: number;
  moreToDo: boolean;
}

type PurgeStep =
  | { kind: "skipped" }
  | { kind: "messages"; count: number }
  | { kind: "entry"; result: "deleted" | "reset" };

async function purgeStep(
  db: Firestore,
  chatRef: DocumentReference,
  expectedClearedAt: Timestamp,
  pageSize: number
): Promise<PurgeStep> {
  return db.runTransaction(async (transaction): Promise<PurgeStep> => {
    const entry = await transaction.get(chatRef);
    const clearedAt = entry.get("clearedAt") as Timestamp | undefined;
    if (!entry.exists || !clearedAt || !clearedAt.isEqual(expectedClearedAt)) {
      return { kind: "skipped" };
    }

    const messages = chatRef.collection("messages");
    const page = await transaction.get(
      messages.where("timestamp", "<=", expectedClearedAt).orderBy("timestamp").limit(pageSize)
    );
    if (!page.empty) {
      for (const message of page.docs) transaction.delete(message.ref);
      return { kind: "messages", count: page.size };
    }

    const newer = await transaction.get(messages.limit(1));
    if (newer.empty) {
      transaction.delete(chatRef);
      return { kind: "entry", result: "deleted" };
    }
    transaction.update(chatRef, { clearedAt: FieldValue.delete() });
    return { kind: "entry", result: "reset" };
  });
}

async function purgeChat(
  db: Firestore,
  chatRef: DocumentReference,
  expectedClearedAt: Timestamp,
  pageSize: number,
  budget: number
): Promise<{ messages: number; outcome: "deleted" | "reset" | "skipped" | "unfinished" }> {
  let messages = 0;
  while (messages < budget) {
    const step = await purgeStep(
      db,
      chatRef,
      expectedClearedAt,
      Math.min(pageSize, budget - messages)
    );
    if (step.kind === "skipped") return { messages, outcome: "skipped" };
    if (step.kind === "messages") {
      messages += step.count;
      continue;
    }
    return { messages, outcome: step.result };
  }
  return { messages, outcome: "unfinished" };
}

export async function purgeBinnedChats(
  db: Firestore,
  now: Date = new Date(),
  limits: Partial<PurgeLimits> = {}
): Promise<PurgeBinnedChatsResult> {
  const chatsPerRun = limits.chatsPerRun ?? PURGE_CHATS_PER_RUN;
  const messagesPerRun = limits.messagesPerRun ?? PURGE_MESSAGES_PER_RUN;
  const pageSize = limits.pageSize ?? PURGE_PAGE_SIZE;
  const cutoff = Timestamp.fromMillis(now.getTime() - CHAT_LIMITS.binRetentionDays * DAY_MS);

  const due = await db
    .collectionGroup("chats")
    .where("clearedAt", "<=", cutoff)
    .orderBy("clearedAt")
    .limit(chatsPerRun)
    .get();

  const result: PurgeBinnedChatsResult = {
    chatsProcessed: 0,
    messagesDeleted: 0,
    entriesDeleted: 0,
    entriesReset: 0,
    chatsSkipped: 0,
    moreToDo: due.size === chatsPerRun,
  };

  for (const snapshot of due.docs) {
    if (result.messagesDeleted >= messagesPerRun) {
      result.moreToDo = true;
      break;
    }
    const clearedAt = snapshot.get("clearedAt") as Timestamp;
    const outcome = await purgeChat(
      db,
      snapshot.ref,
      clearedAt,
      pageSize,
      messagesPerRun - result.messagesDeleted
    );
    result.chatsProcessed += 1;
    result.messagesDeleted += outcome.messages;
    if (outcome.outcome === "deleted") result.entriesDeleted += 1;
    if (outcome.outcome === "reset") result.entriesReset += 1;
    if (outcome.outcome === "skipped") result.chatsSkipped += 1;
    if (outcome.outcome === "unfinished") result.moreToDo = true;
  }

  return result;
}
