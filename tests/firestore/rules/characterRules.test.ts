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
    const env = (await getTestEnv()) as RulesTestEnvironment;
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
    const env = (await getTestEnv()) as RulesTestEnvironment;
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
    const env = (await getTestEnv()) as RulesTestEnvironment;
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
      dbAs(env, "player-2").collection(`campaigns/${campaignId}/characters`).doc("char1").get()
    ).rejects.toThrow();
  });

  it("the DM may list all characters in their own campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
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
    const env = (await getTestEnv()) as RulesTestEnvironment;
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
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
        .update({ backgroundComplete: true })
    ).resolves.toBeUndefined();
  });

  it("player may update multiple normal editable fields at once", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`).doc("char1").update({
        backgroundComplete: true,
        userId: "player-1", // protected but same, proves a multi-key write still succeeds
        isEditableByPlayer: true, // protected but same
      })
    ).resolves.toBeUndefined();
  });

  it("player cannot update their character when NOT editable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
        .update({ backgroundComplete: true })
    ).rejects.toThrow();
  });

  it("player cannot update another user's character even if editable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
        .update({ backgroundComplete: true })
    ).rejects.toThrow();
  });

  it("DM cannot change notes with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
    const env = (await getTestEnv()) as RulesTestEnvironment;

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

  it("DM cannot change portraitUrl with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ portraitUrl: "data:image/jpeg;base64,aaaa" })
    ).rejects.toThrow();
  });

  it("an editable player cannot change portraitUrl with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ portraitUrl: "data:image/jpeg;base64,aaaa" })
    ).rejects.toThrow();
  });

  it("DM cannot change characteristics with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ "characteristics.ws.advances": 5 })
    ).rejects.toThrow();
  });

  it("an editable player cannot change characteristics with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "player-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ "characteristics.ws.advances": 5 })
    ).rejects.toThrow();
  });

  it("DM cannot change talentsAndTraits with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ talentsAndTraits: { talents: [], traits: [] } })
    ).rejects.toThrow();
  });

  it("DM cannot change weaponTraining with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ weaponTraining: { trained: [] } })
    ).rejects.toThrow();
  });

  it("DM cannot change psychic with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ psychic: { psyRating: 1 } })
    ).rejects.toThrow();
  });

  it("DM cannot change insanity with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ insanity: { points: 5 } })
    ).rejects.toThrow();
  });

  it("DM cannot change cybernetics with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ cybernetics: [] })
    ).rejects.toThrow();
  });

  it("DM cannot change rangedWeapons with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ rangedWeapons: [{ id: "r1", name: "Laspistol" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change meleeWeapons with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ meleeWeapons: [{ id: "m1", name: "Chainsword" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change archeotech with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ archeotech: [] })
    ).rejects.toThrow();
  });

  it("DM cannot change gear with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ gear: [{ id: "g1", name: "Rope" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change consumables with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ consumables: [{ id: "c1", name: "Ration Pack" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change drugs with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ drugs: [{ id: "d1", name: "Obscura" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change grenades with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ grenades: [{ id: "gr1", name: "Frag Grenade" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change shields with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ shields: [{ id: "s1", name: "Riot Shield" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change armour with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ armour: [{ id: "a1", name: "Flak Vest" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change companions with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ companions: [{ id: "co1", name: "Cyber-mastiff" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change skills with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ skills: [{ id: "sk1", level: "trained" }] })
    ).rejects.toThrow();
  });

  it("DM cannot change wounds with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ wounds: { total: 10, current: 8, criticalDamage: 0, fatigue: 0 } })
    ).rejects.toThrow();
  });

  it("DM cannot change fate with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ fate: { total: 3, current: 2 } })
    ).rejects.toThrow();
  });

  it("DM cannot change corruption with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ corruption: { points: 5, malignancies: [] } })
    ).rejects.toThrow();
  });

  it("DM cannot change movement with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ movement: { half: 3, full: 6, charge: 9, run: 18 } })
    ).rejects.toThrow();
  });

  it("DM cannot change experience with a direct write", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("char1")
        .update({ experience: { ranks: [], total: 500, spent: 100 } })
    ).rejects.toThrow();
  });

  it("DM can update any character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
        .update({ backgroundComplete: true })
    ).resolves.toBeUndefined();
  });

  it("DM can create a character in an existing campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection(`campaigns/${campaignId}/characters`)
        .doc("dm-char")
        .set(createEmptyCharacterData({ campaignId, characterName: "New Acolyte" }))
    ).resolves.toBeUndefined();
  });

  it("DM cannot pre-populate a Recovery Code during character creation", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

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
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "revoked-char", {
      userId: null,
      recoveryCode: "",
    });

    await expect(
      dbAs(env, "dm-1")
        .collection(`campaigns/${campaignId}/characters`)
        .doc("revoked-char")
        .update({ backgroundComplete: true })
    ).resolves.toBeUndefined();
  });

  it("DM cannot create a character in a non-existent campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection(`campaigns/nonexistent/characters`).doc("dm-char").set({
        userId: "player-1",
        isEditableByPlayer: false,
        recoveryCode: "RCODE",
      })
    ).rejects.toThrow();
  });

  it("player cannot create a character directly", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");

    const db = dbAs(env, "player-1");

    await expect(
      db.collection(`campaigns/${campaignId}/characters`).doc("char-new").set({
        userId: "player-1",
      })
    ).rejects.toThrow();
  });

  it("player cannot delete their character even if editable", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, campaignId, "dm-1");
    await createCharacter(env, campaignId, "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection(`campaigns/${campaignId}/characters`).doc("char1").delete()
    ).rejects.toThrow();
  });
});
