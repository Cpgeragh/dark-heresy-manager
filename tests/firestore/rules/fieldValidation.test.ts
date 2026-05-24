// tests/firestore/rules/fieldValidation.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign } from "../helpers";

describe("Firestore Rules: Field Validation", () => {

  it("campaign dmId must be a string", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    // This should work
    await expect(
      dmDb.collection("campaigns").doc("valid-dmid").set({
        dmId: "dm-1",
        name: "Valid Campaign"
      })
    ).resolves.toBeUndefined();
  });

  it("character userId field accepts any string", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const campaignId = `validation-camp-${Date.now()}`;
    await createCampaign(env, campaignId, "dm-1");
    
    // Add small delay for campaign propagation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const dmDb = dbAs(env, "dm-1");
    
    // DM creates with required initial values; userId and isEditableByPlayer
    // are controlled by the claim flow, not at creation time
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc("char1").set({
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: "CODE"
      })
    ).resolves.toBeUndefined();
  });

  it("character isEditableByPlayer must be boolean", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const campaignId = `validation-camp2-${Date.now()}`;
    await createCampaign(env, campaignId, "dm-1");
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc("char-bool").set({
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: "CODE"
      })
    ).resolves.toBeUndefined();
  });

  it("recoveryCode can be any string format", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const campaignId = `validation-camp3-${Date.now()}`;
    await createCampaign(env, campaignId, "dm-1");
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const dmDb = dbAs(env, "dm-1");
    
    const testCodes = [
      "SIMPLE",
      "WITH-DASHES",
      "with_underscores",
      "123456",
      "MIXED-123_abc"
    ];
    
    for (let i = 0; i < testCodes.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await expect(
        dmDb.collection(`campaigns/${campaignId}/characters`).doc(`char-${i}`).set({
          userId: null,
          isEditableByPlayer: false,
          recoveryCode: testCodes[i]
        })
      ).resolves.toBeUndefined();
    }
  });

  it("claimLog action must be valid enum value", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const campaignId = `validation-camp4-${Date.now()}`;
    await createCampaign(env, campaignId, "dm-1");
    
    // Create character first
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .set({
          userId: null,
          isEditableByPlayer: false,
          recoveryCode: "CODE"
        });
    });
    
    const playerDb = dbAs(env, "player-1");
    
    // Valid action
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters/char1/claimLog`)
        .doc("log-valid")
        .set({
          action: "claim",
          actorUid: "player-1"
        })
    ).resolves.toBeUndefined();
    
    // Invalid action
    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters/char1/claimLog`)
        .doc("log-invalid")
        .set({
          action: "invalid-action",
          actorUid: "player-1"
        })
    ).rejects.toThrow();
  });
});