// tests/firestore/rules/characterRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext
} from "@firebase/rules-unit-testing";

describe("Firestore Rules: Character Rules", () => {
  const campaignId = "camp1";

  // Create campaign helper
  async function createCampaign(env: RulesTestEnvironment) {
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx.firestore().collection("campaigns").doc(campaignId).set({
        dmId: "dm-1",
        name: "Test Campaign"
      });
    });
  }

  // Create character helper
  async function createCharacter(
    env: RulesTestEnvironment,
    id: string,
    data: Record<string, unknown>
  ) {
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc(id)
        .set(data);
    });
  }

  it("any authenticated user may read characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env);

    await createCharacter(env, "char1", {
      userId: "player-1",
      isEditableByPlayer: true
    });

    const user = env.authenticatedContext("reader");

    await expect(
      user
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .get()
    ).resolves.toBeDefined();
  });

  it("player may update their own character when editable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env);

    await createCharacter(env, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: "Original"
    });

    const player = env.authenticatedContext("player-1");

    await expect(
      player
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "Updated" })
    ).resolves.toBeUndefined();
  });

  it("player cannot update their character when NOT editable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env);

    await createCharacter(env, "char1", {
      userId: "player-1",
      isEditableByPlayer: false,
      name: "Original"
    });

    const player = env.authenticatedContext("player-1");

    await expect(
      player
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "Updated" })
    ).rejects.toThrow();
  });

  it("player cannot update another user's character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env);

    await createCharacter(env, "char1", {
      userId: "player-1",
      isEditableByPlayer: true
    });

    const p2 = env.authenticatedContext("player-2");

    await expect(
      p2
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "Illegal update" })
    ).rejects.toThrow();
  });

  it("DM can update any character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env);

    await createCharacter(env, "char1", {
      userId: "player-1",
      isEditableByPlayer: false
    });

    const dm = env.authenticatedContext("dm-1");

    await expect(
      dm
        .firestore()
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "DM update" })
    ).resolves.toBeUndefined();
  });
});