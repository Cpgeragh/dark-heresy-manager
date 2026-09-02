// tests/firestore/rules/characterOwnershipProtection.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Character Ownership Protection", () => {
  const campaignId = "camp1";
  const characterId = "char1";

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  async function setup(env: RulesTestEnvironment) {
    await createCampaign(env, campaignId, "dm-1");

    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
    });
  }

  it("player CANNOT change userId", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ userId: "hacker" })
    ).rejects.toThrow();
  });

  it("player CANNOT change isEditableByPlayer", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ isEditableByPlayer: false })
    ).rejects.toThrow();
  });

  it("player CANNOT change recoveryCode", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ recoveryCode: "NEWCODE" })
    ).rejects.toThrow();
  });

  it("player CAN change normal editable fields", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ backgroundComplete: true })
    ).resolves.toBeUndefined();
  });

  it("DM can change isEditableByPlayer directly but cannot change userId or silently replace the Recovery Code", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).update({
        isEditableByPlayer: false,
        recoveryCode: "DH-TEST-0001",
      })
    ).resolves.toBeUndefined();

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ userId: "newplayer" })
    ).rejects.toThrow();

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ recoveryCode: "DH-NEWW-0001" })
    ).rejects.toThrow();
  });

  it("DM cannot directly assign an unclaimed character any more, assignment goes through the forceAssignCharacter Function", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, characterId, {
      userId: null,
      isEditableByPlayer: false,
    });
    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    batch.update(dmDb.doc(`campaigns/${campaignId}/characters/${characterId}`), {
      userId: "dm-1",
    });
    batch.update(dmDb.doc(`campaigns/${campaignId}`), { memberIds: ["dm-1"] });

    await expect(batch.commit()).rejects.toThrow();
  });
});
