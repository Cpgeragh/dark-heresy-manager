// tests/functions/sendChatMessage.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { deleteApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore, type DocumentReference } from "firebase-admin/firestore";
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
  const client = await createIndependentClient(`chat-client-${Date.now()}-${clientCounter}`);
  clients.push(client);
  return client;
}

interface SendData {
  campaignId: string;
  characterId: string;
  text: string;
  operationId?: string;
}

function send(
  client: Client,
  campaignId: string,
  characterId: string,
  text: string,
  operationId?: string
) {
  const call = httpsCallable<SendData, { chatId: string; messageId: string }>(
    client.functions,
    "sendChatMessage"
  );
  return call({ campaignId, characterId, text, ...(operationId ? { operationId } : {}) });
}

function release(client: Client, campaignId: string, characterId: string) {
  return httpsCallable<{ campaignId: string; characterId: string }, void>(
    client.functions,
    "releaseCharacter"
  )({ campaignId, characterId });
}

function forceRelease(client: Client, campaignId: string, characterId: string) {
  return httpsCallable<{ campaignId: string; characterId: string }, void>(
    client.functions,
    "forceReleaseCharacter"
  )({ campaignId, characterId });
}

async function seedScenario(options: { claimed?: boolean } = {}) {
  const dm = await newClient();
  const player = await newClient();
  const campaignRef = adminDb.collection("campaigns").doc();
  const characterRef = campaignRef.collection("characters").doc();
  await campaignRef.set({ dmId: dm.uid, name: "Blood Ravens", memberIds: [player.uid] });
  await characterRef.set({
    campaignId: campaignRef.id,
    userId: options.claimed === false ? null : player.uid,
    header: { characterName: "Corvus" },
  });
  await adminDb.collection("userProfiles").doc(dm.uid).set({ firstName: "Dana" });
  await adminDb.collection("userProfiles").doc(player.uid).set({ firstName: "Alex" });
  const chatId = `${campaignRef.id}__${characterRef.id}__${player.uid}`;
  return {
    dm,
    player,
    campaignRef,
    characterRef,
    chatId,
    chat: (accountId: string) => adminDb.doc(`users/${accountId}/chats/${chatId}`),
  };
}

async function messageTexts(chat: DocumentReference): Promise<string[]> {
  const snapshot = await chat.collection("messages").get();
  return snapshot.docs.map((doc) => doc.data().text as string);
}

