// tests/firestore/rules/edgeCases.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { dbAs, createCampaign } from "../helpers";

describe("Firestore Rules: Edge Cases", () => {

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

  it("DM can create campaign with very long name", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    const longName = "A".repeat(1000);
    
    await expect(
      dmDb.collection("campaigns").doc("c-long-name").set({
        dmId: "dm-1",
        name: longName
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with empty string fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-empty").set({
        dmId: "dm-1",
        name: "",
        description: ""
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with numeric fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-numbers").set({
        dmId: "dm-1",
        name: "Campaign with Numbers",
        sessionCount: 42,
        maxPlayers: 6,
        experience: 10000
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with boolean fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-booleans").set({
        dmId: "dm-1",
        name: "Campaign with Booleans",
        isActive: true,
        acceptingPlayers: false,
        isPublic: true
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with array fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-arrays").set({
        dmId: "dm-1",
        name: "Campaign with Arrays",
        players: ["player-1", "player-2", "player-3"],
        tags: ["dark-heresy", "warhammer", "40k"],
        allowedRaces: []
      })
    ).resolves.toBeUndefined();
  });

  it("DM can create campaign with nested object fields", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    
    const dmDb = dbAs(env, "dm-1");
    
    await expect(
      dmDb.collection("campaigns").doc("c-nested").set({
        dmId: "dm-1",
        name: "Campaign with Nested Objects",
        settings: {
          difficulty: "hard",
          pvpEnabled: false,
          houseRules: {
            criticalHits: "modified",
            initiative: "group"
          }
        }
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