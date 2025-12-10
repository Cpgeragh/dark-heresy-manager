// tests/firestore/rules/advancedQueryTests.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, dbAnon, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Advanced Query Operations", () => {
  
  it("authenticated users can query campaigns with where clause", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    // Use unique IDs to avoid collision with other tests
    const timestamp = Date.now();
    await createCampaign(env, `query-c1-${timestamp}`, "dm-query-1", { name: "Alpha", system: "D&D" });
    await createCampaign(env, `query-c2-${timestamp}`, "dm-query-2", { name: "Beta", system: "Dark Heresy" });
    await createCampaign(env, `query-c3-${timestamp}`, "dm-query-3", { name: "Gamma", system: "Dark Heresy" });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb.collection("campaigns")
      .where("system", "==", "Dark Heresy")
      .get();
    
    // Verify our specific documents are present
    const filteredDocs = snapshot.docs.filter(doc => 
      doc.data().name === "Beta" || doc.data().name === "Gamma"
    );
    expect(filteredDocs.length).toBe(2);
  });

  it("authenticated users can use orderBy on campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    // Use unique prefix for these campaigns
    const timestamp = Date.now();
    const prefix = `OrderTest-${timestamp}`;
    
    await createCampaign(env, `order-${timestamp}-1`, "dm-order-1", { 
      name: `${prefix}-Zebra` 
    });
    await createCampaign(env, `order-${timestamp}-2`, "dm-order-2", { 
      name: `${prefix}-Alpha` 
    });
    await createCampaign(env, `order-${timestamp}-3`, "dm-order-3", { 
      name: `${prefix}-Beta` 
    });
    
    const playerDb = dbAs(env, "player-1");
    
    // Query specifically for our test campaigns using a range
    const snapshot = await playerDb.collection("campaigns")
      .where("name", ">=", prefix)
      .where("name", "<=", prefix + "\uf8ff")
      .orderBy("name")
      .get();
    
    expect(snapshot.docs.length).toBe(3);
    expect(snapshot.docs[0].data().name).toBe(`${prefix}-Alpha`);
    expect(snapshot.docs[1].data().name).toBe(`${prefix}-Beta`);
    expect(snapshot.docs[2].data().name).toBe(`${prefix}-Zebra`);
  });

  it("authenticated users can use limit on campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    await createCampaign(env, `limit-${timestamp}-1`, "dm-limit-1", { name: "One" });
    await createCampaign(env, `limit-${timestamp}-2`, "dm-limit-2", { name: "Two" });
    await createCampaign(env, `limit-${timestamp}-3`, "dm-limit-3", { name: "Three" });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb.collection("campaigns")
      .limit(2)
      .get();
    
    // Should get at least 2
    expect(snapshot.docs.length).toBeGreaterThanOrEqual(2);
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

  it("players can query characters by userId", async () => {
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
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", "player-query-test")
      .get();
    
    expect(snapshot.docs.length).toBe(2);
  });

  it("players can query editable characters", async () => {
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
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("isEditableByPlayer", "==", true)
      .get();
    
    expect(snapshot.docs.length).toBe(2);
  });

  it("players can combine where clauses with orderBy", async () => {
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
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection(`campaigns/${campaignId}/characters`)
      .where("userId", "==", "player-complex-test")
      .orderBy("name")
      .get();
    
    expect(snapshot.docs.length).toBe(2);
    expect(snapshot.docs[0].data().name).toBe("Alpha");
  });
});