// tests/firestore/rules/characterSummaryLinkedDeviceRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { dbAs, createCampaign, createCharacterSummary } from "../helpers";

async function createUserLink(env: RulesTestEnvironment, linkedUid: string, primaryUid: string) {
  await env.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection("userLinks")
      .doc(linkedUid)
      .set({ primaryUid, linkedAt: new Date() });
  });
}

async function seedCampaign(env: RulesTestEnvironment) {
  await createCampaign(env, "c1", "dm-1", { memberIds: ["player-1"] });
  await createCharacterSummary(env, "c1", "char1", {
    campaignId: "c1",
    characterName: "Test Acolyte",
  });
}

describe("Firestore Rules: characterSummaries from a linked device", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("a linked device of the DM may read a character summary", async () => {
    const env = await getTestEnv();
    await seedCampaign(env);
    await createUserLink(env, "dm-device", "dm-1");

    await expect(
      dbAs(env, "dm-device").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("a linked device of a campaign member may read a character summary", async () => {
    const env = await getTestEnv();
    await seedCampaign(env);
    await createUserLink(env, "player-device", "player-1");

    await expect(
      dbAs(env, "player-device").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("a linked device of a campaign member may list character summaries", async () => {
    const env = await getTestEnv();
    await seedCampaign(env);
    await createUserLink(env, "player-device", "player-1");

    await expect(
      dbAs(env, "player-device").collection("campaigns/c1/characterSummaries").limit(100).get()
    ).resolves.toBeDefined();
  });

  it("a linked device of an unrelated account cannot read a character summary", async () => {
    const env = await getTestEnv();
    await seedCampaign(env);
    await createUserLink(env, "stranger-device", "stranger");

    await expect(
      dbAs(env, "stranger-device").collection("campaigns/c1/characterSummaries").doc("char1").get()
    ).rejects.toThrow();
  });
});
