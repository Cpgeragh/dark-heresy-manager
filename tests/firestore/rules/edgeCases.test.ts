// tests/firestore/rules/edgeCases.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign } from "../helpers";

describe("Firestore Rules: Edge Cases", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("cannot update non-existent campaign even as authenticated user", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("nonexistent-edge").update({
        name: "Trying to update"
      })
    ).rejects.toThrow();
  });

  it("DM can create campaign with special characters in name", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-special-chars").set({
        dmId: "dm-1",
        name: "Test's \"Campaign\" & More! <script>alert('xss')</script>",
        description: "Special chars: @#$%^&*()",
        notes: "Unicode: 你好 мир 🎮"
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with timestamp fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-timestamps").set({
        dmId: "dm-1",
        name: "Campaign with Timestamps",
        createdAt: Date.now(),
        lastSession: new Date("2024-01-15"),
        nextSession: new Date("2024-02-01")
      })
    ).resolves.toBeUndefined();
  });

  it("campaign can have document ID different from campaign name", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("random-id-12345").set({
        dmId: "dm-1",
        name: "Actual Campaign Name"
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with null values in optional fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-nulls").set({
        dmId: "dm-1",
        name: "Campaign with Nulls",
        description: null,
        notes: null,
        imageUrl: null
      })
    ).resolves.toBeUndefined();
  });

  it("user can create their own user document with special characters", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const userDb = dbAs(env, "user-special-123");
    
    await expect(
      userDb.collection("users").doc("user-special-123").set({
        role: "player",
        displayName: "Player's \"Name\" & More!",
        email: "test+special@example.com"
      })
    ).resolves.toBeUndefined();
  });
});