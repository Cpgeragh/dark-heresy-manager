import { afterEach, describe, expect, it } from "vitest";
import { getTestEnv } from "../setup";
import { createCampaign, createCharacter, dbAs, validCharacterDocument } from "../helpers";

describe("Firestore Rules: account and character-creation protections", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("does not allow a user to delete their private account document", async () => {
    const env = await getTestEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-1").set({ role: "player" });
    });
    await expect(dbAs(env, "user-1").collection("users").doc("user-1").delete()).rejects.toThrow();
  });

  it("still allows a user to read and validly update their own account", async () => {
    const env = await getTestEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-2").set({ role: "player" });
    });
    const user = dbAs(env, "user-2").collection("users").doc("user-2");
    await expect(user.get()).resolves.toBeDefined();
    await expect(user.update({ onboarded: true })).resolves.toBeUndefined();
  });

  it("requires code-less, unclaimed, non-editable character creation", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    for (const [id, overrides] of [
      ["claimed", { userId: "player-1" }],
      ["editable", { isEditableByPlayer: true }],
    ] as const) {
      await expect(
        dmDb
          .collection("campaigns/c1/characters")
          .doc(id)
          .set(validCharacterDocument("c1", "", overrides))
      ).rejects.toThrow();
    }
  });

  it("rejects standalone claim and release logs", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char1", { userId: "player-1" });
    const logs = dbAs(env, "player-1").collection("campaigns/c1/characters/char1/claimLog");

    await expect(
      logs.doc("release").set({
        action: "release",
        actorUid: "player-1",
        previousOwnerUid: "player-1",
        newOwnerUid: null,
        timestamp: new Date(),
      })
    ).rejects.toThrow();
    await expect(
      logs.doc("claim").set({
        action: "claim",
        actorUid: "player-1",
        previousOwnerUid: null,
        newOwnerUid: "player-1",
        timestamp: new Date(),
      })
    ).rejects.toThrow();
  });
});
