// tests/firestore/rules/identityRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  dbAnon,
  createIdentityRecoveryEntry,
  createIdentitySecretEntry,
} from "../helpers";

// ============================================================
// identityRecovery/{code}
// Reverse-lookup collection: code → { uid, role }
// ============================================================
describe("Firestore Rules: identityRecovery", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("authenticated user can get a recovery entry by code", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-123", { uid: "uid-1", role: "dm" });

    await expect(
      dbAs(env, "uid-1").collection("identityRecovery").doc("CODE-123").get()
    ).resolves.toBeDefined();
  });

  it("unauthenticated user cannot get a recovery entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-123", { uid: "uid-1", role: "dm" });

    await expect(
      dbAnon(env).collection("identityRecovery").doc("CODE-123").get()
    ).rejects.toThrow();
  });

  it("authenticated user cannot list the identityRecovery collection", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-123", { uid: "uid-1", role: "dm" });

    await expect(
      dbAs(env, "uid-1").collection("identityRecovery").get()
    ).rejects.toThrow();
  });

  it("owner can create their own identity recovery entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-1")
        .collection("identityRecovery")
        .doc("CODE-ABC")
        .set({ uid: "uid-1", role: "dm" })
    ).resolves.toBeUndefined();
  });

  it("user cannot create a recovery entry with a different uid in the payload", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-2")
        .collection("identityRecovery")
        .doc("CODE-ABC")
        .set({ uid: "uid-1", role: "dm" })
    ).rejects.toThrow();
  });

  it("owner can delete their own identity recovery entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-ABC", { uid: "uid-1", role: "dm" });

    await expect(
      dbAs(env, "uid-1").collection("identityRecovery").doc("CODE-ABC").delete()
    ).resolves.toBeUndefined();
  });

  it("user cannot delete another user's identity recovery entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "CODE-ABC", { uid: "uid-1", role: "dm" });

    await expect(
      dbAs(env, "uid-2").collection("identityRecovery").doc("CODE-ABC").delete()
    ).rejects.toThrow();
  });
});

// ============================================================
// identitySecret/{uid}
// Proof store: uid → { code }
// Never readable by clients — rule-side get() verification only.
// ============================================================
describe("Firestore Rules: identitySecret", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("owner cannot read their own identity secret entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-1", { code: "CODE-XYZ" });

    await expect(
      dbAs(env, "uid-1").collection("identitySecret").doc("uid-1").get()
    ).rejects.toThrow();
  });

  it("another user cannot read someone else's identity secret entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-1", { code: "CODE-XYZ" });

    await expect(
      dbAs(env, "uid-2").collection("identitySecret").doc("uid-1").get()
    ).rejects.toThrow();
  });

  it("owner can write their own identity secret entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-1")
        .collection("identitySecret")
        .doc("uid-1")
        .set({ code: "CODE-XYZ" })
    ).resolves.toBeUndefined();
  });

  it("user cannot write to another user's identity secret document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;

    await expect(
      dbAs(env, "uid-1")
        .collection("identitySecret")
        .doc("uid-2")
        .set({ code: "CODE-XYZ" })
    ).rejects.toThrow();
  });
});
