// tests/firestore/rules/customItemRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { getTestEnv } from "../setup";
import { createCampaign, dbAs } from "../helpers";

const campaignId = "custom-items-camp";
const itemId = "gear-1";
const versionId = "version-1";

function customItemPath(customItemId = itemId) {
  return `campaigns/${campaignId}/customItems/${customItemId}`;
}

function versionPath(customItemId = itemId, customVersionId = versionId) {
  return `${customItemPath(customItemId)}/versions/${customVersionId}`;
}

function gearData(name = "Custom Auspex") {
  return {
    name,
    description: "A campaign-made sensor device.",
    weight: "1 kg",
    value: "50 Thrones",
    availability: "Rare",
    source: "Custom",
  };
}

function draftItem(overrides: Record<string, unknown> = {}) {
  return {
    id: itemId,
    campaignId,
    category: "gear",
    status: "draft",
    name: "Custom Auspex",
    creator: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    createdAt: 1,
    updatedAt: 1,
    createdBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    publishedVersionId: null,
    draftVersionId: versionId,
    latestVersionId: versionId,
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data: gearData(),
    ...overrides,
  };
}

function draftVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: versionId,
    campaignId,
    customItemId: itemId,
    category: "gear",
    versionNumber: 1,
    status: "draft",
    data: gearData(),
    createdAt: 1,
    updatedAt: 1,
    createdBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
    publishedAt: null,
    publishedByUserId: null,
    ...overrides,
  };
}

async function seedCustomItem(
  env: RulesTestEnvironment,
  itemOverrides: Record<string, unknown> = {},
  versionOverrides: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().doc(customItemPath()).set(draftItem(itemOverrides));
    await ctx.firestore().doc(versionPath()).set(draftVersion(versionOverrides));
  });
}

