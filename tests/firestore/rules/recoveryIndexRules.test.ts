// tests/firestore/rules/recoveryIndexRules.test.ts

import { describe, it, expect } from "vitest";
import { getTestEnv } from "../setup";
import type {
  RulesTestEnvironment,
  RulesTestContext
} from "@firebase/rules-unit-testing";

describe("Firestore Rules: recoveryIndex", () => {
  const recoveryCode = "DH-TEST-1234";

  /**
   * Inserts a recoveryIndex entry using admin privileges
   * (allowed because withSecurityRulesDisabled bypasses security rules completely)
   */
  async function createIndex(env: RulesTestEnvironment) {
    await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
      await ctx
        .firestore()
        .collection("recoveryIndex")
        .doc(recoveryCode)
        .set({
          campaignId: "camp1",
          characterId: "char1"
        });
    });
  }

  it("authenticated users may read recoveryIndex", async () => {
    const env = await getTestEnv();
    await createIndex(env);

    const user = env.authenticatedContext("player-1");

    await expect(
      user.firestore().collection("recoveryIndex").doc(recoveryCode).get()
    ).resolves.toBeDefined();
  });

  it("unauthenticated users cannot read recoveryIndex", async () => {
    const env = await getTestEnv();
    await createIndex(env);

    const unauth = env.unauthenticatedContext();

    await expect(
      unauth.firestore().collection("recoveryIndex").doc(recoveryCode).get()
    ).rejects.toThrow();
  });

  it("authenticated users cannot write recoveryIndex entries", async () => {
    const env = await getTestEnv();

    const user = env.authenticatedContext("player-1");

    // Write attempt must fail
    await expect(
      user.firestore().collection("recoveryIndex").doc("NEWCODE").set({
        campaignId: "campX",
        characterId: "charX"
      })
    ).rejects.toThrow();
  });

  it("DM cannot write recoveryIndex entries", async () => {
    const env = await getTestEnv();

    const dm = env.authenticatedContext("dm-1");

    await expect(
      dm.firestore().collection("recoveryIndex").doc("DMTEST").set({
        campaignId: "campX",
        characterId: "charX"
      })
    ).rejects.toThrow();
  });
});