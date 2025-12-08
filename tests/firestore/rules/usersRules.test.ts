// tests/firestore/rules/usersRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";

describe("Firestore Rules: Users", () => {

  it("user can read their own user document", async () => {
    const env = await getTestEnv();

    // Create the user doc without rules
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("u1").set({
        role: "player",
      });
    });

    const authed = env.authenticatedContext("u1");

    await expect(
      authed.firestore().collection("users").doc("u1").get()
    ).resolves.toBeDefined();
  });

  it("user cannot read another user's document", async () => {
    const env = await getTestEnv();

    // Create user docs without rules
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("u1").set({ role: "player" });
      await ctx.firestore().collection("users").doc("u2").set({ role: "player" });
    });

    const authed = env.authenticatedContext("u1");

    await expect(
      authed.firestore().collection("users").doc("u2").get()
    ).rejects.toThrow();
  });

  it("user cannot write to another user's document", async () => {
    const env = await getTestEnv();

    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("u1").set({ role: "player" });
      await ctx.firestore().collection("users").doc("u2").set({ role: "player" });
    });

    const authed = env.authenticatedContext("u1");

    await expect(
      authed.firestore().collection("users").doc("u2").update({ role: "hacker" })
    ).rejects.toThrow();
  });

  it("user can write only their own user document", async () => {
    const env = await getTestEnv();

    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("users").doc("u1").set({ role: "player" });
    });

    const authed = env.authenticatedContext("u1");

    await expect(
      authed.firestore().collection("users").doc("u1").update({ role: "player" })
    ).resolves.toBeUndefined();
  });
});