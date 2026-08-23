import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, dbAs, validCharacterDocument } from "../helpers";

describe("Firestore Rules: retained Phase 0A protections", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("does not allow a user to delete their private account document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-1").set({ role: "player" });
    });
    await expect(dbAs(env, "user-1").collection("users").doc("user-1").delete()).rejects.toThrow();
  });

  it("still allows a user to read and validly update their own account", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-2").set({ role: "player" });
    });
    const user = dbAs(env, "user-2").collection("users").doc("user-2");
    await expect(user.get()).resolves.toBeDefined();
    await expect(user.update({ onboarded: true })).resolves.toBeUndefined();
  });

  it("requires unclaimed, non-editable character creation with a matching index", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    for (const [id, overrides] of [
      ["claimed", { userId: "player-1" }],
      ["editable", { isEditableByPlayer: true }],
    ] as const) {
      const code = id === "claimed" ? "DH-CLMD-0001" : "DH-EDIT-0001";
      const batch = dmDb.batch();
      batch.set(
        dmDb.collection("campaigns/c1/characters").doc(id),
        validCharacterDocument("c1", code, overrides)
      );
      batch.set(dmDb.collection("recoveryIndex").doc(code), {
        campaignId: "c1",
        characterId: id,
      });
      await expect(batch.commit()).rejects.toThrow();
    }
  });

  it("rejects standalone claim and release logs", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });
    const logs = dbAs(env, "player-1").collection("campaigns/c1/characters/char1/claimLog");

    await expect(logs.doc("release").set({
      action: "release",
      actorUid: "player-1",
      previousOwnerUid: "player-1",
      newOwnerUid: null,
      timestamp: new Date(),
    })).rejects.toThrow();
    await expect(logs.doc("claim").set({
      action: "claim",
      actorUid: "player-1",
      previousOwnerUid: null,
      newOwnerUid: "player-1",
      timestamp: new Date(),
    })).rejects.toThrow();
  });
});
