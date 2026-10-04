import { afterAll, describe, expect, it } from "vitest";
import { httpsCallable } from "firebase/functions";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

describe("Functions: adjustCharacterXp", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("updates Total XP and writes immutable history in one accepted adjustment", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

    const playerUid = await signInTestUser();
    const ranks = [{ rank: 1, advances: [{ id: "legacy", name: "Legacy advance", cost: 150 }] }];
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: playerUid,
      isEditableByPlayer: true,
      experience: { total: 500, spent: 0, ranks },
    });

    const adjustCharacterXp = httpsCallable(getTestFunctions(), "adjustCharacterXp");
    await adjustCharacterXp({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      amountXp: 100,
      reason: "Session award correction",
      operationId: crypto.randomUUID(),
    });

    expect((await characterRef.get()).data()?.experience).toEqual({
      total: 600,
      spent: 150,
      ranks,
    });
    const history = await characterRef.collection("xpHistory").get();
    expect(history.docs.map((entry) => entry.data())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amountXp: 500,
          balanceXp: 500,
          reason: "Opening balance",
          source: "opening-balance",
        }),
        expect.objectContaining({
          amountXp: 100,
          balanceXp: 600,
          reason: "Session award correction",
          source: "manual-adjustment",
          actorUid: playerUid,
          actorRole: "player",
        }),
      ])
    );
  }, 15000);

  it("rejects a reduction below calculated Spent XP without writing history", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    const ranks = [{ rank: 1, advances: [{ id: "legacy", name: "Legacy advance", cost: 400 }] }];
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      experience: { total: 500, spent: 400, ranks },
    });

    const adjustCharacterXp = httpsCallable(getTestFunctions(), "adjustCharacterXp");
    await expect(
      adjustCharacterXp({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        amountXp: -200,
        reason: "Invalid reduction",
        operationId: crypto.randomUUID(),
      })
    ).rejects.toMatchObject({ code: "functions/failed-precondition" });

    expect((await characterRef.get()).data()?.experience).toEqual({
      total: 500,
      spent: 400,
      ranks,
    });
    expect((await characterRef.collection("xpHistory").get()).empty).toBe(true);
  }, 15000);
});
