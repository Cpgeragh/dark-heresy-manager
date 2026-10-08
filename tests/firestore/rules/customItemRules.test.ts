import { afterEach, describe, expect, it } from "vitest";
import type { RulesTestContext, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { createCampaign, dbAs } from "../helpers";
import { getTestEnv } from "../setup";

const campaignId = "custom-items-camp";
const itemId = "gear-1";
const versionId = "version-1";
const itemPath = `campaigns/${campaignId}/customItems/${itemId}`;
const versionPath = `${itemPath}/versions/${versionId}`;

const creator = { userId: "player-1", characterId: "char-1", characterName: "Acolyte" };
const data = {
  name: "Custom Auspex",
  description: "A campaign-made sensor device.",
  weight: "1 kg",
  value: "50 Thrones",
  availability: "Rare",
  source: "Custom",
};

function draftItem() {
  return {
    id: itemId,
    campaignId,
    category: "gear",
    status: "draft",
    name: data.name,
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
    data,
  };
}

function draftVersion() {
  return {
    id: versionId,
    campaignId,
    customItemId: itemId,
    category: "gear",
    versionNumber: 1,
    status: "draft",
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedAt: null,
    publishedByUserId: null,
  };
}

async function seedCustomItem(env: RulesTestEnvironment) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().doc(itemPath).set(draftItem());
    await ctx.firestore().doc(versionPath).set(draftVersion());
  });
}

describe("Firestore Rules: Campaign Custom Items", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("refuses direct client creation of an item and its first version", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });
    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.set(playerDb.doc(itemPath), draftItem());
    batch.set(playerDb.doc(versionPath), draftVersion());
    await expect(batch.commit()).rejects.toThrow();
  });

  it("refuses direct client updates and deletes of an item and version", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });
    await seedCustomItem(env);
    for (const uid of ["dm-1", "player-1"]) {
      const db = dbAs(env, uid);
      await expect(db.doc(itemPath).update({ name: "Changed" })).rejects.toThrow();
      await expect(
        db.doc(versionPath).update({ data: { ...data, name: "Changed" } })
      ).rejects.toThrow();
      await expect(db.doc(itemPath).delete()).rejects.toThrow();
      await expect(db.doc(versionPath).delete()).rejects.toThrow();
    }
  });

  it("keeps the existing custom-item read access", async () => {
    const env = await getTestEnv();
    await createCampaign(env, campaignId, "dm-1", { memberIds: ["player-1"] });
    await seedCustomItem(env);
    await expect(dbAs(env, "player-1").doc(itemPath).get()).resolves.toBeDefined();
    await expect(dbAs(env, "dm-1").doc(itemPath).get()).resolves.toBeDefined();
    await expect(dbAs(env, "outsider").doc(itemPath).get()).rejects.toThrow();
  });
});
