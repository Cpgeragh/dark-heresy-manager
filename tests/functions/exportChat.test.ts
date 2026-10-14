// tests/functions/exportChat.test.ts
//
// Calls the real exportChat callable in the Functions emulator as real signed-in users.
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { deleteApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { createIndependentClient } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

type Client = Awaited<ReturnType<typeof createIndependentClient>>;

const clients: Client[] = [];
let clientCounter = 0;

async function newClient(): Promise<Client> {
  clientCounter += 1;
  const client = await createIndependentClient(`export-client-${Date.now()}-${clientCounter}`);
  clients.push(client);
  return client;
}

interface ExportResult {
  exportId: string;
  fileName: string;
  text: string;
  fingerprint: string;
  messageCount: number;
}

function exportChat(client: Client, chatId: string, timeZone: string) {
  return httpsCallable<{ chatId: string; timeZone: string }, ExportResult>(
    client.functions,
    "exportChat"
  )({ chatId, timeZone });
}

const CHAT_ID = "campaign-1__char-1__player-1";

async function seedDmChat(dm: Client) {
  await adminDb.doc(`userProfiles/${dm.uid}`).set({ firstName: "Marcus" });
  const chatRef = adminDb.doc(`users/${dm.uid}/chats/${CHAT_ID}`);
  await chatRef.set({
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    characterName: "Brother Kael",
    campaignName: "Calixis",
    unreadCount: 0,
  });
  await chatRef
    .collection("messages")
    .doc("m1")
    .set({
      fromAccountId: dm.uid,
      text: "Hello Anna",
      timestamp: Timestamp.fromDate(new Date(Date.UTC(2026, 9, 14, 22, 30))),
    });
  await chatRef
    .collection("messages")
    .doc("m2")
    .set({
      fromAccountId: "player-1",
      text: "Hi Marcus",
      timestamp: Timestamp.fromDate(new Date(Date.UTC(2026, 9, 14, 22, 31))),
    });
}

describe("Functions: exportChat", () => {
  afterAll(async () => {
    await Promise.all(clients.map((client) => deleteApp(client.app)));
  });

  it("exports the caller's own copy in their time zone and keeps a receipt", async () => {
    const dm = await newClient();
    await seedDmChat(dm);

    const result = (await exportChat(dm, CHAT_ID, "Europe/London")).data;

    expect(result.messageCount).toBe(2);
    expect(result.fileName).toMatch(/^brother-kael-chat-\d{4}-\d{2}-\d{2}\.txt$/);
    expect(result.text).toContain("Participants: Marcus (DM) and Anna (Player)");
    expect(result.text).toContain("[14 October 2026, 23:30] Marcus (DM): Hello Anna");
    expect(result.text).toContain("[14 October 2026, 23:31] Anna (Player): Hi Marcus");
    expect(result.text).toContain(
      `Fingerprint (SHA-256 of the message lines below): ${result.fingerprint}`
    );

    const receipt = await adminDb.doc(`users/${dm.uid}/exportReceipts/${result.exportId}`).get();
    expect(receipt.exists).toBe(true);
    expect(receipt.get("fingerprint")).toBe(result.fingerprint);
    expect(receipt.get("chatId")).toBe(CHAT_ID);
    expect(JSON.stringify(receipt.data())).not.toContain("Hello Anna");
  }, 30_000);

  it("does not export a chat that belongs to someone else's account", async () => {
    const dm = await newClient();
    await seedDmChat(dm);
    const stranger = await newClient();

    await expect(exportChat(stranger, CHAT_ID, "UTC")).rejects.toMatchObject({
      code: "functions/not-found",
    });
  });

  it("refuses a time zone that does not exist", async () => {
    const dm = await newClient();
    await seedDmChat(dm);

    await expect(exportChat(dm, CHAT_ID, "Not/AZone")).rejects.toMatchObject({
      code: "functions/invalid-argument",
    });
  });

  it("stops the eleventh export within an hour", async () => {
    const dm = await newClient();
    await seedDmChat(dm);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await exportChat(dm, CHAT_ID, "UTC");
    }

    await expect(exportChat(dm, CHAT_ID, "UTC")).rejects.toMatchObject({
      code: "functions/resource-exhausted",
    });
  }, 60_000);
});
