// tests/functions/characterDeletionJob.test.ts
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

interface ChunkResult {
  done: boolean;
  processedCount: number;
  totalCount: number;
}

async function drainJob(jobId: string): Promise<ChunkResult> {
  const processChunk = httpsCallable<{ jobId: string }, ChunkResult>(
    getTestFunctions(),
    "processCharacterDeletionChunk"
  );
  let result: ChunkResult;
  do {
    const response = await processChunk({ jobId });
    result = response.data;
  } while (!result.done);
  return result;
}

describe("Functions: character deletion job", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "deletes a character and every dependent document across chunked calls",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      const recoveryCode = "DH-TEST-0001";
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id, recoveryCode });
      await adminDb
        .collection("recoveryIndex")
        .doc(recoveryCode)
        .set({ campaignId: campaignRef.id, characterId: characterRef.id });
      await characterRef.collection("claimLog").add({ action: "claim", actorUid: dmUid });
      const threadRef = campaignRef.collection("threads").doc(characterRef.id);
      await threadRef.set({ characterId: characterRef.id });
      await threadRef.collection("messages").add({ text: "hello" });
      await threadRef.collection("messages").add({ text: "world" });

      const startJob = httpsCallable<
        { campaignId: string; characterId: string },
        { jobId: string; totalCount: number }
      >(getTestFunctions(), "startCharacterDeletionJob");
      const { data: started } = await startJob({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      expect(started.totalCount).toBe(6);

      const final = await drainJob(started.jobId);
      expect(final.done).toBe(true);
      expect(final.processedCount).toBe(6);

      expect((await characterRef.get()).exists).toBe(false);
      expect((await threadRef.get()).exists).toBe(false);
      expect((await adminDb.collection("recoveryIndex").doc(recoveryCode).get()).exists).toBe(false);
      expect((await characterRef.collection("claimLog").get()).empty).toBe(true);
      expect((await threadRef.collection("messages").get()).empty).toBe(true);
    },
    15000
  );

  it(
    "resumes correctly after being interrupted partway through, leaving a consistent partial state in between",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      const recoveryCode = "DH-TEST-0002";
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id, recoveryCode });
      await adminDb
        .collection("recoveryIndex")
        .doc(recoveryCode)
        .set({ campaignId: campaignRef.id, characterId: characterRef.id });
      await characterRef.collection("claimLog").add({ action: "claim", actorUid: dmUid });
      await characterRef.collection("claimLog").add({ action: "release", actorUid: dmUid });
      const threadRef = campaignRef.collection("threads").doc(characterRef.id);
      await threadRef.set({ characterId: characterRef.id });
      await threadRef.collection("messages").add({ text: "hello" });

      const startJob = httpsCallable<
        { campaignId: string; characterId: string },
        { jobId: string; totalCount: number }
      >(getTestFunctions(), "startCharacterDeletionJob");
      const { data: started } = await startJob({
        campaignId: campaignRef.id,
        characterId: characterRef.id,
      });

      // 2 claimLog + 0 xpProposals + 1 message + 1 thread + 1 recoveryIndex + 1 character = 6
      expect(started.totalCount).toBe(6);

      const processChunk = httpsCallable<{ jobId: string }, ChunkResult>(
        getTestFunctions(),
        "processCharacterDeletionChunk"
      );

      // Process exactly the claimLog phase, then stop, simulating a dropped
      // connection or closed tab right after the first phase finishes.
      const afterFirstChunk = await processChunk({ jobId: started.jobId });
      expect(afterFirstChunk.data.done).toBe(false);
      expect(afterFirstChunk.data.processedCount).toBe(2);

      // The interrupted, partial state must itself be correct, not just
      // "eventually converges": claimLog genuinely gone, everything else
      // genuinely untouched.
      expect((await characterRef.collection("claimLog").get()).empty).toBe(true);
      expect((await threadRef.collection("messages").get()).docs).toHaveLength(1);
      expect((await threadRef.get()).exists).toBe(true);
      expect((await adminDb.collection("recoveryIndex").doc(recoveryCode).get()).exists).toBe(true);
      expect((await characterRef.get()).exists).toBe(true);

      // Resume later (a fresh call, exactly what a reconnecting client would
      // do) and confirm it picks up from the checkpoint and finishes cleanly.
      let result = afterFirstChunk.data;
      while (!result.done) {
        const response = await processChunk({ jobId: started.jobId });
        result = response.data;
      }

      expect(result.processedCount).toBe(6);
      expect((await characterRef.get()).exists).toBe(false);
      expect((await threadRef.get()).exists).toBe(false);
      expect((await adminDb.collection("recoveryIndex").doc(recoveryCode).get()).exists).toBe(false);
      expect((await threadRef.collection("messages").get()).empty).toBe(true);
    },
    15000
  );

  it(
    "rejects starting a deletion job for a caller who is not the campaign DM",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id, recoveryCode: "DH-TEST-0002" });

      await signInTestUser();
      const startJob = httpsCallable(getTestFunctions(), "startCharacterDeletionJob");

      await expect(
        startJob({ campaignId: campaignRef.id, characterId: characterRef.id })
      ).rejects.toMatchObject({ code: "functions/permission-denied" });
    },
    15000
  );

  it(
    "rejects starting a deletion job for a character with no Recovery Code",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      const characterRef = campaignRef.collection("characters").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await characterRef.set({ campaignId: campaignRef.id });

      const startJob = httpsCallable(getTestFunctions(), "startCharacterDeletionJob");

      await expect(
        startJob({ campaignId: campaignRef.id, characterId: characterRef.id })
      ).rejects.toMatchObject({ code: "functions/failed-precondition" });
    },
    15000
  );
});
