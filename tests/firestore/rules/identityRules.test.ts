// tests/firestore/rules/identityRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  createIdentityRecoveryEntry,
  createIdentitySecretEntry,
  createIdentityReclaimEntry,
} from "../helpers";

// ============================================================
// identityRecovery/{code}
// Reverse-lookup collection: code → { uid, role }
// ============================================================
describe("Firestore Rules: identityRecovery (retired collection)", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("is fully sealed — no get, create, or update", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-123", { uid: "uid-1", role: "dm" });

    await expect(
      dbAs(env, "uid-1").collection("identityRecovery").doc("CODE-123").get()
    ).rejects.toThrow();
    await expect(
      dbAs(env, "uid-2")
        .collection("identityRecovery")
        .doc("DH-ABCD-0001")
        .set({ uid: "uid-2", role: "dm" })
    ).rejects.toThrow();
  });
});

// ============================================================
// identitySecret/{uid}
// Proof store: uid → { code }
// Owner-readable only (for Settings reveal/rotate); others denied.
// ============================================================
describe("Firestore Rules: identitySecret", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("owner can read their own identity secret entry", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-1", { code: "CODE-XYZ" });

    await expect(
      dbAs(env, "uid-1").collection("identitySecret").doc("uid-1").get()
    ).resolves.toBeDefined();
  });

  it("another user cannot read someone else's identity secret entry", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-1", { code: "CODE-XYZ" });

    await expect(
      dbAs(env, "uid-2").collection("identitySecret").doc("uid-1").get()
    ).rejects.toThrow();
  });

  it("owner can write their own identity secret entry", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-1").collection("identitySecret").doc("uid-1").set({ code: "DH-SECR-0001" })
    ).resolves.toBeUndefined();
  });

  it("identity secrets accept only the exact recovery-code shape and field set", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    const secret = dbAs(env, "uid-1").collection("identitySecret").doc("uid-1");

    await expect(secret.set({ code: "not-a-code" })).rejects.toThrow();
    await expect(secret.set({ code: "DH-SECR-0002", unexpected: true })).rejects.toThrow();
  });

  it("user cannot write to another user's identity secret document", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-1").collection("identitySecret").doc("uid-2").set({ code: "DH-SECR-0001" })
    ).rejects.toThrow();
  });
});

// ============================================================
// identityReclaims/{uid}
// Temporary proof documents created during identity migration.
// ============================================================
describe("Firestore Rules: identityReclaims (retired collection)", () => {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("is fully sealed — no read or create", async () => {
    const env = (await getTestEnv()) as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-old", { code: "DH-CORR-0001" });
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CORR-0001" });

    await expect(
      dbAs(env, "uid-new").collection("identityReclaims").doc("uid-new").get()
    ).rejects.toThrow();
    await expect(
      dbAs(env, "uid-other")
        .collection("identityReclaims")
        .doc("uid-other")
        .set({ oldUid: "uid-old", code: "DH-CORR-0001" })
    ).rejects.toThrow();
  });
});
