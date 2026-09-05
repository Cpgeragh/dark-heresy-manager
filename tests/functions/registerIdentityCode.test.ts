// tests/functions/registerIdentityCode.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

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
    const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    const result = await registerIdentityCode({ role: "player" });

    expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
    expect(secretSnapshot.data()?.code).toBe(result.data.code);
  }, 15000);

  it("rotating produces a different code and updates the stored copy", async () => {
    const uid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(uid).set({ firstName: "Player" });
    const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );

    const first = await registerIdentityCode({ role: "player" });
    const second = await registerIdentityCode({ role: "player" });

    expect(second.data.code).not.toBe(first.data.code);
    const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
    expect(secretSnapshot.data()?.code).toBe(second.data.code);
  }, 15000);

  it("a linked device can register an identity code for the primary account it's linked to", async () => {
    const primaryUid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(primaryUid).set({ firstName: "Primary" });
    const deviceUid = await signInTestUser();
    await adminDb.collection("userLinks").doc(deviceUid).set({ primaryUid });

    const registerIdentityCode = httpsCallable<
      { role: "dm" | "player"; targetUid?: string },
      { code: string }
    >(getTestFunctions(), "registerIdentityCode");

    const result = await registerIdentityCode({ role: "player", targetUid: primaryUid });

    expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const primarySecret = await adminDb.collection("identitySecret").doc(primaryUid).get();
    expect(primarySecret.data()?.code).toBe(result.data.code);
    const deviceSecret = await adminDb.collection("identitySecret").doc(deviceUid).get();
    expect(deviceSecret.exists).toBe(false);
  }, 15000);

  it("rejects a targetUid the caller isn't linked to", async () => {
    await signInTestUser();
    const registerIdentityCode = httpsCallable<
      { role: "dm" | "player"; targetUid?: string },
      { code: string }
    >(getTestFunctions(), "registerIdentityCode");

    await expect(
      registerIdentityCode({ role: "player", targetUid: "some-unlinked-account" })
    ).rejects.toThrow();
  }, 15000);
});
