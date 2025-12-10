// tests/firestore/rules/usersRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext,
} from "@firebase/rules-unit-testing";
import { dbAs, dbAnon } from "../helpers";

describe("Firestore Rules: Users", () => {
  async function seedUsers(env: RulesTestEnvironment) {
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      const db = ctx.firestore();
      await db.collection("users").doc("u1").set({ role: "player" });
      await db.collection("users").doc("u2").set({ role: "player" });
    });
  }

  it("user can read their own user document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").doc("u1").get()
    ).resolves.toBeDefined();
  });

  it("user cannot read another user's document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").doc("u2").get()
    ).rejects.toThrow();
  });

  it("user cannot write to another user's document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").doc("u2").update({ role: "hacker" })
    ).rejects.toThrow();
  });

  it("user can write only their own user document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").doc("u1").update({ role: "player" })
    ).resolves.toBeUndefined();
  });

  it("user cannot delete someone else's user document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").doc("u2").delete()
    ).rejects.toThrow();
  });

  it("user can create their own user document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    const u3Db = dbAs(env, "u3");

    await expect(
      u3Db.collection("users").doc("u3").set({ role: "player" })
    ).resolves.toBeUndefined();
  });

  it("user cannot list all users (because some docs are not theirs)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const u1Db = dbAs(env, "u1");

    await expect(
      u1Db.collection("users").get()
    ).rejects.toThrow();
  });

  it("unauthenticated users cannot read any users", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await seedUsers(env);

    const anonDb = dbAnon(env);

    await expect(
      anonDb.collection("users").doc("u1").get()
    ).rejects.toThrow();
  });
});