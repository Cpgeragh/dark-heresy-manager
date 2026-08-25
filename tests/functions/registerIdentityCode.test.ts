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

  it(
    "generates an identity code for the caller and stores the plaintext display copy",
    async () => {
      const uid = await signInTestUser();
      const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
        getTestFunctions(),
        "registerIdentityCode"
      );

      const result = await registerIdentityCode({ role: "player" });

      expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
      expect(secretSnapshot.data()?.code).toBe(result.data.code);
    },
    15000
  );

  it(
    "rotating produces a different code and updates the stored copy",
    async () => {
      const uid = await signInTestUser();
      const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
        getTestFunctions(),
        "registerIdentityCode"
      );

      const first = await registerIdentityCode({ role: "player" });
      const second = await registerIdentityCode({ role: "player" });

      expect(second.data.code).not.toBe(first.data.code);
      const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
      expect(secretSnapshot.data()?.code).toBe(second.data.code);
    },
    15000
  );
});
