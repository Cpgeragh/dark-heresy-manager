// tests/functions/registerRecoveryCode.test.ts
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

describe("Functions: registerRecoveryCode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "generates a Recovery Code for the DM's own campaign character, over the real emulator",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign" });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");

      const result = await registerRecoveryCode({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      expect(result.data.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

      const characterSnapshot = await characterRef.get();
      expect(characterSnapshot.data()?.recoveryCode).toBe(result.data.code);
    },
    15000
  );

  it(
    "logs a history entry when rotating an existing code, but not on first registration",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign" });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");

      await registerRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id });

      const historyAfterFirstRegister = await characterRef.collection("recoveryCodeHistory").get();
      expect(historyAfterFirstRegister.docs).toHaveLength(0);

      await registerRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id });

      const historyAfterRotation = await characterRef.collection("recoveryCodeHistory").get();
      expect(historyAfterRotation.docs).toHaveLength(1);
      expect(historyAfterRotation.docs[0].data()).toMatchObject({ status: "rotated" });
    },
    15000
  );

  it(
    "rejects a caller who is not the campaign's DM",
    async () => {
      await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: "someone-else", name: "Test Campaign" });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable(getTestFunctions(), "registerRecoveryCode");

      await expect(
        registerRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id })
      ).rejects.toMatchObject({ code: "functions/permission-denied" });
    },
    15000
  );
});
