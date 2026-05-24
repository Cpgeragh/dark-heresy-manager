// tests/firestore/rules/batchOperations.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign } from "../helpers";

describe("Firestore Rules: Batch Operations", () => {

  it("DM can create multiple campaigns in a batch", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    
    batch.set(dmDb.collection("campaigns").doc(`batch-c1-${timestamp}`), {
      dmId: "dm-1",
      name: "Campaign 1"
    });
    
    batch.set(dmDb.collection("campaigns").doc(`batch-c2-${timestamp}`), {
      dmId: "dm-1",
      name: "Campaign 2"
    });
    
    batch.set(dmDb.collection("campaigns").doc(`batch-c3-${timestamp}`), {
      dmId: "dm-1",
      name: "Campaign 3"
    });
    
    await expect(batch.commit()).resolves.toBeUndefined();
    
    // Verify one was created
    const doc = await dmDb.collection("campaigns").doc(`batch-c1-${timestamp}`).get();
    expect(doc.exists).toBe(true);
  });

  it("batch fails if one operation violates rules", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    
    // Valid operation
    batch.set(dmDb.collection("campaigns").doc(`batch-valid-${timestamp}`), {
      dmId: "dm-1",
      name: "Valid Campaign"
    });
    
    // Invalid operation - missing dmId
    batch.set(dmDb.collection("campaigns").doc(`batch-invalid-${timestamp}`), {
      name: "Invalid Campaign"
    });
    
    await expect(batch.commit()).rejects.toThrow();
  });

  it("DM can update multiple campaigns in a batch", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    await createCampaign(env, `batch-u1-${timestamp}`, "dm-1", { name: "Original 1" });
    await createCampaign(env, `batch-u2-${timestamp}`, "dm-1", { name: "Original 2" });
    
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    
    batch.update(dmDb.collection("campaigns").doc(`batch-u1-${timestamp}`), {
      name: "Updated 1"
    });
    
    batch.update(dmDb.collection("campaigns").doc(`batch-u2-${timestamp}`), {
      name: "Updated 2"
    });
    
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("DM can create campaign and characters in same batch", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const campaignId = `batch-camp-${timestamp}`;
    
    await createCampaign(env, campaignId, "dm-1");
    
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    
    batch.set(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc("batch-char1"),
      {
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: "CODE1"
      }
    );

    batch.set(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc("batch-char2"),
      {
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: "CODE2"
      }
    );
    
    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("player cannot batch update another player's character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const campaignId = `batch-camp2-${timestamp}`;
    
    await createCampaign(env, campaignId, "dm-1");
    
    // Create characters as admin
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection(`campaigns/${campaignId}/characters`).doc("char1").set({
        userId: "player-1",
        isEditableByPlayer: true,
        name: "Char 1"
      });
      await db.collection(`campaigns/${campaignId}/characters`).doc("char2").set({
        userId: "player-2",
        isEditableByPlayer: true,
        name: "Char 2"
      });
    });
    
    const player1Db = dbAs(env, "player-1");
    const batch = player1Db.batch();
    
    // Try to update both characters
    batch.update(
      player1Db.collection(`campaigns/${campaignId}/characters`).doc("char1"),
      { name: "Updated by player 1" }
    );
    
    batch.update(
      player1Db.collection(`campaigns/${campaignId}/characters`).doc("char2"),
      { name: "Hacked by player 1" }
    );
    
    await expect(batch.commit()).rejects.toThrow();
  });

  it("DM can batch create recoveryIndex entries", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const campaignId = `batch-recovery-${timestamp}`;
    
    // IMPORTANT: Create campaign first and WAIT for it to be readable
    await createCampaign(env, campaignId, "dm-1");
    
    // Add a small delay to ensure propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    
    batch.set(dmDb.collection("recoveryIndex").doc(`BATCH-CODE1-${timestamp}`), {
      campaignId: campaignId,
      characterId: "char1"
    });
    
    batch.set(dmDb.collection("recoveryIndex").doc(`BATCH-CODE2-${timestamp}`), {
      campaignId: campaignId,
      characterId: "char2"
    });
    
    await expect(batch.commit()).resolves.toBeUndefined();
  });
});