describe("Functions: chats", () => {
  afterAll(async () => {
    await Promise.all(clients.map((client) => deleteApp(client.app)));
  });

  it("a DM message reaches both copies and counts as unread for the player only", async () => {
    const s = await seedScenario();

    const { data } = await send(
      s.dm,
      s.campaignRef.id,
      s.characterRef.id,
      "Welcome to the campaign"
    );

    expect(data.chatId).toBe(s.chatId);
    const dmCopy = (await s.chat(s.dm.uid).get()).data();
    const playerCopy = (await s.chat(s.player.uid).get()).data();
    expect(Object.keys(dmCopy ?? {}).sort()).toEqual([
      "campaignId",
      "campaignName",
      "characterId",
      "characterName",
      "closed",
      "lastMessage",
      "lastTimestamp",
      "otherAccountId",
      "otherName",
      "playerAccountId",
      "role",
      "unreadCount",
    ]);
    expect(dmCopy).toMatchObject({
      role: "dm",
      otherAccountId: s.player.uid,
      otherName: "Alex",
      campaignName: "Blood Ravens",
      characterName: "Corvus",
      lastMessage: "Welcome to the campaign",
      unreadCount: 0,
      closed: false,
    });
    expect(playerCopy).toMatchObject({
      role: "player",
      otherAccountId: s.dm.uid,
      otherName: "Dana",
      unreadCount: 1,
      closed: false,
    });

    const dmMessage = await s.chat(s.dm.uid).collection("messages").doc(data.messageId).get();
    const playerMessage = await s
      .chat(s.player.uid)
      .collection("messages")
      .doc(data.messageId)
      .get();
    expect(dmMessage.data()).toMatchObject({
      fromAccountId: s.dm.uid,
      text: "Welcome to the campaign",
    });
    expect(playerMessage.data()?.text).toBe("Welcome to the campaign");
    expect(dmMessage.data()?.timestamp.isEqual(playerMessage.data()?.timestamp)).toBe(true);
    expect((await s.campaignRef.collection("threads").get()).empty).toBe(true);
  }, 30000);

  it("a player reply raises the DM's unread count and leaves the player's unchanged", async () => {
    const s = await seedScenario();
    await send(s.dm, s.campaignRef.id, s.characterRef.id, "Welcome");

    await send(s.player, s.campaignRef.id, s.characterRef.id, "Reporting in");

    expect((await s.chat(s.dm.uid).get()).data()).toMatchObject({
      unreadCount: 1,
      lastMessage: "Reporting in",
    });
    expect((await s.chat(s.player.uid).get()).data()).toMatchObject({
      unreadCount: 1,
      lastMessage: "Reporting in",
    });
    expect(await messageTexts(s.chat(s.dm.uid))).toHaveLength(2);
    expect(await messageTexts(s.chat(s.player.uid))).toHaveLength(2);
  }, 30000);

  it("a device linked to the player sends as the player's account", async () => {
    const s = await seedScenario();
    const device = await newClient();
    await adminDb
      .collection("userLinks")
      .doc(device.uid)
      .set({ primaryUid: s.player.uid, linkedAt: 1 });

    const { data } = await send(device, s.campaignRef.id, s.characterRef.id, "From my phone");

    expect(data.chatId).toBe(s.chatId);
    const message = await s.chat(s.dm.uid).collection("messages").doc(data.messageId).get();
    expect(message.data()?.fromAccountId).toBe(s.player.uid);
    expect((await s.chat(s.dm.uid).get()).data()?.unreadCount).toBe(1);
  }, 30000);

  it("refuses strangers, unclaimed characters, empty text and over-long text without writing anything", async () => {
    const s = await seedScenario();
    const stranger = await newClient();

    await expect(
      send(stranger, s.campaignRef.id, s.characterRef.id, "hello")
    ).rejects.toMatchObject({
      code: "functions/permission-denied",
    });
    await expect(send(s.dm, s.campaignRef.id, s.characterRef.id, "")).rejects.toMatchObject({
      code: "functions/invalid-argument",
    });
    await expect(
      send(s.dm, s.campaignRef.id, s.characterRef.id, "a".repeat(2001))
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
    expect((await s.chat(s.dm.uid).get()).exists).toBe(false);
    expect((await s.chat(s.player.uid).get()).exists).toBe(false);

    const unclaimed = await seedScenario({ claimed: false });
    await expect(
      send(unclaimed.dm, unclaimed.campaignRef.id, unclaimed.characterRef.id, "anyone there?")
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });
    expect((await unclaimed.chat(unclaimed.dm.uid).get()).exists).toBe(false);
  }, 60000);

  it("a repeated send with the same operation id writes one message", async () => {
    const s = await seedScenario();

    const first = await send(s.dm, s.campaignRef.id, s.characterRef.id, "Once only", "op-1");
    const second = await send(s.dm, s.campaignRef.id, s.characterRef.id, "Once only", "op-1");

    expect(second.data).toEqual(first.data);
    expect(await messageTexts(s.chat(s.dm.uid))).toEqual(["Once only"]);
    expect(await messageTexts(s.chat(s.player.uid))).toEqual(["Once only"]);
  }, 30000);

  it("a player release closes both copies, keeps every message and stops further sends", async () => {
    const s = await seedScenario();
    await send(s.dm, s.campaignRef.id, s.characterRef.id, "Welcome");
    await send(s.player, s.campaignRef.id, s.characterRef.id, "Reporting in");

    await release(s.player, s.campaignRef.id, s.characterRef.id);

    expect((await s.chat(s.dm.uid).get()).data()?.closed).toBe(true);
    expect((await s.chat(s.player.uid).get()).data()?.closed).toBe(true);
    expect(await messageTexts(s.chat(s.dm.uid))).toHaveLength(2);
    expect(await messageTexts(s.chat(s.player.uid))).toHaveLength(2);
    await expect(
      send(s.player, s.campaignRef.id, s.characterRef.id, "still here?")
    ).rejects.toMatchObject({ code: "functions/permission-denied" });
    await expect(send(s.dm, s.campaignRef.id, s.characterRef.id, "hello?")).rejects.toMatchObject({
      code: "functions/failed-precondition",
    });
  }, 40000);

  it("a release before any message creates no chat", async () => {
    const s = await seedScenario();

    await release(s.player, s.campaignRef.id, s.characterRef.id);

    expect((await s.chat(s.dm.uid).get()).exists).toBe(false);
    expect((await s.chat(s.player.uid).get()).exists).toBe(false);
  }, 30000);

  it("a DM force release closes both copies", async () => {
    const s = await seedScenario();
    await send(s.dm, s.campaignRef.id, s.characterRef.id, "Welcome");

    await forceRelease(s.dm, s.campaignRef.id, s.characterRef.id);

    expect((await s.chat(s.dm.uid).get()).data()?.closed).toBe(true);
    expect((await s.chat(s.player.uid).get()).data()?.closed).toBe(true);
  }, 30000);

  describe.each([
    ["an existing chat", true],
    ["no chat yet", false],
  ])("a message sent at the same instant as a release, with %s", (_label, chatExists) => {
    it("never leaves an open chat on a released character", async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const s = await seedScenario();
        if (chatExists) await send(s.dm, s.campaignRef.id, s.characterRef.id, "hello");

        const [sent, released] = await Promise.allSettled([
          send(s.player, s.campaignRef.id, s.characterRef.id, "last words"),
          release(s.player, s.campaignRef.id, s.characterRef.id),
        ]);

        expect(released.status).toBe("fulfilled");
        expect((await s.characterRef.get()).data()?.userId).toBeNull();
        for (const accountId of [s.dm.uid, s.player.uid]) {
          const copy = await s.chat(accountId).get();
          if (copy.exists) expect(copy.data()?.closed).toBe(true);
        }
        if (sent.status === "fulfilled") {
          expect(await messageTexts(s.chat(s.dm.uid))).toContain("last words");
          expect(await messageTexts(s.chat(s.player.uid))).toContain("last words");
        } else {
          expect(sent.reason).toMatchObject({ code: "functions/permission-denied" });
          expect(await messageTexts(s.chat(s.dm.uid))).not.toContain("last words");
        }
      }
    }, 90000);
  });
});
