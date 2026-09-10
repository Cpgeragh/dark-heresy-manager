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

describe("Functions: adjustCharacterNumber", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("adds concurrent quantity deltas to fresh server state without losing either update", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      drugs: [{ id: "drug-1", name: "Stimm", quantity: 2 }],
    });

    const adjust = httpsCallable(getTestFunctions(), "adjustCharacterNumber");
    const base = {
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "drugs",
      itemId: "drug-1",
      property: "quantity",
      fallbackValue: 2,
    };
    await Promise.all([
      adjust({ ...base, delta: 1, operationId: crypto.randomUUID() }),
      adjust({ ...base, delta: 2, operationId: crypto.randomUUID() }),
    ]);

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.drugs).toEqual([{ id: "drug-1", name: "Stimm", quantity: 5 }]);
  }, 15_000);

  it("changes nested ammunition while retaining sibling ammunition state", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({
      campaignId: campaignRef.id,
      userId: null,
      isEditableByPlayer: false,
      rangedWeapons: [
        {
          id: "weapon-1",
          name: "Autogun",
          ammoEntries: [
            { id: "ammo-1", name: "Bullets", clips: 1, rounds: 12 },
            { id: "ammo-2", name: "Manstopper", clips: 2, rounds: 6 },
          ],
        },
      ],
    });

    const adjust = httpsCallable(getTestFunctions(), "adjustCharacterNumber");
    await adjust({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "rangedWeapons",
      itemId: "weapon-1",
      nestedCollection: "ammoEntries",
      nestedItemId: "ammo-1",
      property: "rounds",
      delta: -2,
      fallbackValue: 12,
      operationId: crypto.randomUUID(),
    });

    const snapshot = await characterRef.get();
    expect(snapshot.data()?.rangedWeapons[0].ammoEntries).toEqual([
      { id: "ammo-1", name: "Bullets", clips: 1, rounds: 10 },
      { id: "ammo-2", name: "Manstopper", clips: 2, rounds: 6 },
    ]);
  }, 15_000);
});
