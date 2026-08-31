// tests/functions/claimCharacter.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { deleteApp } from "firebase/app";
import { getTestFunctions, signInTestUser, teardownTestFunctions, createIndependentClient } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: claimCharacter", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "claims an unclaimed character and atomically rotates the consumed code",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");
      const { data: registered } = await registerRecoveryCode({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      const playerUid = await signInTestUser();
      const claimCharacter = httpsCallable<
        { code: string },
        { campaignId: string; characterId: string }
      >(getTestFunctions(), "claimCharacter");
      const result = await claimCharacter({ code: registered.code });

      expect(result.data).toEqual({ campaignId: campaignRef.id, characterId: characterRef.id });

      const characterSnapshot = await characterRef.get();
      expect(characterSnapshot.data()?.userId).toBe(playerUid);
      expect(characterSnapshot.data()?.recoveryCode).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(characterSnapshot.data()?.recoveryCode).not.toBe(registered.code);

      const lookupRecoveryCode = httpsCallable<
        { code: string },
        { status: string }
      >(getTestFunctions(), "lookupRecoveryCode");
      const consumedLookup = await lookupRecoveryCode({ code: registered.code });
      expect(consumedLookup.data).toEqual({ status: "not-found" });

      const campaignSnapshot = await campaignRef.get();
      expect(campaignSnapshot.data()?.memberIds).toContain(playerUid);

      const claimLogSnapshot = await characterRef.collection("claimLog").get();
      expect(claimLogSnapshot.docs).toHaveLength(1);
      expect(claimLogSnapshot.docs[0].data()).toMatchObject({
        action: "claim",
        actorUid: playerUid,
        previousOwnerUid: null,
        newOwnerUid: playerUid,
      });
    },
    15000
  );

  it(
    "rejects reusing a code after its successful claim consumed it",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");
      const { data: registered } = await registerRecoveryCode({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      await signInTestUser();
      const claimCharacter = httpsCallable<{ code: string }, unknown>(
        getTestFunctions(),
        "claimCharacter"
      );
      await claimCharacter({ code: registered.code });

      await signInTestUser();
      await expect(claimCharacter({ code: registered.code })).rejects.toMatchObject({
        code: "functions/not-found",
      });
    },
    15000
  );

  it(
    "only lets one of two truly concurrent claims for the same character succeed",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id });

      const registerRecoveryCode = httpsCallable<
        { campaignId: string; characterId: string },
        { code: string }
      >(getTestFunctions(), "registerRecoveryCode");
      const { data: registered } = await registerRecoveryCode({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      const clientA = await createIndependentClient("claim-race-a");
      const clientB = await createIndependentClient("claim-race-b");

      try {
        const claimA = httpsCallable<{ code: string }, { campaignId: string; characterId: string }>(
          clientA.functions,
          "claimCharacter"
        );
        const claimB = httpsCallable<{ code: string }, { campaignId: string; characterId: string }>(
          clientB.functions,
          "claimCharacter"
        );

        const [resultA, resultB] = await Promise.allSettled([
          claimA({ code: registered.code }),
          claimB({ code: registered.code }),
        ]);

        const settled = [resultA, resultB];
        const fulfilled = settled.filter((r) => r.status === "fulfilled");
        const rejected = settled.filter((r) => r.status === "rejected");

        // The loser's exact error (failed-precondition vs. not-found) depends
        // on emulator timing, both represent the race being handled safely.
        // What actually matters: exactly one call ever succeeds.
        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const winnerUid = resultA.status === "fulfilled" ? clientA.uid : clientB.uid;
        const characterSnapshot = await characterRef.get();
        expect(characterSnapshot.data()?.userId).toBe(winnerUid);

        const campaignSnapshot = await campaignRef.get();
        expect(campaignSnapshot.data()?.memberIds).toEqual([winnerUid]);
      } finally {
        await deleteApp(clientA.app);
        await deleteApp(clientB.app);
      }
    },
    15000
  );
});
