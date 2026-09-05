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
    await ctx
      .firestore()
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

async function createSessionSummary(
  env: RulesTestEnvironment,
  campaignId: string,
  sessionId: string,
  data: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .collection(`campaigns/${campaignId}/sessionSummaries`)
      .doc(sessionId)
      .set({
        date: new Date(),
        summary: "Member-safe session recap",
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

  it("non-DM cannot read a full session by exact ID", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(playerDb.collection("campaigns/c1/sessions").doc("s1").get()).rejects.toThrow();
  });

  it("only the DM can list full sessions and the query must remain bounded", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerSessions = dbAs(env, "player-1").collection("campaigns/c1/sessions");
    await expect(playerSessions.limit(200).get()).rejects.toThrow();

    const dmSessions = dbAs(env, "dm-1").collection("campaigns/c1/sessions");
    await expect(dmSessions.limit(200).get()).resolves.toBeDefined();
    await expect(dmSessions.get()).rejects.toThrow();
    await expect(dmSessions.limit(201).get()).rejects.toThrow();
  });

  it("campaign members can read and list safe session summaries", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
    await createSessionSummary(env, "c1", "s1");

    const summaries = dbAs(env, "player-1").collection("campaigns/c1/sessionSummaries");
    await expect(summaries.doc("s1").get()).resolves.toBeDefined();
    await expect(summaries.limit(200).get()).resolves.toBeDefined();
    await expect(summaries.get()).rejects.toThrow();
    await expect(summaries.limit(201).get()).rejects.toThrow();
  });

  it("a linked device for a campaign member can read safe session summaries", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
    await createSessionSummary(env, "c1", "s1");
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("userLinks").doc("linked-device").set({
        primaryUid: "player-1",
      });
    });

    await expect(
      dbAs(env, "linked-device").collection("campaigns/c1/sessionSummaries").doc("s1").get()
    ).resolves.toBeDefined();
  });

  it("authenticated strangers cannot read safe summaries by ID or query", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
    await createSessionSummary(env, "c1", "s1");
    const summaries = dbAs(env, "stranger").collection("campaigns/c1/sessionSummaries");

    await expect(summaries.doc("s1").get()).rejects.toThrow();
    await expect(summaries.limit(200).get()).rejects.toThrow();
  });

  it("DM can write a safe summary but cannot include private DM notes", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
    const summary = {
      date: new Date(),
      summary: "Safe recap",
      xpAwarded: 50,
      attendees: [],
      createdAt: new Date(),
    };
    const summaries = dbAs(env, "dm-1").collection("campaigns/c1/sessionSummaries");

    await expect(summaries.doc("safe").set(summary)).resolves.toBeUndefined();
    await expect(
      summaries.doc("unsafe").set({ ...summary, dmNotes: "must remain private" })
    ).rejects.toThrow();
  });

  it("campaign members cannot write session summaries", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });

    await expect(
      dbAs(env, "player-1").collection("campaigns/c1/sessionSummaries").doc("s1").set({
        date: new Date(),
        summary: "Forged recap",
        xpAwarded: 0,
        attendees: [],
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot read sessions", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const anonDb = dbAnon(env);
    await expect(anonDb.collection("campaigns/c1/sessions").doc("s1").get()).rejects.toThrow();
  });

  it("DM can create a session", async () => {
    const env = await getTestEnv();
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
    const env = await getTestEnv();
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

  it("DM cannot create a session with oversized private notes", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");

    await expect(
      dbAs(env, "dm-1")
        .collection("campaigns/c1/sessions")
        .doc("s-large")
        .set({
          date: new Date(),
          summary: "Summary",
          dmNotes: "x".repeat(4_001),
          xpAwarded: 50,
          attendees: [],
          createdAt: new Date(),
        })
    ).rejects.toThrow();
  });

  it("DM cannot create a session outside the XP range", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");

    await expect(
      dbAs(env, "dm-1").collection("campaigns/c1/sessions").doc("s-xp").set({
        date: new Date(),
        summary: "Summary",
        dmNotes: "",
        xpAwarded: 100_001,
        attendees: [],
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("DM cannot create a session with duplicate attendees or unexpected fields", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    const sessions = dbAs(env, "dm-1").collection("campaigns/c1/sessions");
    const valid = {
      date: new Date(),
      summary: "Summary",
      dmNotes: "",
      xpAwarded: 50,
      attendees: ["char-1"],
      createdAt: new Date(),
    };

    await expect(
      sessions.doc("duplicates").set({ ...valid, attendees: ["char-1", "char-1"] })
    ).rejects.toThrow();
    await expect(sessions.doc("extra").set({ ...valid, unexpected: true })).rejects.toThrow();
  });

  it("DM can update a session", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/sessions").doc("s1").update({ summary: "Updated" })
    ).resolves.toBeUndefined();
  });

  it("non-DM player cannot update a session", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection("campaigns/c1/sessions").doc("s1").update({ summary: "Hacked" })
    ).rejects.toThrow();
  });

  it("DM can delete a session", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/sessions").doc("s1").delete()
    ).resolves.toBeUndefined();
  });

  it("non-DM player cannot delete a session", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createSession(env, "c1", "s1");

    const playerDb = dbAs(env, "player-1");
    await expect(playerDb.collection("campaigns/c1/sessions").doc("s1").delete()).rejects.toThrow();
  });
});
