import { afterAll, describe, expect, it } from "vitest";
import { httpsCallable } from "firebase/functions";
import { getApps, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: identity recovery mode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "selects reclaim with no links, then link after a secondary device is connected",
    async () => {
      const primaryUid = await signInTestUser();
      await adminDb.collection("userProfiles").doc(primaryUid).set({ firstName: "Primary" });
      const registerIdentityCode = httpsCallable<{ role: "player" }, { code: string }>(
        getTestFunctions(),
        "registerIdentityCode"
      );
      const { data: registered } = await registerIdentityCode({ role: "player" });

      await signInTestUser();
      const getMode = httpsCallable<{ code: string }, { mode: "link" | "reclaim" }>(
        getTestFunctions(),
        "getIdentityRecoveryMode"
      );
      await expect(getMode({ code: registered.code })).resolves.toMatchObject({
        data: { mode: "reclaim" },
      });

      const linkDevice = httpsCallable<{ code: string }, void>(getTestFunctions(), "linkDevice");
      await linkDevice({ code: registered.code });

      await signInTestUser();
      await expect(getMode({ code: registered.code })).resolves.toMatchObject({
        data: { mode: "link" },
      });

      const startReclaim = httpsCallable(getTestFunctions(), "startIdentityReclaimJob");
      await expect(startReclaim({ code: registered.code })).rejects.toMatchObject({
        code: "functions/failed-precondition",
      });
    },
    20_000
  );
});
