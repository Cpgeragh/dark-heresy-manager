// tests/firestore/rules/characterQueryTests.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Character Query Operations", () => {

  it("players can order characters by name", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-order-${Date.now()}`;
    
    await createCampaign(env, campaignId, "dm-1");
    
    const uniquePrefix = `Test-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Zebra`
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Alpha`
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: true,
      name: `${uniquePrefix}-Beta`
    });
    
    const playerDb = dbAs(env, "player-1");
    
    // Query only our test characters
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("name", ">=", uniquePrefix)
      .where("name", "<=", uniquePrefix + "\uf8ff")
      .orderBy("name")
      .get();
    
    expect(snapshot.docs.length).toBe(3);
    expect(snapshot.docs[0].data().name).toBe(`${uniquePrefix}-Alpha`);
    expect(snapshot.docs[1].data().name).toBe(`${uniquePrefix}-Beta`);
    expect(snapshot.docs[2].data().name).toBe(`${uniquePrefix}-Zebra`);
  });

  it("players can limit character queries", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-limit-${Date.now()}`;
    
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
      isEditableByPlayer: true
    });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .limit(2)
      .get();
    
    expect(snapshot.docs.length).toBe(2);
  });

  it("players can combine multiple where clauses on characters", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-multi-${Date.now()}`;
    
    await createCampaign(env, campaignId, "dm-1");
    
    const testUserId = `test-user-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: testUserId,
      isEditableByPlayer: true,
      career: "Adept"
    });
    await createCharacter(env, campaignId, "char2", {
      userId: testUserId,
      isEditableByPlayer: false,
      career: "Adept"
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-2",
      isEditableByPlayer: true,
      career: "Adept"
    });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", testUserId)
      .where("isEditableByPlayer", "==", true)
      .get();
    
    expect(snapshot.docs.length).toBe(1);
    expect(snapshot.docs[0].data().characterId).toBe("char1");
  });

  it("DM can query all characters regardless of userId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-dm-${Date.now()}`;
    
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
      .get();
    
    expect(snapshot.docs.length).toBe(3);
  });

  it("players can query characters with startAt/endAt", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    const campaignId = `camp-range-${Date.now()}`;
    
    await createCampaign(env, campaignId, "dm-1");
    
    const prefix = `Range-${Date.now()}`;
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: `${prefix}-Alpha`
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: true,
      name: `${prefix}-Beta`
    });
    await createCharacter(env, campaignId, "char3", {
      userId: "player-3",
      isEditableByPlayer: true,
      name: `${prefix}-Gamma`
    });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .orderBy("name")
      .startAt(`${prefix}-Beta`)
      .endAt(`${prefix}-Gamma`)
      .get();
    
    expect(snapshot.docs.length).toBe(2);
  });
});