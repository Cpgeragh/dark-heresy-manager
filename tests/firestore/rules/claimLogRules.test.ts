// tests/firestore/rules/claimLogRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext
} from "@firebase/rules-unit-testing";

describe("Firestore Rules: ClaimLog Rules", () => {
  const campaignId = "camp1";
  const characterId = "char1";

  async function setupCampaign(env: RulesTestEnvironment) {
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx.firestore().collection("campaigns").doc(campaignId).set({
        dmId: "dm-1",
        name: "Test Campaign"
      });

      await ctx
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .set({
          userId: "player-1",
          isEditableByPlayer: true
        });
    });
  }

  it("DM may read claim logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaign(env);

    // Insert log
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx
        .firestore()
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log1")
        .set({
          action: "claim",
          actorUid: "player-1"
        });
    });

    const dm = env.authenticatedContext("dm-1");

    await expect(
      dm
        .firestore()
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log1")
        .get()
    ).resolves.toBeDefined();
  });

  it("player may create claim logs for themselves", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaign(env);

    const player = env.authenticatedContext("player-1");

    await expect(
      player
        .firestore()
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log2")
        .set({
          action: "claim",
          actorUid: "player-1"
        })
    ).resolves.toBeUndefined();
  });

  it("player cannot create logs for OTHER users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupCampaign(env);

    const player = env.authenticatedContext("player-2");

    await expect(
      player
        .firestore()
        .collection(
          `campaigns/${campaignId}/characters/${characterId}/claimLog`
        )
        .doc("log3")
        .set({
          action: "claim",
          actorUid: "player-1"
        })
    ).rejects.toThrow();
  });
});