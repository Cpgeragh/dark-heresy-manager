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
      recoveryCode: "RCODE",
      name: "Original Name",
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
          name: "New Name",
          userId: "player-1", // same as before
          isEditableByPlayer: true, // same as before
          recoveryCode: "RCODE" // same as before
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
          recoveryCode: "RCODE"
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
          recoveryCode: "RCODE" // same
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
          name: "New Name",
          career: "New Career",
          rank: "New Rank",
          userId: "player-1", // protected but same
          isEditableByPlayer: true, // protected but same
          recoveryCode: "RCODE" // protected but same
        })
    ).resolves.toBeUndefined();
  });

  it("DM can change protected fields to new values", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    // Use a unique campaign for this test
    const dmCampaignId = `camp-dm-${Date.now()}`;
    await createCampaign(env, dmCampaignId, "dm-1");
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await createCharacter(env, dmCampaignId, "char-dm", {
      userId: "player-1",
      isEditableByPlayer: true,
      recoveryCode: "RCODE",
      name: "Original Name",
    });
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection(`campaigns/${dmCampaignId}/characters`)
        .doc("char-dm")
        .update({
          userId: "player-2", // changed
          isEditableByPlayer: false, // changed
          recoveryCode: "NEWCODE" // changed
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
          name: "New Name",
          userId: "player-1",
          isEditableByPlayer: true,
          recoveryCode: "RCODE " // extra space - should fail
        })
    ).rejects.toThrow();
  });
});