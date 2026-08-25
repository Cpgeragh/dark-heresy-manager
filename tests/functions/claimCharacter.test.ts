// tests/functions/claimCharacter.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

// A genuine concurrency test needs two independently-authenticated clients
// racing at the same instant, which the shared getTestFunctions()/
// signInTestUser() helpers can't do (one shared auth session, signing in as
// a new user signs the previous one out first). Scoped to this file only.
async function createIndependentClient(name: string) {
  const app = initializeApp({ projectId: "dh-test", apiKey: "test-api-key" }, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const functions = getFunctions(app);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  const credential = await signInAnonymously(auth);
  return { app, functions, uid: credential.user.uid };
}

describe("Functions: claimCharacter", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "claims an unclaimed character for the calling player and rotates its code",
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
      expect(characterSnapshot.data()?.recoveryCode).not.toBe(registered.code);

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
    "rejects reusing an already-consumed code, since claiming rotates it",
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
