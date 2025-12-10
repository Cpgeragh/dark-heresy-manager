// tests/firestore/rules/unauthenticatedRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext,
} from "@firebase/rules-unit-testing";
import {
  dbAnon,
  createCampaign,
  createCharacter,
  createRecoveryIndexEntry,
} from "../helpers";

describe("Firestore Rules: Unauthenticated access", () => {
  it("unauthenticated user cannot read campaigns", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "test-camp", "dm-123", { name: "Example" });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("campaigns").doc("test-camp").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot list campaigns", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "c1", "dm-1", { name: "One" });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("campaigns").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot write campaigns", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("campaigns").doc("new-camp").set({
        dmId: "someone",
        name: "Hacked",
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot read users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx.firestore().collection("users").doc("u1").set({ role: "player" });
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("users").doc("u1").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot list users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      const db = ctx.firestore();
      await db.collection("users").doc("u1").set({ role: "player" });
      await db.collection("users").doc("u2").set({ role: "player" });
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("users").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot write users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("users").doc("u1").set({ role: "player" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot read recoveryIndex", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createRecoveryIndexEntry(env, "CODE-1", {
      campaignId: "camp1",
      characterId: "char1",
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("recoveryIndex").doc("CODE-1").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot list recoveryIndex", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createRecoveryIndexEntry(env, "CODE-1", {
      campaignId: "camp1",
      characterId: "char1",
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("recoveryIndex").get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot write recoveryIndex", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("recoveryIndex").doc("CODE-2").set({
        campaignId: "camp1",
        characterId: "char1",
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot read characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");
    await createCharacter(env, "camp1", "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb
        .collection(`campaigns/camp1/characters`)
        .doc("char1")
        .get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot list characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");
    await createCharacter(env, "camp1", "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb
        .collection(`campaigns/camp1/characters`)
        .get()
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot write characters", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const anonDb = dbAnon(env);

    await expect(
      anonDb
        .collection(`campaigns/camp1/characters`)
        .doc("char-new")
        .set({
          userId: "player-1",
          isEditableByPlayer: true,
        })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot delete any campaign or character", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await createCampaign(env, "camp1", "dm-1");
    await createCharacter(env, "camp1", "char1", {
      userId: "player-1",
      isEditableByPlayer: true,
    });

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("campaigns").doc("camp1").delete()
    ).rejects.toThrow();

    await expect(
      anonDb.collection("campaigns/camp1/characters").doc("char1").delete()
    ).rejects.toThrow();
  });
});