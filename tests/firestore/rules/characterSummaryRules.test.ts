// tests/firestore/rules/characterSummaryRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter, createCharacterSummary } from "../helpers";

describe("Firestore Rules: characterSummaries", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("the DM may read any character summary in their campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    await expect(
      dbAs(env, "dm-1").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("a campaign member may read another member's character summary", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1", "player-2"] });
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    await expect(
      dbAs(env, "player-2").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("an unrelated authenticated user cannot read a character summary", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    await expect(
      dbAs(env, "reader").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).rejects.toThrow();
  });

  it("a member may list character summaries in their campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    await expect(
      dbAs(env, "player-1").collection("campaigns/c1/characterSummaries").limit(100).get()
    ).resolves.toBeDefined();
  });

  it("an unrelated authenticated user cannot list character summaries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    await expect(
      dbAs(env, "reader").collection("campaigns/c1/characterSummaries").limit(100).get()
    ).rejects.toThrow();
  });

  it("the owning player may write their own character's summary", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });

    await expect(
      dbAs(env, "player-1")
        .collection("campaigns/c1/characterSummaries")
        .doc("char1")
        .set({ campaignId: "c1", characterName: "Test Acolyte" })
    ).resolves.toBeUndefined();
  });

  it("the DM may write a summary for any character in their campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });

    await expect(
      dbAs(env, "dm-1")
        .collection("campaigns/c1/characterSummaries")
        .doc("char1")
        .set({ campaignId: "c1", characterName: "Test Acolyte" })
    ).resolves.toBeUndefined();
  });

  it("an unrelated player cannot write another player's character summary", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });

    await expect(
      dbAs(env, "player-2")
        .collection("campaigns/c1/characterSummaries")
        .doc("char1")
        .set({ campaignId: "c1", characterName: "Test Acolyte" })
    ).rejects.toThrow();
  });

  it("rejects a summary containing the Recovery Code or any other unexpected field", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });

    await expect(
      dbAs(env, "player-1")
        .collection("campaigns/c1/characterSummaries")
        .doc("char1")
        .set({ campaignId: "c1", characterName: "Test Acolyte", recoveryCode: "DH-TEST-0001" })
    ).rejects.toThrow();
  });

  it("keeps a summary deletable only as a consequence of the character itself being deleted", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });
    await createCharacterSummary(env, "c1", "char1", {
      campaignId: "c1",
      characterName: "Test Acolyte",
    });

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("campaigns/c1/characterSummaries").doc("char1").delete()
    ).rejects.toThrow();

    const batch = dmDb.batch();
    batch.delete(dmDb.collection("campaigns/c1/characterSummaries").doc("char1"));
    batch.delete(dmDb.doc("campaigns/c1/characters/char1"));
    await expect(batch.commit()).resolves.toBeUndefined();
  });
});
