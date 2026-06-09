// tests/firestore/rules/messageRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign } from "../helpers";

// ── Test-local helpers ────────────────────────────────────────────────────────

async function createThread(
  env: RulesTestEnvironment,
  campaignId: string,
  playerUid: string
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection("campaigns").doc(campaignId)
      .collection("threads").doc(playerUid)
      .set({ playerUid, lastMessage: null, lastTimestamp: null, unreadForDM: 0 });
  });
}

async function createMessage(
  env: RulesTestEnvironment,
  campaignId: string,
  playerUid: string,
  messageId: string,
  fromUid: string = playerUid
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection("campaigns").doc(campaignId)
      .collection("threads").doc(playerUid)
      .collection("messages").doc(messageId)
      .set({ fromUid, text: "hello", timestamp: null, read: false });
  });
}

function messages(env: RulesTestEnvironment, uid: string, campaignId: string, playerUid: string) {
  return dbAs(env, uid)
    .collection("campaigns").doc(campaignId)
    .collection("threads").doc(playerUid)
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
    await createThread(env, "c1", "player-1");

    await expect(
      dbAs(env, "dm-1").collection("campaigns").doc("c1")
        .collection("threads").doc("player-1").get()
    ).resolves.toBeDefined();
  });

  it("player can read their own thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createThread(env, "c1", "player-1");

    await expect(
      dbAs(env, "player-1").collection("campaigns").doc("c1")
        .collection("threads").doc("player-1").get()
    ).resolves.toBeDefined();
  });

  it("player cannot read another player's thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createThread(env, "c1", "player-1");

    await expect(
      dbAs(env, "player-2").collection("campaigns").doc("c1")
        .collection("threads").doc("player-1").get()
    ).rejects.toThrow();
  });

  it("DM can delete a thread summary (clear chat)", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createThread(env, "c1", "player-1");

    await expect(
      dbAs(env, "dm-1").collection("campaigns").doc("c1")
        .collection("threads").doc("player-1").delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete a thread summary", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createThread(env, "c1", "player-1");

    await expect(
      dbAs(env, "player-1").collection("campaigns").doc("c1")
        .collection("threads").doc("player-1").delete()
    ).rejects.toThrow();
  });

  // ── Messages ──────────────────────────────────────────────────────────────

  it("player can create a message in their own thread with correct fromUid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    await expect(
      messages(env, "player-1", "c1", "player-1")
        .doc("msg-1")
        .set({ fromUid: "player-1", text: "Hello DM", timestamp: null, read: false })
    ).resolves.toBeUndefined();
  });

  it("player cannot create a message with a spoofed fromUid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    await expect(
      messages(env, "player-1", "c1", "player-1")
        .doc("msg-2")
        .set({ fromUid: "dm-1", text: "Spoofed", timestamp: null, read: false })
    ).rejects.toThrow();
  });

  it("player cannot create a message in another player's thread", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    await expect(
      messages(env, "player-2", "c1", "player-1")
        .doc("msg-3")
        .set({ fromUid: "player-2", text: "Sneaky", timestamp: null, read: false })
    ).rejects.toThrow();
  });

  it("DM can create a message in any thread", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    await expect(
      messages(env, "dm-1", "c1", "player-1")
        .doc("msg-4")
        .set({ fromUid: "dm-1", text: "Hello player", timestamp: null, read: false })
    ).resolves.toBeUndefined();
  });

  it("DM can delete a message (clear chat)", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createMessage(env, "c1", "player-1", "msg-1");

    await expect(
      messages(env, "dm-1", "c1", "player-1").doc("msg-1").delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createMessage(env, "c1", "player-1", "msg-1");

    await expect(
      messages(env, "player-1", "c1", "player-1").doc("msg-1").delete()
    ).rejects.toThrow();
  });

  it("DM cannot update a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createMessage(env, "c1", "player-1", "msg-1");

    await expect(
      messages(env, "dm-1", "c1", "player-1").doc("msg-1").update({ text: "Edited" })
    ).rejects.toThrow();
  });

  it("player cannot update a message", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createMessage(env, "c1", "player-1", "msg-1");

    await expect(
      messages(env, "player-1", "c1", "player-1").doc("msg-1").update({ text: "Edited" })
    ).rejects.toThrow();
  });
});
