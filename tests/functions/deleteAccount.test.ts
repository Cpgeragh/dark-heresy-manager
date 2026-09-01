// tests/functions/deleteAccount.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();
const adminAuth = getAuth();

describe("Functions: deleteAccount", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "releases claimed characters, removes membership, clears identity data, and deletes the real Auth user",
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
      await adminDb.collection("userProfiles").doc(playerUid).set({ firstName: "Player" });
      const claimCharacter = httpsCallable<{ code: string }, void>(
        getTestFunctions(),
        "claimCharacter"
      );
      await claimCharacter({ code: registered.code });

      const registerIdentityCode = httpsCallable<{ role: "dm" | "player" }, { code: string }>(
        getTestFunctions(),
        "registerIdentityCode"
      );
      const { data: identity } = await registerIdentityCode({ role: "player" });

      const deleteAccount = httpsCallable(getTestFunctions(), "deleteAccount");
      const { data: result } = await deleteAccount({});

      expect(result).toMatchObject({ releasedCharacters: 1, removedLinkedDevices: 0 });

      const characterSnapshot = await characterRef.get();
      expect(characterSnapshot.data()).toMatchObject({ userId: null, isEditableByPlayer: false });

      const campaignSnapshot = await campaignRef.get();
      expect(campaignSnapshot.data()?.memberIds ?? []).not.toContain(playerUid);

      const claimLogSnapshot = await characterRef.collection("claimLog").get();
      expect(claimLogSnapshot.docs.some((d) => d.data().action === "release")).toBe(true);

      expect((await adminDb.collection("identitySecret").doc(playerUid).get()).exists).toBe(false);
      expect((await adminDb.collection("users").doc(playerUid).get()).exists).toBe(false);
      expect((await adminDb.collection("userProfiles").doc(playerUid).get()).exists).toBe(false);

      const getMode = httpsCallable<{ code: string }, { status: string }>(
        getTestFunctions(),
        "getIdentityRecoveryMode"
      );
      await signInTestUser();
      await expect(getMode({ code: identity.code })).resolves.toMatchObject({
        data: { status: "not-found" },
      });

      await expect(adminAuth.getUser(playerUid)).rejects.toMatchObject({
        code: "auth/user-not-found",
      });
    },
    20000
  );

  it(
    "blocks deletion while the caller still owns a campaign",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const deleteAccount = httpsCallable(getTestFunctions(), "deleteAccount");

      await expect(deleteAccount({})).rejects.toMatchObject({
        code: "functions/failed-precondition",
      });

      await expect(adminAuth.getUser(dmUid)).resolves.toBeDefined();
    },
    15000
  );
});
