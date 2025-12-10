// tests/firestore/rules/characterOwnershipProtection.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Character Ownership Protection", () => {
  const campaignId = "camp1";
  const characterId = "char1";

  async function setup(env: RulesTestEnvironment) {
    await createCampaign(env, campaignId, "dm-1");

    await createCharacter(env, campaignId, characterId, {
      userId: "player-1",
      isEditableByPlayer: true,
      recoveryCode: "RCODE",
      name: "Original Name",
    });
  }

  it("player CANNOT change userId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ userId: "hacker" })
    ).rejects.toThrow();
  });

  it("player CANNOT change isEditableByPlayer", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ isEditableByPlayer: false })
    ).rejects.toThrow();
  });

  it("player CANNOT change recoveryCode", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ recoveryCode: "NEWCODE" })
    ).rejects.toThrow();
  });

  it("player CAN change normal editable fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({ name: "Updated Name" })
    ).resolves.toBeUndefined();
  });

  it("DM CAN change all protected fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await setup(env);

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`)
        .doc(characterId)
        .update({
          userId: "newplayer",
          isEditableByPlayer: false,
          recoveryCode: "NEWCODE",
        })
    ).resolves.toBeUndefined();
  });
});