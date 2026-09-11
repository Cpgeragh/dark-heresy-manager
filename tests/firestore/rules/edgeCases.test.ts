// tests/firestore/rules/edgeCases.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import { createCampaign, dbAs } from "../helpers";

describe("Firestore Rules: Edge Cases", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot update non-existent campaign even as authenticated user", async () => {
    const env = await getTestEnv();

    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("nonexistent-edge").update({
        name: "Trying to update",
      })
    ).rejects.toThrow();
  });

  it("DM can update a campaign to a name with special characters", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c-special-chars", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-special-chars").update({
        name: 'Test\'s "Campaign" & More! 你好 мир 🎮',
      })
    ).resolves.toBeUndefined();
  });

  it("DM can archive a campaign with a timestamp", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c-timestamps", "dm-1");
    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb
        .collection("campaigns")
        .doc("c-timestamps")
        .update({
          archivedAt: new Date("2024-02-01"),
        })
    ).resolves.toBeUndefined();
  });

  it("campaign can have document ID different from campaign name", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "random-id-12345", "dm-1", { name: "Actual Campaign Name" });
    const dmDb = dbAs(env, "dm-1");

    await expect(dmDb.collection("campaigns").doc("random-id-12345").get()).resolves.toMatchObject({
      exists: true,
    });
  });

  it("campaigns may omit optional fields", async () => {
    const env = await getTestEnv();
    await createCampaign(env, "c-no-optionals", "dm-1", { name: "Campaign without optionals" });
    const dmDb = dbAs(env, "dm-1");

    await expect(
      dmDb.collection("campaigns").doc("c-no-optionals").update({ name: "Still valid" })
    ).resolves.toBeUndefined();
  });

  it("user cannot add profile or email fields to their private account document", async () => {
    const env = await getTestEnv();

    const userDb = dbAs(env, "user-special-123");

    await expect(
      userDb.collection("users").doc("user-special-123").set({
        role: "player",
        displayName: 'Player\'s "Name" & More!',
        email: "test+special@example.com",
      })
    ).rejects.toThrow();
  });
});
