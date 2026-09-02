// tests/functions/patchCharacterField.test.ts
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

describe("Functions: patchCharacterField", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "lets the DM patch a character's notes",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id, userId: null, isEditableByPlayer: false, notes: "" });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "notes",
        value: "The DM's own note.",
      });

      const snapshot = await characterRef.get();
      expect(snapshot.data()?.notes).toBe("The DM's own note.");
    },
    15000
  );

  it(
    "lets the DM patch a character's header",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: null,
        isEditableByPlayer: false,
        header: { characterName: "Unnamed" },
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "header",
        value: { characterName: "Brother Corvus", career: "Guardsman" },
      });

      const snapshot = await characterRef.get();
      expect(snapshot.data()?.header).toEqual({ characterName: "Brother Corvus", career: "Guardsman" });
    },
    15000
  );

  it(
    "rejects a header patch missing characterName",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: null,
        isEditableByPlayer: false,
        header: { characterName: "Unnamed" },
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await expect(
        patchCharacterField({
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          field: "header",
          value: { playerName: "Alex" },
        })
      ).rejects.toMatchObject({ code: "functions/invalid-argument" });
    },
    15000
  );

  it(
    "lets the owning player patch notes when the character is editable",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const playerUid = await signInTestUser();
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: playerUid,
        isEditableByPlayer: true,
        notes: "",
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await patchCharacterField({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
        field: "notes",
        value: [
          { id: "n1", title: "Session 1", text: "We met the Inquisitor.", updatedAt: "2026-09-02T00:00:00.000Z" },
        ],
      });

      const snapshot = await characterRef.get();
      expect(snapshot.data()?.notes).toEqual([
        { id: "n1", title: "Session 1", text: "We met the Inquisitor.", updatedAt: "2026-09-02T00:00:00.000Z" },
      ]);
    },
    15000
  );

  it(
    "rejects a player whose character is not editable",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const playerUid = await signInTestUser();
      await characterRef.set({
        campaignId: campaignRef.id,
        userId: playerUid,
        isEditableByPlayer: false,
        notes: "",
      });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await expect(
        patchCharacterField({
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          field: "notes",
          value: "Should be rejected.",
        })
      ).rejects.toMatchObject({ code: "functions/permission-denied" });
    },
    15000
  );

  it(
    "rejects a field with no registered validator",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id, userId: null, isEditableByPlayer: false });

      const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
      await expect(
        patchCharacterField({
          campaignId: campaignRef.id,
          characterId: characterRef.id,
          field: "experience",
          value: { total: 999999, spent: 0 },
        })
      ).rejects.toMatchObject({ code: "functions/invalid-argument" });
    },
    15000
  );
});
