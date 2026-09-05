import { createHash } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { initializeApp as initializeAdminApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { httpsCallable } from "firebase/functions";
import { getTestFunctions, signInTestUser, teardownTestFunctions } from "./setup";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
if (!getApps().length) {
  initializeAdminApp({ projectId: "dh-test" });
}
const adminDb = getFirestore();

const LEASE_MS = 60 * 1000;
const RESULT_RETENTION_MS = 24 * 60 * 60 * 1000;

function operationKey(uid: string, operationId: string): string {
  const operationHash = createHash("sha256").update(operationId).digest("hex");
  return `patch-character-field:${uid}:${operationHash}`;
}

async function createCharacter(dmUid: string) {
  const campaignRef = adminDb.collection("campaigns").doc();
  const characterRef = campaignRef.collection("characters").doc();
  await campaignRef.set({ dmId: dmUid, name: "Idempotency Test", memberIds: [] });
  await characterRef.set({
    campaignId: campaignRef.id,
    userId: null,
    isEditableByPlayer: false,
    notes: "initial",
  });
  return { campaignRef, characterRef };
}

describe("Functions: idempotency recovery", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("rejects an active legacy attempt, then recovers it after its lease expires", async () => {
    const dmUid = await signInTestUser();
    const { campaignRef, characterRef } = await createCharacter(dmUid);
    const operationId = `recover-${characterRef.id}`;
    const keyRef = adminDb.collection("idempotencyKeys").doc(operationKey(dmUid, operationId));
    await keyRef.set({ status: "in-progress", startedAt: Date.now() });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    const request = {
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: "recovered",
      operationId,
    };

    await expect(patchCharacterField(request)).rejects.toMatchObject({
      code: "functions/aborted",
    });
    expect((await characterRef.get()).data()?.notes).toBe("initial");

    await keyRef.update({ startedAt: Date.now() - LEASE_MS - 1 });
    await expect(patchCharacterField(request)).resolves.toBeDefined();

    expect((await characterRef.get()).data()?.notes).toBe("recovered");
    expect((await keyRef.get()).data()).toEqual(
      expect.objectContaining({ status: "completed", result: null, expiresAt: expect.anything() })
    );
  }, 20000);

  it("replays a live completed result without running the mutation again", async () => {
    const dmUid = await signInTestUser();
    const { campaignRef, characterRef } = await createCharacter(dmUid);
    const operationId = `replay-${characterRef.id}`;
    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    const request = {
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: "first result",
      operationId,
    };

    await patchCharacterField(request);
    await characterRef.update({ notes: "changed outside the operation" });
    await patchCharacterField(request);

    expect((await characterRef.get()).data()?.notes).toBe("changed outside the operation");
  }, 20000);

  it("runs a fresh attempt after the completed result's replay window expires", async () => {
    const dmUid = await signInTestUser();
    const { campaignRef, characterRef } = await createCharacter(dmUid);
    const operationId = `expired-${characterRef.id}`;
    const keyRef = adminDb.collection("idempotencyKeys").doc(operationKey(dmUid, operationId));
    await keyRef.set({
      status: "completed",
      result: null,
      completedAt: Date.now() - RESULT_RETENTION_MS - 1,
    });

    const patchCharacterField = httpsCallable(getTestFunctions(), "patchCharacterField");
    await patchCharacterField({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
      field: "notes",
      value: "fresh attempt",
      operationId,
    });

    expect((await characterRef.get()).data()?.notes).toBe("fresh attempt");
    expect((await keyRef.get()).data()).toEqual(
      expect.objectContaining({ status: "completed", completedAt: expect.any(Number) })
    );
  }, 20000);
});
