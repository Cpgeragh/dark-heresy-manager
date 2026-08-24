// tests/functions/lookupRecoveryCode.test.ts
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

describe("Functions: lookupRecoveryCode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "resolves a real registered code to a minimal, correctly-owned preview",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign" });
      await characterRef.set({
        campaignId: campaignRef.id,
        header: { characterName: "Test Character" },
      });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");
      const { data: registered } = await registerRecoveryCode({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      const lookupRecoveryCode = httpsCallable<{ code: string }, unknown>(
        getTestFunctions(),
        "lookupRecoveryCode"
      );
      const result = await lookupRecoveryCode({ code: registered.code });

      expect(result.data).toEqual({
        status: "found",
        preview: {
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          characterName: "Test Character",
          campaignName: "Test Campaign",
          ownership: "unclaimed",
        },
      });
    },
    15000
  );

  it(
    "returns not-found for a well-formed code that was never registered",
    async () => {
      await signInTestUser();
      const lookupRecoveryCode = httpsCallable<{ code: string }, unknown>(
        getTestFunctions(),
        "lookupRecoveryCode"
      );

      const result = await lookupRecoveryCode({ code: "DH-0000-0000" });

      expect(result.data).toEqual({ status: "not-found" });
    },
    15000
  );
});
