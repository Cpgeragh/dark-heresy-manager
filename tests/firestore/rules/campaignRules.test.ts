// tests/firestore/rules/campaignRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";

describe("Firestore Rules: Campaigns", () => {

  it("authenticated users may read campaign documents", async () => {
    const env = await getTestEnv();

    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("campaigns").doc("c1").set({
        dmId: "dm-1",
        name: "Sample Campaign",
      });
    });

    const user = env.authenticatedContext("player-1");

    await expect(
      user.firestore().collection("campaigns").doc("c1").get()
    ).resolves.toBeDefined();
  });

  it("non-DM cannot write campaign metadata", async () => {
    const env = await getTestEnv();

    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("campaigns").doc("c1").set({
        dmId: "dm-1",
        name: "Sample Campaign",
      });
    });

    const player = env.authenticatedContext("player-1");

    await expect(
      player.firestore().collection("campaigns").doc("c1").update({
        name: "Hacked Campaign"
      })
    ).rejects.toThrow();
  });

  it("DM may write campaign metadata", async () => {
    const env = await getTestEnv();

    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection("campaigns").doc("c1").set({
        dmId: "dm-1",
        name: "Sample Campaign",
      });
    });

    const dm = env.authenticatedContext("dm-1");

    await expect(
      dm.firestore().collection("campaigns").doc("c1").update({
        name: "Updated by DM"
      })
    ).resolves.toBeUndefined();
  });
});