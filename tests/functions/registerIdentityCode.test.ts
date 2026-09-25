// tests/functions/registerIdentityCode.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { deleteApp } from "firebase/app";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  createIndependentClient,
  getTestFunctions,
  signInTestUser,
  teardownTestFunctions,
} from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: registerIdentityCode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("generates an identity code for the caller and stores the plaintext display copy", async () => {
    const uid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(uid).set({ firstName: "Player" });
    const registerIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    const result = await registerIdentityCode({});

    expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
    expect(secretSnapshot.data()?.code).toBe(result.data.code);
  }, 15000);

  it("rotating produces a different code and updates the stored copy", async () => {
    const uid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(uid).set({ firstName: "Player" });
    const registerIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    const first = await registerIdentityCode({});
    const second = await registerIdentityCode({});

    expect(second.data.code).not.toBe(first.data.code);
    const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
    expect(secretSnapshot.data()?.code).toBe(second.data.code);
  }, 15000);

  it("a connected device rotates the shared account code", async () => {
    const primaryUid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(primaryUid).set({ firstName: "Primary" });
    const deviceUid = await signInTestUser();
    await adminDb.collection("userLinks").doc(deviceUid).set({ primaryUid });

    const registerIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    const result = await registerIdentityCode({});

    expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const primarySecret = await adminDb.collection("identitySecret").doc(primaryUid).get();
    expect(primarySecret.data()?.code).toBe(result.data.code);
    const deviceSecret = await adminDb.collection("identitySecret").doc(deviceUid).get();
    expect(deviceSecret.exists).toBe(false);
  }, 15000);

  it("rejects client-selected account fields", async () => {
    await signInTestUser();
    const registerIdentityCode = httpsCallable<{ targetUid?: string }, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    await expect(registerIdentityCode({ targetUid: "some-unlinked-account" })).rejects.toThrow();
  }, 15000);

  it("reveals the code to a linked device but not another account", async () => {
    const owner = await createIndependentClient(`code-owner-${Date.now()}`);
    const linked = await createIndependentClient(`code-linked-${Date.now()}`);
    const outsider = await createIndependentClient(`code-outsider-${Date.now()}`);
    try {
      await adminDb.collection("userLinks").doc(linked.uid).set({ primaryUid: owner.uid });
      await adminDb.collection("identitySecret").doc(owner.uid).set({ code: "DH-AAAA-BBBB" });
      const revealLinked = httpsCallable<Record<string, never>, { code: string | null }>(
        linked.functions,
        "revealIdentityCode"
      );
      const revealOutsider = httpsCallable<Record<string, never>, { code: string | null }>(
        outsider.functions,
        "revealIdentityCode"
      );
      expect((await revealLinked({})).data.code).toBe("DH-AAAA-BBBB");
      expect((await revealOutsider({})).data.code).toBeNull();
    } finally {
      await Promise.all([deleteApp(owner.app), deleteApp(linked.app), deleteApp(outsider.app)]);
    }
  }, 15000);
});
