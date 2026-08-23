import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import {
  createCampaign,
  createCharacter,
  createRecoveryIndexEntry,
  dbAnon,
  dbAs,
} from "../helpers";

const campaignId = "c1";
const characterId = "char1";
const recoveryCode = "DH-TEST-0001";

describe("Firestore Rules: Recovery Index", () => {
  afterEach(async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await env.clearFirestore();
  });

  it("allows authenticated exact-code reads but denies enumeration and anonymous reads", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createRecoveryIndexEntry(env, recoveryCode, { campaignId, characterId });

    await expect(dbAs(env, "user-1").collection("recoveryIndex").doc(recoveryCode).get()).resolves.toBeDefined();
    await expect(dbAs(env, "user-1").collection("recoveryIndex").get()).rejects.toThrow();
    await expect(dbAnon(env).collection("recoveryIndex").doc(recoveryCode).get()).rejects.toThrow();
  });

  it("allows the campaign DM to repair a missing matching index entry", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { recoveryCode });

    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(recoveryCode).set({
        campaignId,
        characterId,
      })
    ).resolves.toBeUndefined();
  });

  it("rejects non-DM, malformed, mismatched, and unexpected index creates", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { recoveryCode });

    const playerIndex = dbAs(env, "player-1").collection("recoveryIndex");
    const dmIndex = dbAs(env, "dm-1").collection("recoveryIndex");
    const value = { campaignId, characterId };
    await expect(playerIndex.doc(recoveryCode).set(value)).rejects.toThrow();
    await expect(dmIndex.doc("INVALID").set(value)).rejects.toThrow();
    await expect(dmIndex.doc("DH-WRNG-0001").set(value)).rejects.toThrow();
    await expect(dmIndex.doc(recoveryCode).set({ ...value, createdAt: new Date() })).rejects.toThrow();
  });

  it("makes index records immutable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { recoveryCode });
    await createRecoveryIndexEntry(env, recoveryCode, { campaignId, characterId });

    await expect(
      dbAs(env, "dm-1").collection("recoveryIndex").doc(recoveryCode).update({
        characterId: "other",
      })
    ).rejects.toThrow();
  });

  it("allows deletion only with deletion of the indexed character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, { recoveryCode });
    await createRecoveryIndexEntry(env, recoveryCode, { campaignId, characterId });

    const dmDb = dbAs(env, "dm-1");
    await expect(dmDb.collection("recoveryIndex").doc(recoveryCode).delete()).rejects.toThrow();

    const batch = dmDb.batch();
    batch.delete(dmDb.collection("recoveryIndex").doc(recoveryCode));
    batch.delete(dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId));
    await expect(batch.commit()).resolves.toBeUndefined();
  });
});
