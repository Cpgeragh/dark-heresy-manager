// tests/firestore/rules/characterRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";

describe("Firestore Rules: Character Rules", () => {
  const campaignId = "camp1";

  it("any authenticated user may read characters", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const readerDb = dbAs(env, "reader");

    await expect(
      readerDb.collection(`campaigns/${campaignId}/characters`).doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("any authenticated user may list characters in a campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    await createCharacter(env, campaignId, "char2", {
      userId: "player-2",
      isEditableByPlayer: false,
    });

    const readerDb = dbAs(env, "reader");

    await expect(
      readerDb.collection(`campaigns/${campaignId}/characters`).get()
    ).resolves.toBeDefined();
  });

  it("player may update their own character when editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      name: "Original",
      recoveryCode: "RCODE",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "Updated" })
    ).resolves.toBeUndefined();
  });

  it("player may update multiple normal editable fields at once", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      recoveryCode: "RCODE",
      name: "Original",
      career: "Adept",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({
          name: "Updated",
          career: "Guardsman",
        })
    ).resolves.toBeUndefined();
  });

  it("player cannot update their character when NOT editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: false,
      name: "Original",
      recoveryCode: "RCODE",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "NewName" })
    ).rejects.toThrow();
  });

  it("player cannot update another user's character even if editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
      recoveryCode: "RCODE",
    });

    const otherPlayerDb = dbAs(env, "player-2");

    await expect(
      otherPlayerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "Illegal update" })
    ).rejects.toThrow();
  });

  it("DM can update any character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: false,
    });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ name: "DM update" })
    ).resolves.toBeUndefined();
  });

  it("DM can create a character in an existing campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("dm-char")
        .set({
          userId: "player-1",
          isEditableByPlayer: false,
          recoveryCode: "RCODE",
        })
    ).resolves.toBeUndefined();
  });

  it("DM cannot create a character in a non-existent campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(`campaigns/nonexistent/characters`)
        .doc("dm-char")
        .set({
          userId: "player-1",
          isEditableByPlayer: false,
          recoveryCode: "RCODE",
        })
    ).rejects.toThrow();
  });

  it("player cannot create a character directly", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    const db = dbAs(env, "player-1");

    await expect(
      db.collection(`campaigns/${campaignId}/characters`).doc("char-new").set({
        userId: "player-1",
      })
    ).rejects.toThrow();
  });

  it("player cannot delete their character even if editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .delete()
    ).rejects.toThrow();
  });

});