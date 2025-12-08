// tests/firestore/rules/dmPrivilegeRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext
} from "@firebase/rules-unit-testing";

describe("Firestore Rules: DM Privileges", () => {
  const campaignId = "camp1";
  const characterId = "char1";

  async function setupAll(env: RulesTestEnvironment) {
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
          isEditableByPlayer: false,
          name: "Original"
        });
    });
  }

  it("DM can delete any character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupAll(env);

    const dm = env.authenticatedContext("dm-1");

    await expect(
      dm
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .delete()
    ).resolves.toBeUndefined();
  });

  it("player cannot delete characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setupAll(env);

    const p = env.authenticatedContext("player-1");

    await expect(
      p
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .delete()
    ).rejects.toThrow();
  });
});