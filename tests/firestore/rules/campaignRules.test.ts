// tests/firestore/rules/campaignRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  createCampaign,
  createCharacter,
  createIdentityReclaimEntry,
  createRecoveryIndexEntry,
} from "../helpers";

describe("Firestore Rules: Campaigns", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("the DM may read their own campaign document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample Campaign" });

    await expect(dbAs(env, "dm-1").collection("campaigns").doc("c1").get()).resolves.toBeDefined();
  });

  it("a member may read a campaign they belong to", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample Campaign", memberIds: ["player-1"] });

    await expect(dbAs(env, "player-1").collection("campaigns").doc("c1").get()).resolves.toBeDefined();
  });

  it("an unrelated authenticated user cannot read a campaign they're not part of", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample Campaign" });

    await expect(dbAs(env, "player-1").collection("campaigns").doc("c1").get()).rejects.toThrow();
  });

  it("the DM may list their own campaigns", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "One" });
    await createCampaign(env, "c2", "dm-1", { name: "Two" });

    const campaigns = dbAs(env, "dm-1").collection("campaigns").where("dmId", "==", "dm-1");
    await expect(campaigns.limit(100).get()).resolves.toBeDefined();
  });

  it("an unrelated authenticated user cannot list campaigns they're not part of", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "One" });
    await createCampaign(env, "c2", "dm-2", { name: "Two" });

    await expect(
      dbAs(env, "player-1").collection("campaigns").limit(100).get()
    ).rejects.toThrow();
  });

  it("player membership query returns only active campaigns containing that player", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "active-member", "dm-1", {
      memberIds: ["player-1"],
      archivedAt: null,
    });
    await createCampaign(env, "archived-member", "dm-1", {
      memberIds: ["player-1"],
      archivedAt: new Date(),
    });
    await createCampaign(env, "active-other", "dm-1", {
      memberIds: ["player-2"],
      archivedAt: null,
    });

    const snapshot = await dbAs(env, "player-1")
      .collection("campaigns")
      .where("memberIds", "array-contains", "player-1")
      .where("archivedAt", "==", null)
      .limit(100)
      .get();

    expect(snapshot.docs.map((document) => document.id)).toEqual(["active-member"]);
  });

  it("DM may create a campaign when dmId matches their uid", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-new").set({
        dmId: "dm-1",
        name: "Created by DM",
        memberIds: [],
        createdAt: new Date(),
        archivedAt: null,
      })
    ).resolves.toBeUndefined();
  });

  it("an authenticated player may create a campaign and thereby become its DM", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const userDb = dbAs(env, "player-creator");

    await expect(
      userDb.collection("campaigns").doc("player-created").set({
        dmId: "player-creator",
        name: "Player-created campaign",
        gmName: "New GM",
        inquisitorName: "",
        memberIds: [],
        createdAt: new Date(),
        archivedAt: null,
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot create a campaign with unrecognised fields", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-extra").set({
        dmId: "dm-1",
        name: "With extras",
        description: "Extra field should be allowed",
        system: "Dark Heresy",
      })
    ).rejects.toThrow();
  });

  it("cannot create a campaign without dmId", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-no-dm").set({
        name: "Missing dmId",
      })
    ).rejects.toThrow();
  });

  it("non-DM cannot create campaign with mismatched dmId", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").set({
        dmId: "dm-1",
        name: "Illicit Campaign",
      })
    ).rejects.toThrow();
  });

  it("non-DM cannot write campaign metadata", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Original" });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").update({
        name: "Hacked Campaign",
      })
    ).rejects.toThrow();
  });

  it("DM may write campaign metadata when dmId matches them (even if dmId not in update payload)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Original" });

    const dmDb = dbAs(env, "dm-1");

    // Note: we only change name; dmId stays the same in resource.
    await expect(
      dmDb.collection("campaigns").doc("c1").update({
        name: "DM Updated",
      })
    ).resolves.toBeUndefined();
  });

  it("DM cannot change campaign dmId to someone else", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").update({
        dmId: "dm-2",
      })
    ).rejects.toThrow();
  });

  it("DM can delete their own campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(dmDb.collection("campaigns").doc("c1").delete()).resolves.toBeUndefined();
  });

  it("DM can atomically delete a campaign and its known descendant tree", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const recoveryCode = "DH-TEST-0001";
    await createCampaign(env, "c1", "dm-1", { name: "Sample" });
    await createCharacter(env, "c1", "char-1", { recoveryCode });
    await createRecoveryIndexEntry(env, recoveryCode, {
      campaignId: "c1",
      characterId: "char-1",
    });
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await Promise.all([
        db.doc("campaigns/c1/characters/char-1/claimLog/log-1").set({ seeded: true }),
        db.doc("campaigns/c1/characters/char-1/xpProposals/proposal-1").set({ seeded: true }),
        db.doc("campaigns/c1/sessions/session-1").set({ seeded: true }),
        db.doc("campaigns/c1/threads/char-1").set({ seeded: true }),
        db.doc("campaigns/c1/threads/char-1/messages/message-1").set({ seeded: true }),
        db.doc("campaigns/c1/customItems/item-1").set({ status: "published" }),
        db.doc("campaigns/c1/customItems/item-1/versions/version-1").set({ seeded: true }),
      ]);
    });

    const dmDb = dbAs(env, "dm-1");
    const paths = [
      "campaigns/c1/characters/char-1/claimLog/log-1",
      "campaigns/c1/characters/char-1/xpProposals/proposal-1",
      "campaigns/c1/threads/char-1/messages/message-1",
      "campaigns/c1/threads/char-1",
      "recoveryIndex/DH-TEST-0001",
      "campaigns/c1/characters/char-1",
      "campaigns/c1/sessions/session-1",
      "campaigns/c1/customItems/item-1/versions/version-1",
      "campaigns/c1/customItems/item-1",
      "campaigns/c1",
    ];
    const batch = dmDb.batch();
    paths.forEach((path) => batch.delete(dmDb.doc(path)));

    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("DM can archive their own campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").update({ archivedAt: new Date() })
    ).resolves.toBeUndefined();
  });

  it("non-DM cannot archive a campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").update({ archivedAt: new Date() })
    ).rejects.toThrow();
  });

  it("DM can restore their own archived campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample", archivedAt: new Date() });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").update({ archivedAt: null })
    ).resolves.toBeUndefined();
  });

  it("non-DM cannot restore someone else's archived campaign", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample", archivedAt: new Date() });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").update({ archivedAt: null })
    ).rejects.toThrow();
  });

  it("dmId can never be changed via update, even with a forged reclaim doc", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-old", { name: "Sample" });
    await createIdentityReclaimEntry(env, "dm-new", { oldUid: "dm-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "dm-new").collection("campaigns").doc("c1").update({ dmId: "dm-new" })
    ).rejects.toThrow();
  });

  it("memberIds can never be self-added via update, even with a forged reclaim doc", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-1", {
      name: "Sample",
      memberIds: ["player-old", "player-other"],
    });
    await createIdentityReclaimEntry(env, "player-new", { oldUid: "player-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "player-new")
        .collection("campaigns")
        .doc("c1")
        .update({ memberIds: ["player-other", "player-new"] })
    ).rejects.toThrow();
  });
});
