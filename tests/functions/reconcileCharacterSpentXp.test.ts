// tests/functions/reconcileCharacterSpentXp.test.ts
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

describe("Functions: reconcileCharacterSpentXp", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("lets the DM correct a stale spent total without touching total or ranks", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 500, spent: 50, ranks: [{ rankId: "conscript" }] },
    });

    const reconcileCharacterSpentXp = httpsCallable(
      getTestFunctions(),
      "reconcileCharacterSpentXp"
    );
    const { data } = await reconcileCharacterSpentXp({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      spent: 150,
    });

    expect(data).toEqual({ updated: true });
    const snapshot = await characterRef.get();
    expect(snapshot.data()?.experience).toEqual({
      total: 500,
      spent: 150,
      ranks: [{ rankId: "conscript" }],
    });
  }, 15000);

  it("does not write when the spent value is already correct", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 500, spent: 150 },
    });

    const reconcileCharacterSpentXp = httpsCallable(
      getTestFunctions(),
      "reconcileCharacterSpentXp"
    );
    const { data } = await reconcileCharacterSpentXp({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      spent: 150,
    });

    expect(data).toEqual({ updated: false });
  }, 15000);

  it("rejects a non-editable player", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

    const playerUid = await signInTestUser();
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: playerUid,
      isEditableByPlayer: false,
      experience: { total: 500, spent: 50 },
    });

    const reconcileCharacterSpentXp = httpsCallable(
      getTestFunctions(),
      "reconcileCharacterSpentXp"
    );
    await expect(
      reconcileCharacterSpentXp({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        spent: 100,
      })
    ).rejects.toMatchObject({ code: "functions/permission-denied" });
  }, 15000);

  it("rejects an invalid spent value", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 500, spent: 50 },
    });

    const reconcileCharacterSpentXp = httpsCallable(
      getTestFunctions(),
      "reconcileCharacterSpentXp"
    );
    await expect(
      reconcileCharacterSpentXp({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        spent: -5,
      })
    ).rejects.toMatchObject({ code: "functions/invalid-argument" });
  }, 15000);
});
