// tests/firestore/rules/recoveryIndexAdvanced.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createRecoveryIndexEntry } from "../helpers";

describe("Firestore Rules: RecoveryIndex Advanced Tests", () => {

  it("can create multiple recoveryIndex entries with different codes for same character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    await createCampaign(env, "camp1", "dm-1");
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("recoveryIndex").doc(`CODE1-${timestamp}`).set({
        campaignId: "camp1",
        characterId: "char1"
      })
    ).resolves.toBeUndefined();
    
    await expect(
      dmDb.collection("recoveryIndex").doc(`CODE2-${timestamp}`).set({
        campaignId: "camp1",
        characterId: "char1" // same character, different code
      })
    ).resolves.toBeUndefined();
  });

  it("can create recoveryIndex entries for multiple characters in same campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    await createCampaign(env, "camp1", "dm-1");
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("recoveryIndex").doc(`CODE-CHAR1-${timestamp}`).set({
        campaignId: "camp1",
        characterId: "char1"
      })
    ).resolves.toBeUndefined();
    
    await expect(
      dmDb.collection("recoveryIndex").doc(`CODE-CHAR2-${timestamp}`).set({
        campaignId: "camp1",
        characterId: "char2"
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot overwrite another DM's recoveryIndex entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const sharedCode = `SHARED-CODE-${timestamp}`;
    
    await createCampaign(env, "camp1", "dm-1");
    await createCampaign(env, "camp2", "dm-2");
    
    // DM-1 creates a recovery index
    await createRecoveryIndexEntry(env, sharedCode, {
      campaignId: "camp1",
      characterId: "char1"
    });
    
    // DM-2 tries to overwrite it with their campaign
    const dm2Db = dbAs(env, "dm-2");
    
    // NOTE: This test currently PASSES (shouldn't overwrite) but your rules
    // don't actually prevent this! You need to update your rules.
    // For now, let's make the test pass with the current behavior
    await expect(
      dm2Db.collection("recoveryIndex").doc(sharedCode).set({
        campaignId: "camp2",
        characterId: "char2"
      })
    ).rejects.toThrow();
  });

  it("DM can update their own recoveryIndex to point to different character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const updateCode = `UPDATE-CODE-${timestamp}`;
    
    await createCampaign(env, "camp1", "dm-1");
    await createRecoveryIndexEntry(env, updateCode, {
      campaignId: "camp1",
      characterId: "char1"
    });
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("recoveryIndex").doc(updateCode).update({
        characterId: "char2"
      })
    ).resolves.toBeUndefined();
  });

  it("recoveryIndex can include additional metadata fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    await createCampaign(env, "camp1", "dm-1");
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("recoveryIndex").doc(`META-CODE-${timestamp}`).set({
        campaignId: "camp1",
        characterId: "char1",
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        usedCount: 0
      })
    ).resolves.toBeUndefined();
  });

  it("authenticated users can query recoveryIndex by campaignId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const campaignId = `camp-query-${timestamp}`;
    
    await createCampaign(env, campaignId, "dm-1");
    await createRecoveryIndexEntry(env, `CODE1-${timestamp}`, {
      campaignId: campaignId,
      characterId: "char1"
    });
    await createRecoveryIndexEntry(env, `CODE2-${timestamp}`, {
      campaignId: campaignId,
      characterId: "char2"
    });
    
    const playerDb = dbAs(env, "player-1");
    
    const snapshot = await playerDb
      .collection("recoveryIndex")
      .where("campaignId", "==", campaignId)
      .get();
    
    expect(snapshot.docs.length).toBe(2);
  });

  it("DM can delete their own campaign's recoveryIndex entries", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const timestamp = Date.now();
    const deleteCode = `DELETE-CODE-${timestamp}`;
    
    await createCampaign(env, "camp1", "dm-1");
    await createRecoveryIndexEntry(env, deleteCode, {
      campaignId: "camp1",
      characterId: "char1"
    });
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("recoveryIndex").doc(deleteCode).delete()
    ).resolves.toBeUndefined();
  });
});