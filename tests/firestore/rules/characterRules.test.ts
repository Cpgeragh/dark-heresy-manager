// tests/firestore/rules/characterRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createCharacter } from "../helpers";
import { createEmptyCharacterData } from "../../../src/utils/characterFactory";

describe("Firestore Rules: Character Rules", () => {
  const campaignId = "camp1";

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("the owning player may read their own character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1").collection(`campaigns/${campaignId}/characters`).doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("the DM may read any character in their campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1").collection(`campaigns/${campaignId}/characters`).doc("char1").get()
    ).resolves.toBeDefined();
  });

  it("an unrelated authenticated user cannot read someone else's character", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "reader").collection(`campaigns/${campaignId}/characters`).doc("char1").get()
    ).rejects.toThrow();
  });

  it("a campaign member may read another character's summary but not their full sheet", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1", {
      memberIds: ["player-1", "player-2"],
    });
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-2")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .get()
    ).rejects.toThrow();
  });

  it("the DM may list all characters in their own campaign", async () => {
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

    const characters = dbAs(env, "dm-1").collection(`campaigns/${campaignId}/characters`);
    await expect(characters.limit(100).get()).resolves.toBeDefined();
    await expect(characters.get()).rejects.toThrow();
    await expect(characters.limit(101).get()).rejects.toThrow();
  });

  it("an unrelated authenticated user cannot list characters in a campaign they're not in", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "reader").collection(`campaigns/${campaignId}/characters`).limit(100).get()
    ).rejects.toThrow();
  });

  it("player may update their own character when editable", async () => {
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
        .update({ armour: [] })
    ).resolves.toBeUndefined();
  });

  it("player may update multiple normal editable fields at once", async () => {
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
        .update({
          armour: [],
          gear: [],
        })
    ).resolves.toBeUndefined();
  });

  it("player cannot update their character when NOT editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: false,
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ armour: [] })
    ).rejects.toThrow();
  });

  it("player cannot update another user's character even if editable", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const otherPlayerDb = dbAs(env, "player-2");

    await expect(
      otherPlayerDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ armour: [] })
    ).rejects.toThrow();
  });

  it("DM cannot change notes with a direct write", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ notes: "Snuck in via a direct write." })
    ).rejects.toThrow();
  });

  it("an editable player cannot change notes with a direct write", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ notes: "Snuck in via a direct write." })
    ).rejects.toThrow();
  });

  it("DM cannot change header with a direct write", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ header: { characterName: "Snuck in via a direct write" } })
    ).rejects.toThrow();
  });

  it("an editable player cannot change header with a direct write", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ header: { characterName: "Snuck in via a direct write" } })
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
        .update({ armour: [] })
    ).resolves.toBeUndefined();
  });

  it("DM can create a character in an existing campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection(`campaigns/${campaignId}/characters`).doc("dm-char").set(
        createEmptyCharacterData({ campaignId, characterName: "New Acolyte" })
      )
    ).resolves.toBeUndefined();
  });

  it("DM cannot pre-populate a Recovery Code during character creation", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("dm-char")
        .set(
          createEmptyCharacterData({
            campaignId,
            recoveryCode: "DH-NEWW-0001",
            characterName: "New Acolyte",
          })
        )
    ).rejects.toThrow();
  });

  it("DM can edit a character after its Recovery Code is revoked", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "revoked-char", {
      userId: null,
      recoveryCode: "",
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("revoked-char")
        .update({ armour: [] })
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
