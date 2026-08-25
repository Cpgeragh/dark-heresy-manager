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

  it(
    "exhausts the real per-code rate limit after repeated lookups, simulating a brute-force guess sequence",
    async () => {
      await signInTestUser();
      const lookupRecoveryCode = httpsCallable<{ code: string }, { status: string }>(
        getTestFunctions(),
        "lookupRecoveryCode"
      );
      const code = "DH-RATE-0001"; // deliberately made-up, never registered

      // The per-code limit is 5 attempts per 15 minutes. Each of the first 5
      // calls resolves normally with "not-found" (a real business outcome,
      // not a rejection) since the code was never registered — it still
      // counts as a real attempt against the limit.
      for (let i = 0; i < 5; i++) {
        const result = await lookupRecoveryCode({ code });
        expect(result.data).toEqual({ status: "not-found" });
      }

      // The 6th attempt is rejected by the rate limiter itself, before ever
      // reaching the lookup logic.
      await expect(lookupRecoveryCode({ code })).rejects.toMatchObject({
        code: "functions/resource-exhausted",
      });
    },
    15000
  );
});
