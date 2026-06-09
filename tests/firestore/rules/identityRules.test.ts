// tests/firestore/rules/identityRules.test.ts

import { describe, it, expect, afterEach } from "vitest";
import { getTestEnv } from "../setup";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  dbAs,
  dbAnon,
  createIdentityRecoveryEntry,
  createIdentitySecretEntry,
  createIdentityReclaimEntry,
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
// Owner-readable only (for Settings reveal/rotate); others denied.
// ============================================================
describe("Firestore Rules: identitySecret", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("owner can read their own identity secret entry", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-1", { code: "CODE-XYZ" });

    await expect(
      dbAs(env, "uid-1").collection("identitySecret").doc("uid-1").get()
    ).resolves.toBeDefined();
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

// ============================================================
// identityReclaims/{uid}
// Temporary proof documents created during identity migration.
// ============================================================
describe("Firestore Rules: identityReclaims", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("owner can create a reclaim request when the code matches identitySecret", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-old", { code: "DH-CORRECT-CODE" });

    await expect(
      dbAs(env, "uid-new")
        .collection("identityReclaims")
        .doc("uid-new")
        .set({ oldUid: "uid-old", code: "DH-CORRECT-CODE" })
    ).resolves.toBeUndefined();
  });

  it("owner cannot create a reclaim request with a wrong code", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-old", { code: "DH-CORRECT-CODE" });

    await expect(
      dbAs(env, "uid-new")
        .collection("identityReclaims")
        .doc("uid-new")
        .set({ oldUid: "uid-old", code: "DH-WRONG-CODE" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot create a reclaim request", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-old", { code: "DH-CORRECT-CODE" });

    await expect(
      dbAnon(env)
        .collection("identityReclaims")
        .doc("uid-new")
        .set({ oldUid: "uid-old", code: "DH-CORRECT-CODE" })
    ).rejects.toThrow();
  });

  it("user cannot create a reclaim request for another uid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentitySecretEntry(env, "uid-old", { code: "DH-CORRECT-CODE" });

    await expect(
      dbAs(env, "uid-new")
        .collection("identityReclaims")
        .doc("uid-other")  // document id doesn't match auth uid
        .set({ oldUid: "uid-old", code: "DH-CORRECT-CODE" })
    ).rejects.toThrow();
  });

  it("owner can read their own reclaim document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "uid-new").collection("identityReclaims").doc("uid-new").get()
    ).resolves.toBeDefined();
  });

  it("another user cannot read someone else's reclaim document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "uid-other").collection("identityReclaims").doc("uid-new").get()
    ).rejects.toThrow();
  });

  it("owner can delete their own reclaim document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "uid-new").collection("identityReclaims").doc("uid-new").delete()
    ).resolves.toBeUndefined();
  });

  it("another user cannot delete someone else's reclaim document", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "uid-other").collection("identityReclaims").doc("uid-new").delete()
    ).rejects.toThrow();
  });
});

// ============================================================
// identityRecovery — update (reclaim path)
// ============================================================
describe("Firestore Rules: identityRecovery update (reclaim)", () => {

  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
  });

  it("reclaimer can update identityRecovery uid when a valid reclaim doc exists", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "DH-CODE", { uid: "uid-old", role: "dm" });
    await createIdentityReclaimEntry(env, "uid-new", { oldUid: "uid-old", code: "DH-CODE" });

    await expect(
      dbAs(env, "uid-new")
        .collection("identityRecovery")
        .doc("DH-CODE")
        .update({ uid: "uid-new" })
    ).resolves.toBeUndefined();
  });

  it("user without a reclaim doc cannot update identityRecovery uid", async () => {
    const env = await getTestEnv() as RulesTestEnvironment;
    await createIdentityRecoveryEntry(env, "DH-CODE", { uid: "uid-old", role: "dm" });

    await expect(
      dbAs(env, "uid-new")
        .collection("identityRecovery")
        .doc("DH-CODE")
        .update({ uid: "uid-new" })
    ).rejects.toThrow();
  });
});
