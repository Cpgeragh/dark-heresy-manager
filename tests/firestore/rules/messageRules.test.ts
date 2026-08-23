// tests/firestore/rules/messageRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

// ── Test-local helpers ────────────────────────────────────────────────────────

async function createThread(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  overrides: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection("campaigns").doc(campaignId)
      .collection("threads").doc(characterId)
      .set({
        characterId,
        lastMessage: null,
        lastTimestamp: null,
        unreadForDM: 0,
        ...overrides,
      });
  });
}

async function createMessage(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  messageId: string,
  fromUid: string
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection("campaigns").doc(campaignId)
      .collection("threads").doc(characterId)
      .collection("messages").doc(messageId)
      .set({ fromUid, text: "hello", timestamp: null, read: false });
  });
}

function messages(env: RulesTestEnvironment, uid: string, campaignId: string, characterId: string) {
  return dbAs(env, uid)
    .collection("campaigns").doc(campaignId)
    .collection("threads").doc(characterId)
    .collection("messages");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Firestore Rules: Messages", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  // ── Thread summaries ──────────────────────────────────────────────────────

  it("DM can read any thread summary in their campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "dm-1").collection("campaigns").doc("c1")
        .collection("threads").doc("char-1").get()
    ).resolves.toBeDefined();
  });

  it("player can read their own character's thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "player-1").collection("campaigns").doc("c1")
        .collection("threads").doc("char-1").get()
    ).resolves.toBeDefined();
  });

  it("player cannot read another player's character thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "player-2").collection("campaigns").doc("c1")
        .collection("threads").doc("char-1").get()
    ).rejects.toThrow();
  });

  it("DM can delete a thread summary (clear chat)", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "dm-1").collection("campaigns").doc("c1")
        .collection("threads").doc("char-1").delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete a thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "player-1").collection("campaigns").doc("c1")
        .collection("threads").doc("char-1").delete()
    ).rejects.toThrow();
  });

  it("requires bounded thread-summary queries", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    const threads = dbAs(env, "dm-1").collection("campaigns/c1/threads");
    await expect(threads.limit(100).get()).resolves.toBeDefined();
    await expect(threads.get()).rejects.toThrow();
    await expect(threads.limit(101).get()).rejects.toThrow();
  });

  it("allows only a complete player summary transition with one unread increment", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    const thread = dbAs(env, "player-1").collection("campaigns/c1/threads").doc("char-1");
    await expect(thread.update({
      lastMessage: "Hello DM",
      lastTimestamp: new Date(),
      unreadForDM: 1,
    })).resolves.toBeUndefined();
    await expect(thread.update({ unreadForDM: 2 })).rejects.toThrow();
  });

  it("restricts DM summary writes to reply, mark-read, and clear transitions", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1", {
      lastMessage: "Player message",
      lastTimestamp: new Date(),
      unreadForDM: 2,
    });

    const thread = dbAs(env, "dm-1").collection("campaigns/c1/threads").doc("char-1");
    await expect(thread.update({ unreadForDM: 0 })).resolves.toBeUndefined();
    await expect(thread.update({
      lastMessage: "DM reply",
      lastTimestamp: new Date(),
    })).resolves.toBeUndefined();
    await expect(thread.update({ unreadForDM: 500 })).rejects.toThrow();
    await expect(thread.update({
      lastMessage: null,
      lastTimestamp: null,
      unreadForDM: 0,
    })).resolves.toBeUndefined();
  });

  it("rejects oversized previews and unexpected thread-summary fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    const thread = dbAs(env, "player-1").collection("campaigns/c1/threads").doc("char-1");

    await expect(thread.set({
      characterId: "char-1",
      lastMessage: "x".repeat(501),
      lastTimestamp: new Date(),
      unreadForDM: 1,
    })).rejects.toThrow();
    await expect(thread.set({
      characterId: "char-1",
      lastMessage: "Hello",
      lastTimestamp: new Date(),
      unreadForDM: 1,
      unexpected: true,
    })).rejects.toThrow();
  });

  // ── Messages ──────────────────────────────────────────────────────────────

  it("requires bounded message queries", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createMessage(env, "c1", "char-1", "msg-1", "player-1");

    const playerMessages = messages(env, "player-1", "c1", "char-1");
    await expect(playerMessages.limit(100).get()).resolves.toBeDefined();
    await expect(playerMessages.get()).rejects.toThrow();
    await expect(playerMessages.limit(101).get()).rejects.toThrow();
  });

  it("player can create a message in their own character's thread with correct fromUid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    await expect(
      messages(env, "player-1", "c1", "char-1")
        .doc("msg-1")
        .set({ fromUid: "player-1", text: "Hello DM", timestamp: null, read: false })
    ).resolves.toBeUndefined();
  });

  it("player cannot create a message with a spoofed fromUid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    await expect(
      messages(env, "player-1", "c1", "char-1")
        .doc("msg-2")
        .set({ fromUid: "dm-1", text: "Spoofed", timestamp: null, read: false })
    ).rejects.toThrow();
  });

  it("player cannot create a message in another player's character thread", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    await expect(
      messages(env, "player-2", "c1", "char-1")
        .doc("msg-3")
        .set({ fromUid: "player-2", text: "Sneaky", timestamp: null, read: false })
    ).rejects.toThrow();
  });

  it("DM can create a message in any character's thread", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    await expect(
      messages(env, "dm-1", "c1", "char-1")
        .doc("msg-4")
        .set({ fromUid: "dm-1", text: "Hello player", timestamp: null, read: false })
    ).resolves.toBeUndefined();
  });

  it("rejects an empty or oversized message", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });

    const playerMessages = messages(env, "player-1", "c1", "char-1");
    await expect(
      playerMessages
        .doc("msg-empty")
        .set({ fromUid: "player-1", text: "", timestamp: null, read: false })
    ).rejects.toThrow();
    await expect(
      playerMessages.doc("msg-large").set({
        fromUid: "player-1",
        text: "x".repeat(2_001),
        timestamp: null,
        read: false,
      })
    ).rejects.toThrow();
    await expect(
      playerMessages.doc("msg-extra").set({
        fromUid: "player-1",
        text: "Hello",
        timestamp: null,
        read: false,
        unexpected: true,
      })
    ).rejects.toThrow();
  });

  it("player cannot reset or arbitrarily change the DM unread counter", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createThread(env, "c1", "char-1");

    await expect(
      dbAs(env, "player-1")
        .collection("campaigns/c1/threads")
        .doc("char-1")
        .update({ unreadForDM: 500 })
    ).rejects.toThrow();
  });

  it("DM can delete a message (clear chat)", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createMessage(env, "c1", "char-1", "msg-1", "player-1");

    await expect(
      messages(env, "dm-1", "c1", "char-1").doc("msg-1").delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createMessage(env, "c1", "char-1", "msg-1", "player-1");

    await expect(
      messages(env, "player-1", "c1", "char-1").doc("msg-1").delete()
    ).rejects.toThrow();
  });

  it("DM cannot update a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createMessage(env, "c1", "char-1", "msg-1", "player-1");

    await expect(
      messages(env, "dm-1", "c1", "char-1").doc("msg-1").update({ text: "Edited" })
    ).rejects.toThrow();
  });

  it("player cannot update a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: "player-1" });
    await createMessage(env, "c1", "char-1", "msg-1", "player-1");

    await expect(
      messages(env, "player-1", "c1", "char-1").doc("msg-1").update({ text: "Edited" })
    ).rejects.toThrow();
  });
});
