// tests/functions/linkDevice.test.ts
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

describe("Functions: linkDevice", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("links a second device to the primary account identified by the code", async () => {
    const primaryUid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(primaryUid).set({ firstName: "Primary" });
    const registerIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );
    const { data: registered } = await registerIdentityCode({});

    const deviceUid = await signInTestUser();
    await adminDb.collection("users").doc(deviceUid).set({ onboarded: false });
    const linkDevice = httpsCallable<{ code: string }, void>(getTestFunctions(), "linkDevice");
    await linkDevice({ code: registered.code });

    const linkSnapshot = await adminDb.collection("userLinks").doc(deviceUid).get();
    expect(linkSnapshot.data()?.primaryUid).toBe(primaryUid);
  }, 15000);

  it("rejects a code that does not resolve", async () => {
    const deviceUid = await signInTestUser();
    await adminDb.collection("users").doc(deviceUid).set({ onboarded: false });
    const linkDevice = httpsCallable(getTestFunctions(), "linkDevice");

    await expect(linkDevice({ code: "DH-0000-0000" })).rejects.toMatchObject({
      code: "functions/not-found",
    });
  }, 15000);

  it("rejects a code that has already been rotated away", async () => {
    const primaryUid = await signInTestUser();
    await adminDb.collection("userProfiles").doc(primaryUid).set({ firstName: "Primary" });
    const registerIdentityCode = httpsCallable<Record<string, never>, { code: string }>(
      getTestFunctions(),
      "registerIdentityCode"
    );
    const { data: first } = await registerIdentityCode({});
    await registerIdentityCode({});

    const deviceUid = await signInTestUser();
    await adminDb.collection("users").doc(deviceUid).set({ onboarded: false });
    const linkDevice = httpsCallable(getTestFunctions(), "linkDevice");

    await expect(linkDevice({ code: first.code })).rejects.toMatchObject({
      code: "functions/not-found",
    });
  }, 15000);
});
