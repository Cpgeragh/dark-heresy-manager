// tests/firestore/rules/recoveryIndexRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  dbAnon,
  createCampaign,
  createRecoveryIndexEntry,
} from "../helpers";

describe("Firestore Rules: recoveryIndex", () => {
  const recoveryCode = "DH-TEST-1234";

  it("authenticated users may read recoveryIndex", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createRecoveryIndexEntry(env, recoveryCode, {
      campaignId: "camp1",
      characterId: "char1",
    });

    const userDb = dbAs(env, "player-1");

    await expect(
      userDb.collection("recoveryIndex").doc(recoveryCode).get()
    ).resolves.toBeDefined();
  });

  it("authenticated users may list recoveryIndex entries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createRecoveryIndexEntry(env, "CODE1", {
      campaignId: "camp1",
      characterId: "char1",
    });
    await createRecoveryIndexEntry(env, "CODE2", {
      campaignId: "camp1",
      characterId: "char2",
    });

    const userDb = dbAs(env, "player-1");

    await expect(
      userDb.collection("recoveryIndex").get()
    ).resolves.toBeDefined();
  });

  it("unauthenticated users cannot read recoveryIndex", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createRecoveryIndexEntry(env, recoveryCode, {
      campaignId: "camp1",
      characterId: "char1",
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("recoveryIndex").doc(recoveryCode).get()
    ).rejects.toThrow();
  });

  it("authenticated non-DM users cannot write recoveryIndex entries", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const userDb = dbAs(env, "player-1");

    await expect(
      userDb.collection("recoveryIndex").doc("NEWCODE").set({
        campaignId: "campX",
        characterId: "charX",
      })
    ).rejects.toThrow();
  });

  it("DM can write recoveryIndex entries when they own the campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("DMCODE").set({
        campaignId: "camp1",
        characterId: "char1",
      })
    ).resolves.toBeUndefined();
  });

  it("DM can update an existing recoveryIndex entry they own", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");
    await createRecoveryIndexEntry(env, "UPDATECODE", {
      campaignId: "camp1",
      characterId: "char1",
    });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("UPDATECODE").update({
        campaignId: "camp1",
        characterId: "char2",
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot write recoveryIndex entries if campaign does not exist", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("NO-CAMP").set({
        campaignId: "nonexistent",
        characterId: "char1",
      })
    ).rejects.toThrow();
  });

  it("DM cannot write recoveryIndex for campaigns they do NOT own", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    // Campaign owned by other DM
    await createCampaign(env, "campX", "other-dm");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("WRONG-DM").set({
        campaignId: "campX",
        characterId: "charX",
      })
    ).rejects.toThrow();
  });

  it("DM cannot write recoveryIndex if campaignId is missing", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("MISSING-CAMPID").set({
        // campaignId missing
        characterId: "char1",
      } as any)
    ).rejects.toThrow();
  });

  it("DM cannot write recoveryIndex if characterId is missing", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("recoveryIndex").doc("NO-CHARID").set({
        campaignId: "camp1",
        // characterId omitted
      } as any)
    ).rejects.toThrow();
  });
});