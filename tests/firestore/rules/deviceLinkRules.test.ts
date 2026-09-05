// tests/firestore/rules/deviceLinkRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { dbAs, createIdentitySecretEntry, createCampaign, createCharacter } from "../helpers";

// Create a userLinks doc bypassing rules (to simulate an already-linked device).
async function createUserLink(env: RulesTestEnvironment, uid: string, primaryUid: string) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("userLinks").doc(uid).set({ primaryUid, linkedAt: 1 });
  });
}

// ============================================================
// linkProofs/{uid} — retired collection, nothing writes to it anymore
// ============================================================
describe("Firestore Rules: linkProofs (retired collection)", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot create a linkProofs document at all — collection is sealed", async () => {
    const env = await getTestEnv();
    await createIdentitySecretEntry(env, "primary-1", { code: "DH-LINK-0001" });

    await expect(
      dbAs(env, "device-1")
        .collection("linkProofs")
        .doc("device-1")
        .set({ primaryUid: "primary-1", code: "DH-LINK-0001" })
    ).rejects.toThrow();
  });
});

// ============================================================
// userLinks/{uid} — create/update retired, linking goes through linkDevice
// ============================================================
describe("Firestore Rules: userLinks", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot create a link directly — device linking goes through the linkDevice Function", async () => {
    const env = await getTestEnv();

    await expect(
      dbAs(env, "device-1")
        .collection("userLinks")
        .doc("device-1")
        .set({ primaryUid: "victim-1", linkedAt: 1 })
    ).rejects.toThrow();
  });

  it("can delete your own link", async () => {
    const env = await getTestEnv();
    await createUserLink(env, "device-1", "primary-1");

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1").delete()
    ).resolves.toBeUndefined();
  });
});

// ============================================================
// Character claim — ownership = account (self or linked primary)
// ============================================================
describe("Firestore Rules: character claim ownership", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot claim an unclaimed character via direct update — claiming goes through the claimCharacter Function", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1");
    await createCharacter(env, "c1", "char-1", { userId: null });

    await expect(
      dbAs(env, "player-1")
        .collection("campaigns/c1/characters")
        .doc("char-1")
        .update({ userId: "player-1" })
    ).rejects.toThrow();
  });
});

// ============================================================
// Campaign membership — self-add is retired, claiming goes through Functions
// ============================================================
describe("Firestore Rules: campaign membership (claim)", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot self-add to memberIds via direct update — claiming goes through the claimCharacter Function", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c1", "dm-1", { memberIds: [] });

    await expect(
      dbAs(env, "player-1")
        .collection("campaigns")
        .doc("c1")
        .update({ memberIds: ["player-1"] })
    ).rejects.toThrow();
  });
});
