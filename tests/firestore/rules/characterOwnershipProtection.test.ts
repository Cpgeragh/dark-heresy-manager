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
        .update({ "header.characterName": "Updated Name" })
    ).resolves.toBeUndefined();
  });

  it("DM can change ownership flags but cannot silently replace the Recovery Code", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await setup(env);

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc(characterId).update({
        userId: "newplayer",
        isEditableByPlayer: false,
        recoveryCode: "DH-TEST-0001",
      })
    ).resolves.toBeUndefined();

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ recoveryCode: "DH-NEWW-0001" })
    ).rejects.toThrow();
  });

  it("DM can directly assign an unclaimed character and update membership, but claimLog is server-side only", async () => {
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

    await expect(batch.commit()).resolves.toBeUndefined();
    const character = await dmDb.doc(`campaigns/${campaignId}/characters/${characterId}`).get();
    expect(character.data()?.userId).toBe("dm-1");
    const campaign = await dmDb.doc(`campaigns/${campaignId}`).get();
    expect(campaign.data()?.memberIds).toContain("dm-1");

    await expect(
      dmDb.doc(`campaigns/${campaignId}/characters/${characterId}/claimLog/dm-claim`).set({
        action: "claim",
        actorUid: "dm-1",
        previousOwnerUid: null,
        newOwnerUid: "dm-1",
        timestamp: new Date(),
      })
    ).rejects.toThrow();
  });
});
