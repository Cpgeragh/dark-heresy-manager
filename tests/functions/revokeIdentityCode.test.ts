// tests/functions/revokeIdentityCode.test.ts
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

describe("Functions: revokeIdentityCode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "revokes a registered identity code so it can no longer be used, and clears the stored copy",
    async () => {
      const uid = await signInTestUser();
      await adminDb.collection("userProfiles").doc(uid).set({ firstName: "Player" });
      const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
        getTestFunctions(),
        "registerIdentityCode"
      );
      const { data: registered } = await registerIdentityCode({ role: "player" });

      const revokeIdentityCode = httpsCallable(getTestFunctions(), "revokeIdentityCode");
      await revokeIdentityCode({});

      const secretSnapshot = await adminDb.collection("identitySecret").doc(uid).get();
      expect(secretSnapshot.exists).toBe(false);

      await signInTestUser();
      const getMode = httpsCallable<{ code: string }, { status: string }>(
        getTestFunctions(),
        "getIdentityRecoveryMode"
      );
      await expect(getMode({ code: registered.code })).resolves.toMatchObject({
        data: { status: "not-found" },
      });
    },
    20000
  );

  it(
    "succeeds as a safe no-op when the caller has no identity code registered",
    async () => {
      await signInTestUser();
      const revokeIdentityCode = httpsCallable(getTestFunctions(), "revokeIdentityCode");

      await expect(revokeIdentityCode({})).resolves.toBeDefined();
    },
    15000
  );
});
