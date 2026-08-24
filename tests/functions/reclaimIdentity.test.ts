// tests/functions/reclaimIdentity.test.ts
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

describe("Functions: reclaimIdentity", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "migrates a DM's campaign and a player's character to the reclaiming identity",
    async () => {
      const oldUid = "old-dm-uid";
      await adminDb.collection("identityRecovery").doc("DH-RCLM-0001").set({
        uid: oldUid,
        role: "dm",
      });
      await adminDb.collection("identitySecret").doc(oldUid).set({ code: "DH-RCLM-0001" });
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: oldUid, name: "Test Campaign", memberIds: [] });

      const newUid = await signInTestUser();
      const reclaimIdentity = httpsCallable<{ code: string }, { role: string }>(
        getTestFunctions(),
        "reclaimIdentity"
      );
      const result = await reclaimIdentity({ code: "DH-RCLM-0001" });

      expect(result.data).toEqual({ role: "dm" });

      const campaignSnapshot = await campaignRef.get();
      expect(campaignSnapshot.data()?.dmId).toBe(newUid);

      const recoverySnapshot = await adminDb
        .collection("identityRecovery")
        .doc("DH-RCLM-0001")
        .get();
      expect(recoverySnapshot.data()?.uid).toBe(newUid);
    },
    15000
  );

  it(
    "rejects a code that does not resolve",
    async () => {
      await signInTestUser();
      const reclaimIdentity = httpsCallable(getTestFunctions(), "reclaimIdentity");

      await expect(reclaimIdentity({ code: "DH-0000-0000" })).rejects.toMatchObject({
        code: "functions/not-found",
      });
    },
    15000
  );
});
