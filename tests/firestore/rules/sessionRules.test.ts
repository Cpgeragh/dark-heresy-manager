import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, dbAnon, createCampaign } from "../helpers";

async function createSession(
  env: RulesTestEnvironment,
  campaignId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore()
      .collection(`campaigns/${campaignId}/sessions`)
      .doc(sessionId)
      .set({
        date: new Date(),
        summary: "Test session",
        dmNotes: "DM only notes",
        xpAwarded: 100,
        attendees: [],
        createdAt: new Date(),
        ...data,
      });
  });
}

describe("Firestore Rules: Sessions", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("authenticated player can read a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").doc("s1").get()
    ).resolves.toBeDefined();
  });

  it("authenticated player can list sessions", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").get()
    ).resolves.toBeDefined();
  });

  it("unauthenticated user cannot read sessions", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const anonDb = dbAnon(env);
    await expect(
      anonDb.collection("campaigns/c1/sessions").doc("s1").get()
    ).rejects.toThrow();
  });

  it("DM can create a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/sessions").doc("s-new").set({
        date: new Date(),
        summary: "New session",
        dmNotes: "",
        xpAwarded: 50,
        attendees: [],
        createdAt: new Date(),
      })
    ).resolves.toBeUndefined();
  });

  it("non-DM player cannot create a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").doc("s-new").set({
        date: new Date(),
        summary: "Illicit session",
        dmNotes: "",
        xpAwarded: 0,
        attendees: [],
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("DM can update a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/sessions").doc("s1").update({ summary: "Updated" })
    ).resolves.toBeUndefined();
  });

  it("non-DM player cannot update a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").doc("s1").update({ summary: "Hacked" })
    ).rejects.toThrow();
  });

  it("DM can delete a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/sessions").doc("s1").delete()
    ).resolves.toBeUndefined();
  });

  it("non-DM player cannot delete a session", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").doc("s1").delete()
    ).rejects.toThrow();
  });
});
