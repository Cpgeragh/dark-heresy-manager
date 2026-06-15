// tests/firestore/rules/deviceLinkRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { dbAs, dbAnon, createIdentitySecretEntry } from "../helpers";

// Create a linkProofs doc bypassing rules (for userLinks tests).
async function createLinkProof(
  env: RulesTestEnvironment,
  uid: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("linkProofs").doc(uid).set(data);
  });
}

// ============================================================
// linkProofs/{uid} — proof the linker knows the target's recovery code
// ============================================================
describe("Firestore Rules: linkProofs", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("can create a proof when the code matches the target's identitySecret", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "primary-1", { code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("linkProofs").doc("device-1")
        .set({ primaryUid: "primary-1", code: "DH-CORRECT" })
    ).resolves.toBeUndefined();
  });

  it("cannot create a proof with the wrong code", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "primary-1", { code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("linkProofs").doc("device-1")
        .set({ primaryUid: "primary-1", code: "DH-WRONG" })
    ).rejects.toThrow();
  });

  it("cannot create a proof under a doc id that isn't your uid", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "primary-1", { code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("linkProofs").doc("device-2")
        .set({ primaryUid: "primary-1", code: "DH-CORRECT" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot create a proof", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "primary-1", { code: "DH-CORRECT" });

    await expect(
      dbAnon(env).collection("linkProofs").doc("device-1")
        .set({ primaryUid: "primary-1", code: "DH-CORRECT" })
    ).rejects.toThrow();
  });
});

// ============================================================
// userLinks/{uid} — requires a matching proof to create
// ============================================================
describe("Firestore Rules: userLinks", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("can create a link when a matching proof exists", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createLinkProof(env, "device-1", { primaryUid: "primary-1", code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1")
        .set({ primaryUid: "primary-1", linkedAt: 1 })
    ).resolves.toBeUndefined();
  });

  it("cannot create a link without a proof (forged link blocked)", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1")
        .set({ primaryUid: "victim-1", linkedAt: 1 })
    ).rejects.toThrow();
  });

  it("cannot create a link to a different primary than the proof names", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createLinkProof(env, "device-1", { primaryUid: "primary-1", code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1")
        .set({ primaryUid: "victim-1", linkedAt: 1 })
    ).rejects.toThrow();
  });

  it("cannot link a device to itself", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createLinkProof(env, "device-1", { primaryUid: "device-1", code: "DH-CORRECT" });

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1")
        .set({ primaryUid: "device-1", linkedAt: 1 })
    ).rejects.toThrow();
  });

  it("can delete your own link", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createLinkProof(env, "device-1", { primaryUid: "primary-1", code: "DH-CORRECT" });
    await dbAs(env, "device-1").collection("userLinks").doc("device-1")
      .set({ primaryUid: "primary-1", linkedAt: 1 });

    await expect(
      dbAs(env, "device-1").collection("userLinks").doc("device-1").delete()
    ).resolves.toBeUndefined();
  });
});
