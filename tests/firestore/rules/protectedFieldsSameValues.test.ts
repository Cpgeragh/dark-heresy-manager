// tests/firestore/rules/protectedFieldsSameValues.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Protected Fields with Same Values", () => {
  const campaignId = `camp-same-values-${Date.now()}`;
  const characterId = "char-same";

  async function setup(env: RulesTestEnvironment) {
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });
  }

  it("player can update normal fields while protected fields remain unchanged", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);
    
    const playerDb = dbAs(env, "player-1");
    
    // Update includes protected fields but with same values
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          armour: [], // ordinary, still-writable field
          userId: "player-1", // same as before
          isEditableByPlayer: true, // same as before
          recoveryCode: "DH-TEST-0001" // same as before
        })
    ).resolves.toBeUndefined();
  });

  it("player can update with only protected fields at same values", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);
    
    const playerDb = dbAs(env, "player-1");
    
    // Update with only protected fields (no changes)
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          userId: "player-1",
          isEditableByPlayer: true,
          recoveryCode: "DH-TEST-0001"
        })
    ).resolves.toBeUndefined();
  });

  it("player cannot change even one protected field among unchanged ones", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);
    
    const playerDb = dbAs(env, "player-1");
    
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          userId: "player-1", // same
          isEditableByPlayer: false, // CHANGED - should fail
          recoveryCode: "DH-TEST-0001" // same
        })
    ).rejects.toThrow();
  });

  it("player can update multiple normal fields while protected stay same", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);
    
    const playerDb = dbAs(env, "player-1");
    
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          armour: [], // ordinary, still-writable field
          gear: [], // ordinary, still-writable field
          consumables: [], // ordinary, still-writable field
          userId: "player-1", // protected but same
          isEditableByPlayer: true, // protected but same
          recoveryCode: "DH-TEST-0001" // protected but same
        })
    ).resolves.toBeUndefined();
  });

  it("DM can change ownership fields while the Recovery Code remains stable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    // Use a unique campaign for this test
    const dmCampaignId = `camp-dm-${Date.now()}`;
    await createCampaign(env, dmCampaignId, "dm-1");
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await createCharacter(env, dmCampaignId, "char-dm", {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection(`campaigns/${dmCampaignId}/characters`)
        .doc("char-dm")
        .update({
          userId: "player-2", // changed
          isEditableByPlayer: false, // changed
          recoveryCode: "DH-TEST-0001" // unchanged
        })
    ).resolves.toBeUndefined();
  });

  it("player update fails if any protected field differs slightly", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);
    
    const playerDb = dbAs(env, "player-1");
    
    // Try with slightly modified recoveryCode
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          armour: [], // ordinary, still-writable field
          userId: "player-1",
          isEditableByPlayer: true,
          recoveryCode: "RCODE " // extra space - should fail
        })
    ).rejects.toThrow();
  });
});
