// tests/functions/purgeBinnedChats.test.ts
//
// Runs the real scheduled function in the Functions emulator. Chats are seeded directly through
// the Admin SDK, the function is triggered with an HTTP request, and the result is read back from
// the Firestore emulator.
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

const FUNCTION_URL = "http://127.0.0.1:5001/dh-test/europe-west2/purgeBinnedChatsDaily-0";
const DAY = 24 * 60 * 60 * 1000;
const accountIds: string[] = [];

const daysAgo = (days: number) => Timestamp.fromMillis(Date.now() - days * DAY);

function chatRef(accountId: string, chatId: string) {
  return adminDb.doc(`users/${accountId}/chats/${chatId}`);
}

async function seedChat(
  accountId: string,
  chatId: string,
  clearedDaysAgo: number | null,
  messages: { id: string; daysAgo: number }[]
) {
  accountIds.push(accountId);
  await chatRef(accountId, chatId).set({
    characterName: "Kael",
    unreadCount: 0,
    ...(clearedDaysAgo === null ? {} : { clearedAt: daysAgo(clearedDaysAgo) }),
  });
  for (const message of messages) {
    await chatRef(accountId, chatId)
      .collection("messages")
      .doc(message.id)
      .set({ text: message.id, timestamp: daysAgo(message.daysAgo) });
  }
}

async function runPurge() {
  const response = await fetch(FUNCTION_URL, { method: "POST" });
  expect(response.ok).toBe(true);
}

describe("Functions: the daily purge of chats in the bin", () => {
  beforeAll(async () => {
    await runPurge();
  }, 30_000);

  afterEach(async () => {
    for (const accountId of accountIds.splice(0)) {
      await adminDb.recursiveDelete(adminDb.doc(`users/${accountId}`));
    }
  });

  it("deletes a chat that has been in the bin for more than 7 days, with its messages", async () => {
    await seedChat("purge-a", "chat-1", 8, [
      { id: "m1", daysAgo: 10 },
      { id: "m2", daysAgo: 9 },
    ]);

    await runPurge();

    expect((await chatRef("purge-a", "chat-1").get()).exists).toBe(false);
    const messages = await chatRef("purge-a", "chat-1").collection("messages").get();
    expect(messages.empty).toBe(true);
  });

  it("keeps a binned chat that has newer messages and removes its bin mark", async () => {
    await seedChat("purge-b", "chat-1", 8, [
      { id: "old", daysAgo: 9 },
      { id: "new", daysAgo: 2 },
    ]);

    await runPurge();

    const entry = await chatRef("purge-b", "chat-1").get();
    expect(entry.exists).toBe(true);
    expect(entry.get("clearedAt")).toBeUndefined();
    const remaining = await chatRef("purge-b", "chat-1").collection("messages").get();
    expect(remaining.docs.map((doc) => doc.id)).toEqual(["new"]);
  });

  it("leaves a chat that was deleted less than 7 days ago, and a chat never deleted, alone", async () => {
    await seedChat("purge-c", "recent", 3, [{ id: "m1", daysAgo: 4 }]);
    await seedChat("purge-c", "never", null, [{ id: "m1", daysAgo: 30 }]);

    await runPurge();

    for (const chatId of ["recent", "never"]) {
      expect((await chatRef("purge-c", chatId).get()).exists).toBe(true);
      const messages = await chatRef("purge-c", chatId).collection("messages").get();
      expect(messages.size).toBe(1);
    }
  });
});