describe("Firestore Rules: Campaign Custom Items", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("creator may create a draft custom item and draft version in one batch", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");

    const playerDb = dbAs(env, "player-1");
    const batch = playerDb.batch();
    batch.set(playerDb.doc(customItemPath()), draftItem());
    batch.set(playerDb.doc(versionPath()), draftVersion());

    await expect(batch.commit()).resolves.toBeUndefined();
  });

  it("creator and DM may read drafts, but another player may not", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    await expect(dbAs(env, "player-1").doc(customItemPath()).get()).resolves.toBeDefined();
    await expect(dbAs(env, "dm-1").doc(customItemPath()).get()).resolves.toBeDefined();
    await expect(dbAs(env, "player-2").doc(customItemPath()).get()).rejects.toThrow();
  });

  it("published custom items are readable by authenticated campaign users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(
      env,
      {
        status: "published",
        publishedVersionId: versionId,
        draftVersionId: null,
      },
      {
        status: "published",
        publishedAt: 2,
        publishedByUserId: "dm-1",
      }
    );

    await expect(dbAs(env, "player-2").doc(customItemPath()).get()).resolves.toBeDefined();
  });

  it("picker queries may list published items and a creator's own drafts", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);
    await seedCustomItem(
      env,
      {
        id: "gear-2",
        status: "published",
        publishedVersionId: "version-2",
        draftVersionId: null,
      },
      {
        id: "version-2",
        customItemId: "gear-2",
        status: "published",
        publishedAt: 2,
        publishedByUserId: "dm-1",
      }
    );

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.collection(`campaigns/${campaignId}/customItems`)
        .where("creator.userId", "==", "player-1")
        .get()
    ).resolves.toBeDefined();
    await expect(
      playerDb.collection(`campaigns/${campaignId}/customItems`)
        .where("status", "==", "published")
        .get()
    ).resolves.toBeDefined();
  });

  it("creator may update draft definition fields but may not publish", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.doc(customItemPath()).update({
        name: "Revised Auspex",
        data: gearData("Revised Auspex"),
        updatedAt: 2,
        updatedBy: { userId: "player-1", characterId: "char-1" },
      })
    ).resolves.toBeUndefined();

    await expect(
      playerDb.doc(customItemPath()).update({
        status: "published",
        publishedVersionId: versionId,
      })
    ).rejects.toThrow();
  });

  it("DM may publish/archive/delete custom items", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.doc(versionPath()).update({
        status: "published",
        publishedAt: 2,
        publishedByUserId: "dm-1",
        updatedAt: 2,
        updatedBy: { userId: "dm-1" },
      })
    ).resolves.toBeUndefined();
    await expect(
      dmDb.doc(customItemPath()).update({
        status: "published",
        publishedVersionId: versionId,
        draftVersionId: null,
        latestVersionId: versionId,
        updatedAt: 2,
        updatedBy: { userId: "dm-1" },
      })
    ).resolves.toBeUndefined();
    await expect(
      dmDb.doc(customItemPath()).update({
        status: "archived",
        archivedAt: 3,
        archivedByUserId: "dm-1",
        updatedAt: 3,
        updatedBy: { userId: "dm-1" },
      })
    ).resolves.toBeUndefined();
    await expect(dmDb.doc(versionPath()).delete()).resolves.toBeUndefined();
    await expect(dmDb.doc(customItemPath()).delete()).resolves.toBeUndefined();
  });

  it("creator can transition a published item back to draft when saving an edit", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, { status: "published", publishedVersionId: versionId, draftVersionId: null });

    await expect(
      dbAs(env, "player-1").doc(customItemPath()).update({
        name: "Revised Auspex",
        data: gearData("Revised Auspex"),
        status: "draft",
        draftVersionId: "version-2",
        latestVersionId: "version-2",
        latestVersionNumber: 2,
        updatedAt: 2,
        updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
      })
    ).resolves.toBeUndefined();
  });

  it("creator cannot transition draft to published", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    await expect(
      dbAs(env, "player-1").doc(customItemPath()).update({
        status: "published",
        publishedVersionId: versionId,
        draftVersionId: null,
        updatedAt: 2,
        updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
      })
    ).rejects.toThrow();
  });

  it("creator cannot transition to archived", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, { status: "published", publishedVersionId: versionId, draftVersionId: null });

    await expect(
      dbAs(env, "player-1").doc(customItemPath()).update({
        status: "archived",
        archivedAt: 2,
        archivedByUserId: "player-1",
        updatedAt: 2,
        updatedBy: { userId: "player-1", characterId: "char-1", characterName: "Acolyte" },
      })
    ).rejects.toThrow();
  });

  it("non-DM creator may not archive or delete custom items", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.doc(customItemPath()).update({
        status: "archived",
        archivedAt: 3,
        archivedByUserId: "player-1",
      })
    ).rejects.toThrow();
    await expect(playerDb.doc(versionPath()).delete()).rejects.toThrow();
    await expect(playerDb.doc(customItemPath()).delete()).rejects.toThrow();
  });

  it("DM can restore an archived item that was previously published", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, {
      status: "archived",
      publishedVersionId: versionId,
      archivedAt: 1,
      archivedByUserId: "dm-1",
    });

    const dmDb = dbAs(env, "dm-1");
    await expect(
      dmDb.doc(customItemPath()).update({ status: "published", archivedAt: null, archivedByUserId: null })
    ).resolves.not.toThrow();
  });

  it("non-DM cannot restore an archived item", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, {
      status: "archived",
      archivedAt: 1,
      archivedByUserId: "dm-1",
    });

    const playerDb = dbAs(env, "player-1");
    await expect(
      playerDb.doc(customItemPath()).update({ status: "draft", archivedAt: null, archivedByUserId: null })
    ).rejects.toThrow();
  });

  it("DM can permanently delete an archived item", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, {
      status: "archived",
      archivedAt: 1,
      archivedByUserId: "dm-1",
    });

    const dmDb = dbAs(env, "dm-1");
    await expect(dmDb.doc(customItemPath()).delete()).resolves.not.toThrow();
  });

  it("DM cannot permanently delete a draft item", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env);

    const dmDb = dbAs(env, "dm-1");
    await expect(dmDb.doc(customItemPath()).delete()).rejects.toThrow();
  });

  it("DM cannot permanently delete a published item", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createCampaign(env, campaignId, "dm-1");
    await seedCustomItem(env, {
      status: "published",
      publishedVersionId: versionId,
    });

    const dmDb = dbAs(env, "dm-1");
    await expect(dmDb.doc(customItemPath()).delete()).rejects.toThrow();
  });
});
