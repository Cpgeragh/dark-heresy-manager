// tests/firestore/rules/advancedQueryTests.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, dbAnon, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Advanced Query Operations", () => {
  
  it("a DM can query their own campaigns with an additional where clause", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const timestamp = Date.now();
    await createCampaign(env, `query-c1-${timestamp}`, "dm-query-1", { name: "Alpha", system: "D&D" });
    await createCampaign(env, `query-c2-${timestamp}`, "dm-query-1", { name: "Beta", system: "Dark Heresy" });
    await createCampaign(env, `query-c3-${timestamp}`, "dm-query-1", { name: "Gamma", system: "Dark Heresy" });

    const dmDb = dbAs(env, "dm-query-1");

    const snapshot = await dmDb.collection("campaigns")
      .where("dmId", "==", "dm-query-1")
      .where("system", "==", "Dark Heresy")
      .limit(100)
      .get();

    expect(snapshot.docs.map(doc => doc.data().name).sort()).toEqual(["Beta", "Gamma"]);
  });

  it("a DM can use orderBy on their own campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const timestamp = Date.now();
    const prefix = `OrderTest-${timestamp}`;

    await createCampaign(env, `order-${timestamp}-1`, "dm-order-1", { name: `${prefix}-Zebra` });
    await createCampaign(env, `order-${timestamp}-2`, "dm-order-1", { name: `${prefix}-Alpha` });
    await createCampaign(env, `order-${timestamp}-3`, "dm-order-1", { name: `${prefix}-Beta` });

    const dmDb = dbAs(env, "dm-order-1");

    const snapshot = await dmDb.collection("campaigns")
      .where("dmId", "==", "dm-order-1")
      .orderBy("name")
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(3);
    expect(snapshot.docs[0].data().name).toBe(`${prefix}-Alpha`);
    expect(snapshot.docs[1].data().name).toBe(`${prefix}-Beta`);
    expect(snapshot.docs[2].data().name).toBe(`${prefix}-Zebra`);
  });

  it("a DM can use limit on their own campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const timestamp = Date.now();
    await createCampaign(env, `limit-${timestamp}-1`, "dm-limit-1", { name: "One" });
    await createCampaign(env, `limit-${timestamp}-2`, "dm-limit-1", { name: "Two" });
    await createCampaign(env, `limit-${timestamp}-3`, "dm-limit-1", { name: "Three" });

    const dmDb = dbAs(env, "dm-limit-1");

    const snapshot = await dmDb.collection("campaigns")
      .where("dmId", "==", "dm-limit-1")
      .limit(2)
      .get();

    expect(snapshot.docs.length).toBe(2);
  });

  it("unauthenticated users cannot query campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "anon-query-test", "dm-anon", { name: "Alpha" });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("campaigns")
        .where("name", "==", "Alpha")
        .get()
    ).rejects.toThrow();
  });

  it("an unrelated authenticated user cannot query campaigns without a membership-proving where clause", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const timestamp = Date.now();
    await createCampaign(env, `bystander-${timestamp}`, "dm-bystander", { name: "Alpha" });

    await expect(
      dbAs(env, "player-bystander").collection("campaigns")
        .where("name", "==", "Alpha")
        .get()
    ).rejects.toThrow();
  });

  it("a player can query their own characters by userId within a campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-query-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-query-test",
      isEditableByPlayer: true,
      name: "Character 1"
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: "Character 2"
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-query-test",
      isEditableByPlayer: false,
      name: "Character 3"
    });

    const playerDb = dbAs(env, "player-query-test");

    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", "player-query-test")
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(2);
  });

  it("an unrelated player cannot query another player's characters by userId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-query-unrelated-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-query-test",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1")
        .collection(`campaigns/${campaignId}/characters`)
        .where("userId", "==", "player-query-test")
        .limit(100)
        .get()
    ).rejects.toThrow();
  });

  it("the DM can query editable characters in their campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-editable-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: false
    });

    const dmDb = dbAs(env, "dm-1");

    const snapshot = await dmDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("isEditableByPlayer", "==", true)
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(2);
  });

  it("a player can combine where clauses with orderBy on their own characters", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-complex-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-complex-test",
      isEditableByPlayer: true,
      name: "Zebra"
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-complex-test",
      isEditableByPlayer: true,
      name: "Alpha"
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: "Beta"
    });

    const playerDb = dbAs(env, "player-complex-test");

    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", "player-complex-test")
      .orderBy("name")
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(2);
    expect(snapshot.docs[0].data().name).toBe("Alpha");
  });
});
