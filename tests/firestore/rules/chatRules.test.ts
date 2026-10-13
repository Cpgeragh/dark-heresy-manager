// tests/firestore/rules/chatRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { dbAs, dbAnon } from "../helpers";

const CHAT_ID = "c1__char-1__player-1";

function chatData(accountId: string) {
  const isDm = accountId === "dm-1";
  return {
    campaignId: "c1",
    characterId: "char-1",
    playerAccountId: "player-1",
    role: isDm ? "dm" : "player",
    otherAccountId: isDm ? "player-1" : "dm-1",
    otherName: "Alex",
    campaignName: "Blood Ravens",
    characterName: "Corvus",
    lastMessage: "hello",
    lastTimestamp: null,
    unreadCount: 2,
    closed: false,
  };
}

async function seedChat(env: RulesTestEnvironment, accountId: string) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    const chat = ctx.firestore().doc(`users/${accountId}/chats/${CHAT_ID}`);
    await chat.set(chatData(accountId));
    await chat
      .collection("messages")
      .doc("m1")
      .set({ fromAccountId: "dm-1", text: "hello", timestamp: null });
  });
}

async function linkDevice(env: RulesTestEnvironment, deviceUid: string, primaryUid: string) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("userLinks").doc(deviceUid).set({ primaryUid, linkedAt: 1 });
  });
}

function chatDoc(env: RulesTestEnvironment, uid: string, accountId: string) {
  return dbAs(env, uid).doc(`users/${accountId}/chats/${CHAT_ID}`);
}

function chatMessages(env: RulesTestEnvironment, uid: string, accountId: string) {
  return dbAs(env, uid).collection(`users/${accountId}/chats/${CHAT_ID}/messages`);
}

describe("Firestore Rules: Chats", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("the owner can read their chat and its messages", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(chatDoc(env, "player-1", "player-1").get()).resolves.toBeDefined();
    await expect(chatMessages(env, "player-1", "player-1").limit(100).get()).resolves.toBeDefined();
  });

  it("chat and message lists need a bounded limit", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");
    const chats = dbAs(env, "player-1").collection("users/player-1/chats");
    const messages = chatMessages(env, "player-1", "player-1");

    await expect(chats.limit(200).get()).resolves.toBeDefined();
    await expect(chats.get()).rejects.toThrow();
    await expect(chats.limit(201).get()).rejects.toThrow();
    await expect(messages.get()).rejects.toThrow();
    await expect(messages.limit(101).get()).rejects.toThrow();
  });

  it("the other participant cannot read the owner's copy, in either direction", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");
    await seedChat(env, "dm-1");

    await expect(chatDoc(env, "dm-1", "player-1").get()).rejects.toThrow();
    await expect(chatMessages(env, "dm-1", "player-1").limit(100).get()).rejects.toThrow();
    await expect(chatDoc(env, "player-1", "dm-1").get()).rejects.toThrow();
    await expect(chatMessages(env, "player-1", "dm-1").limit(100).get()).rejects.toThrow();
  });

  it("an anonymous visitor cannot read a chat", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(dbAnon(env).doc(`users/player-1/chats/${CHAT_ID}`).get()).rejects.toThrow();
  });

  it("a device linked to the owner can read and delete the copy", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");
    await linkDevice(env, "device-1", "player-1");

    await expect(chatDoc(env, "device-1", "player-1").get()).resolves.toBeDefined();
    await expect(chatMessages(env, "device-1", "player-1").limit(100).get()).resolves.toBeDefined();
    await expect(chatDoc(env, "device-1", "player-1").delete()).resolves.toBeUndefined();
  });

  it("a device linked to someone else cannot read the copy", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");
    await linkDevice(env, "device-2", "someone-else");

    await expect(chatDoc(env, "device-2", "player-1").get()).rejects.toThrow();
  });

  it("nobody can create a chat or a message from the browser", async () => {
    const env = await getTestEnv();

    await expect(chatDoc(env, "player-1", "player-1").set(chatData("player-1"))).rejects.toThrow();
    await expect(chatDoc(env, "dm-1", "player-1").set(chatData("player-1"))).rejects.toThrow();
    await expect(
      dbAnon(env).doc(`users/player-1/chats/${CHAT_ID}`).set(chatData("player-1"))
    ).rejects.toThrow();

    await seedChat(env, "player-1");
    const message = { fromAccountId: "player-1", text: "hi", timestamp: null };
    await expect(
      chatMessages(env, "player-1", "player-1").doc("m2").set(message)
    ).rejects.toThrow();
    await expect(chatMessages(env, "dm-1", "player-1").doc("m2").set(message)).rejects.toThrow();
    await expect(
      dbAnon(env).collection(`users/player-1/chats/${CHAT_ID}/messages`).doc("m2").set(message)
    ).rejects.toThrow();
  });

  it("the owner can clear their unread count", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(
      chatDoc(env, "player-1", "player-1").update({ unreadCount: 0 })
    ).resolves.toBeUndefined();
  });

  it("the owner cannot raise the unread count or change other fields", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");
    const chat = chatDoc(env, "player-1", "player-1");

    await expect(chat.update({ unreadCount: 5 })).rejects.toThrow();
    await expect(chat.update({ unreadCount: 3 })).rejects.toThrow();
    await expect(chat.update({ lastMessage: "edited" })).rejects.toThrow();
    await expect(chat.update({ closed: true })).rejects.toThrow();
    await expect(chat.update({ unreadCount: 0, lastMessage: "edited" })).rejects.toThrow();
  });

  it("the other participant cannot touch the unread count", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(chatDoc(env, "dm-1", "player-1").update({ unreadCount: 0 })).rejects.toThrow();
  });

  it("the owner can delete their own copy and its messages", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(
      chatMessages(env, "player-1", "player-1").doc("m1").delete()
    ).resolves.toBeUndefined();
    await expect(chatDoc(env, "player-1", "player-1").delete()).resolves.toBeUndefined();
  });

  it("the other participant cannot delete the owner's copy", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(chatDoc(env, "dm-1", "player-1").delete()).rejects.toThrow();
    await expect(chatMessages(env, "dm-1", "player-1").doc("m1").delete()).rejects.toThrow();
  });

  it("nobody can edit a message", async () => {
    const env = await getTestEnv();
    await seedChat(env, "player-1");

    await expect(
      chatMessages(env, "player-1", "player-1").doc("m1").update({ text: "changed" })
    ).rejects.toThrow();
  });
});
