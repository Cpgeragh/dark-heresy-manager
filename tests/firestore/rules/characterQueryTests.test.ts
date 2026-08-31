// tests/firestore/rules/characterQueryTests.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

async function createUserLink(
  env: RulesTestEnvironment,
  linkedUid: string,
  primaryUid: string
) {
  await env.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .collection("userLinks")
      .doc(linkedUid)
      .set({ primaryUid, linkedAt: new Date() });
  });
}

describe("Firestore Rules: Character Query Operations", () => {
  it("the DM can order characters by name", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-order-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");

    const uniquePrefix = `Test-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Zebra`,
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Alpha`,
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Beta`,
    });

    const dmDb = dbAs(env, "dm-1");

    // Query only our test characters
    const snapshot = await dmDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("name", ">=", uniquePrefix)
      .where("name", "<=", uniquePrefix + "\uf8ff")
      .orderBy("name")
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(3);
    expect(snapshot.docs[0].data().name).toBe(`${uniquePrefix}-Alpha`);
    expect(snapshot.docs[1].data().name).toBe(`${uniquePrefix}-Beta`);
    expect(snapshot.docs[2].data().name).toBe(`${uniquePrefix}-Zebra`);
  });

  it("the DM can limit character queries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-limit-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: true,
    });

    const dmDb = dbAs(env, "dm-1");

    const snapshot = await dmDb.collection(`campaigns/${campaignId}/characters`).limit(2).get();

    expect(snapshot.docs.length).toBe(2);
  });

  it("a player can combine where clauses on their own characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-multi-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");

    const testUserId = `test-user-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: testUserId,
      isEditableByPlayer: true,
      career: "Adept",
    });
    await createCharacter(env, campaignId, "char2", {
      userId: testUserId,
      isEditableByPlayer: false,
      career: "Adept",
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-2",
      isEditableByPlayer: true,
      career: "Adept",
    });

    const playerDb = dbAs(env, testUserId);

    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", testUserId)
      .where("isEditableByPlayer", "==", true)
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(1);
    expect(snapshot.docs[0].id).toBe("char1");
  });

  it("a player may run the exact campaign-page query for all of their own characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-player-page-${Date.now()}`;
    const playerUid = `player-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1", { memberIds: [playerUid] });
    await createCharacter(env, campaignId, "owned", {
      userId: playerUid,
      isEditableByPlayer: false,
    });
    await createCharacter(env, campaignId, "other", {
      userId: "another-player",
      isEditableByPlayer: true,
    });

    const snapshot = await dbAs(env, playerUid)
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", playerUid)
      .limit(100)
      .get();

    expect(snapshot.docs.map((document) => document.id)).toEqual(["owned"]);
  });

  it("a linked device may run the campaign-page query for its primary player's characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-linked-player-page-${Date.now()}`;
    const primaryUid = `primary-${Date.now()}`;
    const linkedUid = `linked-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1", { memberIds: [primaryUid] });
    await createCharacter(env, campaignId, "owned", {
      userId: primaryUid,
      isEditableByPlayer: false,
    });
    await createUserLink(env, linkedUid, primaryUid);

    const snapshot = await dbAs(env, linkedUid)
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", primaryUid)
      .limit(100)
      .get();

    expect(snapshot.docs.map((document) => document.id)).toEqual(["owned"]);
  });

  it("DM can query all characters regardless of userId", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-dm-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: false,
    });

    const dmDb = dbAs(env, "dm-1");

    const snapshot = await dmDb.collection(`campaigns/${campaignId}/characters`).limit(100).get();

    expect(snapshot.docs.length).toBe(3);
  });

  it("the DM can query characters with startAt/endAt", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const campaignId = `camp-range-${Date.now()}`;

    await createCampaign(env, campaignId, "dm-1");

    const prefix = `Range-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: `${prefix}-Alpha`,
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: `${prefix}-Beta`,
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: true,
      name: `${prefix}-Gamma`,
    });

    const dmDb = dbAs(env, "dm-1");

    const snapshot = await dmDb
      .collection(`campaigns/${campaignId}/characters`)
      .orderBy("name")
      .startAt(`${prefix}-Beta`)
      .endAt(`${prefix}-Gamma`)
      .limit(100)
      .get();

    expect(snapshot.docs.length).toBe(2);
  });

  it("requires an owner filter and a 1,000-document ceiling for collection-group reads", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const firstCampaignId = `camp-owned-a-${Date.now()}`;
    const secondCampaignId = `camp-owned-b-${Date.now()}`;
    const ownerId = `collection-owner-${Date.now()}`;
    await createCampaign(env, firstCampaignId, "dm-1");
    await createCampaign(env, secondCampaignId, "dm-2");
    await createCharacter(env, firstCampaignId, "owned-1", { userId: ownerId });
    await createCharacter(env, firstCampaignId, "other", { userId: "player-2" });
    await createCharacter(env, secondCampaignId, "owned-2", { userId: ownerId });

    const characters = dbAs(env, ownerId)
      .collectionGroup("characters")
      .where("userId", "==", ownerId);
    const ownedSnapshot = await characters.limit(1_000).get();
    expect(ownedSnapshot.docs.map((document) => document.id).sort()).toEqual([
      "owned-1",
      "owned-2",
    ]);
    await expect(characters.get()).rejects.toThrow();
    await expect(characters.limit(1_001).get()).rejects.toThrow();
    await expect(
      dbAs(env, ownerId).collectionGroup("characters").limit(1_000).get()
    ).rejects.toThrow();
  });
});
