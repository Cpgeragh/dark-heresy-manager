// tests/functions/claimCharacter.test.ts
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
});
