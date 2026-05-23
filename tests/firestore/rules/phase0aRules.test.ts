// tests/firestore/rules/phase0aRules.test.ts
// Verifies the security fixes introduced in Phase 0A.

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Phase 0A Security Fixes", () => {
  const campaignId = "camp-phase0a";
  const characterId = "char-phase0a";

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  // ================================================================
  // USERS — cannot delete own document
  // ================================================================

  it("user cannot delete their own user document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-1").set({ role: "player" });
    });

    const userDb = dbAs(env, "user-1");
    await expect(
      userDb.collection("users").doc("user-1").delete()
    ).rejects.toThrow();
  });

  it("user can still read and update their own document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("user-2").set({ role: "player" });
    });

    const userDb = dbAs(env, "user-2");
    await expect(userDb.collection("users").doc("user-2").get()).resolves.toBeDefined();
    await expect(
      userDb.collection("users").doc("user-2").update({ role: "dm" })
    ).resolves.toBeUndefined();
  });

  // ================================================================
  // CHARACTER CREATE — required fields enforced
  // ================================================================

  it("DM can create character with required initial values", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).set({
        userId: null,
        isEditableByPlayer: false,
        recoveryCode: "DH-ABCD-1234",
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot create character with userId already set", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).set({
        userId: "player-1",
        isEditableByPlayer: false,
        recoveryCode: "DH-ABCD-1234",
      })
    ).rejects.toThrow();
  });

  it("DM cannot create character with isEditableByPlayer set to true", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).set({
        userId: null,
        isEditableByPlayer: true,
        recoveryCode: "DH-ABCD-1234",
      })
    ).rejects.toThrow();
  });

  it("DM cannot create character without a recoveryCode", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).set({
        userId: null,
        isEditableByPlayer: false,
      })
    ).rejects.toThrow();
  });

  // ================================================================
  // CLAIM LOG — player scope (cannot write to another player's character)
  // ================================================================

  it("player cannot write a release log to a character they do not own", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    // player-2 tries to release a character owned by player-1
    const player2Db = dbAs(env, "player-2");
    await expect(
      player2Db
        .collection(`campaigns/${campaignId}/characters/${characterId}/claimLog`)
        .doc("bad-log")
        .set({ action: "release", actorUid: "player-2" })
    ).rejects.toThrow();
  });

  it("player cannot write a claim log to an already-claimed character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    // player-2 tries to claim a character already owned by player-1
    const player2Db = dbAs(env, "player-2");
    await expect(
      player2Db
        .collection(`campaigns/${campaignId}/characters/${characterId}/claimLog`)
        .doc("bad-claim")
        .set({ action: "claim", actorUid: "player-2" })
    ).rejects.toThrow();
  });

  it("player can release a character they own", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters/${characterId}/claimLog`)
        .doc("release-log")
        .set({ action: "release", actorUid: "player-1" })
    ).resolves.toBeUndefined();
  });

  // ================================================================
  // RECOVERY INDEX — characterId required on create
  // ================================================================

  it("DM can create recoveryIndex entry with both required fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("recoveryIndex").doc("DH-TEST-1234").set({
        campaignId,
        characterId,
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot create recoveryIndex entry without characterId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("recoveryIndex").doc("DH-TEST-5678").set({
        campaignId,
        // characterId missing
      })
    ).rejects.toThrow();
  });

  it("DM cannot create recoveryIndex entry without campaignId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.collection("recoveryIndex").doc("DH-TEST-9999").set({
        // campaignId missing
        characterId,
      })
    ).rejects.toThrow();
  });
});
