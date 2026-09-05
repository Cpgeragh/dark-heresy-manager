// tests/functions/revokeRecoveryCode.test.ts
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

describe("Functions: revokeRecoveryCode", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("revokes a character's code so it can no longer be claimed, and blanks the stored code", async () => {
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

    const revokeRecoveryCode = httpsCallable<{ campaignId: string; characterId: string }, void>(
      getTestFunctions(),
      "revokeRecoveryCode"
    );
    await revokeRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id });

    const characterSnapshot = await characterRef.get();
    expect(characterSnapshot.data()?.recoveryCode).toBe("");

    await signInTestUser();
    const claimCharacter = httpsCallable(getTestFunctions(), "claimCharacter");
    await expect(claimCharacter({ code: registered.code })).rejects.toMatchObject({
      code: "functions/not-found",
    });

    const historySnapshot = await characterRef.collection("recoveryCodeHistory").get();
    expect(historySnapshot.docs).toHaveLength(1);
    expect(historySnapshot.docs[0].data()).toMatchObject({ status: "revoked" });
  }, 20000);

  it("rejects a caller who is not the campaign's DM", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({ campaignId: campaignRef.id, recoveryCode: "DH-ABCD-1234" });

    await signInTestUser();
    const revokeRecoveryCode = httpsCallable(getTestFunctions(), "revokeRecoveryCode");

    await expect(
      revokeRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id })
    ).rejects.toMatchObject({ code: "functions/permission-denied" });
  }, 15000);

  it("succeeds when the character already has no usable code", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({ campaignId: campaignRef.id });

    const revokeRecoveryCode = httpsCallable<{ campaignId: string; characterId: string }, void>(
      getTestFunctions(),
      "revokeRecoveryCode"
    );
    await revokeRecoveryCode({ campaignId: campaignRef.id, characterId: characterRef.id });

    const characterSnapshot = await characterRef.get();
    expect(characterSnapshot.data()?.recoveryCode).toBe("");
  }, 15000);
});
