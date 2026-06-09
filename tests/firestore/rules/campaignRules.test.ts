// tests/firestore/rules/campaignRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign, createIdentityReclaimEntry } from "../helpers";

describe("Firestore Rules: Campaigns", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("authenticated users may read campaign documents", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", {
      name: "Sample Campaign",
    });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").get()
    ).resolves.toBeDefined();
  });

  it("authenticated users may list campaigns", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "One" });
    await createCampaign(env, "c2", "dm-2", { name: "Two" });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").get()
    ).resolves.toBeDefined();
  });

  it("DM may create a campaign when dmId matches their uid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-new").set({
        dmId: "dm-1",
        name: "Created by DM",
      })
    ).resolves.toBeUndefined();
  });

  it("DM may create a campaign with extra fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-extra").set({
        dmId: "dm-1",
        name: "With extras",
        description: "Extra field should be allowed",
        system: "Dark Heresy",
      })
    ).resolves.toBeUndefined();
  });

  it("cannot create a campaign without dmId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-no-dm").set({
        name: "Missing dmId",
      })
    ).rejects.toThrow();
  });

  it("non-DM cannot create campaign with mismatched dmId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").set({
        dmId: "dm-1",
        name: "Illicit Campaign",
      })
    ).rejects.toThrow();
  });

  it("non-DM cannot write campaign metadata", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Original" });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").update({
        name: "Hacked Campaign",
      })
    ).rejects.toThrow();
  });

  it("DM may write campaign metadata when dmId matches them (even if dmId not in update payload)", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

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
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").update({
        dmId: "dm-2",
      })
    ).rejects.toThrow();
  });

  it("DM can delete their own campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").delete()
    ).resolves.toBeUndefined();
  });

  it("DM can archive their own campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c1").update({ archivedAt: new Date() })
    ).resolves.toBeUndefined();
  });

  it("non-DM cannot archive a campaign", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "Sample" });

    const playerDb = dbAs(env, "player-1");

    await expect(
      playerDb.collection("campaigns").doc("c1").update({ archivedAt: new Date() })
    ).rejects.toThrow();
  });

  it("reclaimer can transfer dmId to their uid when a valid reclaim doc exists", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-old", { name: "Sample" });
    await createIdentityReclaimEntry(env, "dm-new", { oldUid: "dm-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "dm-new").collection("campaigns").doc("c1").update({ dmId: "dm-new" })
    ).resolves.toBeUndefined();
  });

  it("user without a reclaim doc cannot use the reclaim path to change dmId", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createCampaign(env, "c1", "dm-old", { name: "Sample" });

    await expect(
      dbAs(env, "dm-new").collection("campaigns").doc("c1").update({ dmId: "dm-new" })
    ).rejects.toThrow();
  });

});