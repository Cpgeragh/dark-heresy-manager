import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { deleteApp } from "firebase/app";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { httpsCallable } from "firebase/functions";
import {
  connectFirestoreEmulator,
  getFirestore as getClientDb,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { createIndependentClient, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) initializeApp({ projectId: "dh-test" });
const db = getFirestore();
const report = () => ({
  reportId: randomUUID(),
  build: "2026-11-02T12:00:00.000Z",
  project: "dh-test",
  status: "connected",
  loginCreated: false,
});

describe("Functions: private account diagnostics", () => {
  afterAll(teardownTestFunctions);
  it("deduplicates reports, caps storage and assigns a server expiry", async () => {
    const client = await createIndependentClient(`diagnostics-${Date.now()}`);
    try {
      await db.collection("userLinks").doc(client.uid).set({ primaryUid: "verified-account" });
      const call = httpsCallable<Record<string, unknown>, { accepted: boolean }>(
        client.functions,
        "recordAccountDiagnostic"
      );
      const first = report();
      const before = Date.now();
      expect((await call(first)).data.accepted).toBe(true);
      expect((await call(first)).data.accepted).toBe(true);
      for (let i = 0; i < 3; i++) await call(report());
      expect((await call(report())).data.accepted).toBe(false);
      const stored = await db
        .collection("accountDiagnostics")
        .doc(`${client.uid}_${new Date().toISOString().slice(0, 10)}`)
        .get();
      expect(stored.data()?.reports).toHaveLength(4);
      expect(stored.data()?.uid).toBe(client.uid);
      expect(stored.data()?.reports[0].accountId).toBe("verified-account");
      expect(stored.data()?.expiresAt.toMillis()).toBeGreaterThanOrEqual(before + 14 * 86400000);
      expect(stored.data()?.expiresAt.toMillis()).toBeLessThan(Date.now() + 14 * 86400000);
      const clientDb = getClientDb(client.app);
      connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
      await expect(getDoc(doc(clientDb, stored.ref.path))).rejects.toMatchObject({
        code: "permission-denied",
      });
      await expect(
        setDoc(doc(clientDb, stored.ref.path), { injected: true })
      ).rejects.toMatchObject({ code: "permission-denied" });
    } finally {
      await deleteApp(client.app);
    }
  }, 60000);

  it("rejects unexpected sensitive fields and the wrong environment", async () => {
    const client = await createIndependentClient(`diagnostics-invalid-${Date.now()}`);
    try {
      const call = httpsCallable(client.functions, "recordAccountDiagnostic");
      await expect(call({ ...report(), recoveryCode: "DH-AAAA-BBBB" })).rejects.toMatchObject({
        code: "functions/invalid-argument",
      });
      await expect(call({ ...report(), project: "wrong-project" })).rejects.toMatchObject({
        code: "functions/invalid-argument",
      });
      const stored = await db.collection("accountDiagnostics").where("uid", "==", client.uid).get();
      expect(stored.empty).toBe(true);
    } finally {
      await deleteApp(client.app);
    }
  }, 30000);
});
