// tests/firestore/rules/customGrenadeRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import { createCampaign, dbAs } from "../helpers";

const campaignId = "grenade-camp";
const itemId = "grenade-1";
const versionId = "grenade-version-1";

const itemPath = `campaigns/${campaignId}/customItems/${itemId}`;
const versionPath = `${itemPath}/versions/${versionId}`;

const creator = { userId: "dm-1", characterId: "char-1", characterName: "Cormac" };

const grenadeData = {
  weaponKind: "grenade",
  name: "Frag Grenade",
  type: "Grenade",
  class: "Thrown",
  damage: "2d10 X",
  pen: "0",
  specialRules: "Compact, Blast (5)",
  weight: "10 kg",
  value: "40 Thrones",
  availability: "Average",
  source: "Custom",
};

function draftItem() {
  return {
    id: itemId,
    campaignId,
    category: "weapon",
    status: "draft",
    name: grenadeData.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: versionId,
    latestVersionId: versionId,
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data: grenadeData,
  };
}

function draftVersion() {
  return {
    id: versionId,
    campaignId,
    customItemId: itemId,
    category: "weapon",
    versionNumber: 1,
    status: "draft",
    data: grenadeData,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedAt: null,
    publishedByUserId: null,
  };
}

describe("Firestore Rules: custom grenades", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("refuses direct DM creation of a custom grenade draft and its first version", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1");

    const dmDb = dbAs(env, "dm-1");
    const batch = dmDb.batch();
    batch.set(dmDb.doc(itemPath), draftItem());
    batch.set(dmDb.doc(versionPath), draftVersion());

    await expect(batch.commit()).rejects.toThrow();
  });

  it("refuses direct creation from a linked DM device", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-primary");
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("userLinks/device-1").set({
        primaryUid: "dm-primary",
        createdAt: new Date(),
      });
    });

    const linkedCreator = { userId: "dm-primary", characterId: "char-1", characterName: "Cormac" };
    const deviceDb = dbAs(env, "device-1");
    const batch = deviceDb.batch();
    batch.set(deviceDb.doc(itemPath), {
      ...draftItem(),
      creator: linkedCreator,
      createdBy: linkedCreator,
      updatedBy: linkedCreator,
    });
    batch.set(deviceDb.doc(versionPath), {
      ...draftVersion(),
      createdBy: linkedCreator,
      updatedBy: linkedCreator,
    });

    await expect(batch.commit()).rejects.toThrow();
  });

  it("refuses direct player creation of a custom grenade draft and its first version", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });

    const playerCreator = { userId: "player-1", characterId: "char-2", characterName: "Acolyte" };
    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.set(playerDb.doc(itemPath), {
      ...draftItem(),
      creator: playerCreator,
      createdBy: playerCreator,
      updatedBy: playerCreator,
    });
    batch.set(playerDb.doc(versionPath), {
      ...draftVersion(),
      createdBy: playerCreator,
      updatedBy: playerCreator,
    });

    await expect(batch.commit()).rejects.toThrow();
  });
});
