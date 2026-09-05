// tests/functions/bulkJobLease.test.ts
//
// Tests bulkJobs.ts's shared lease mechanism against the real emulator,
// specifically recovery after real abandonment (a chunk call that acquired
// the lease and then vanished before releasing it, as opposed to a job that
// stopped cleanly between phases, already covered in
// characterDeletionJob.test.ts). Uses character deletion only as the
// simplest vehicle to reach the shared mechanism; nothing here is about
// deletion completeness.
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

describe("Functions: bulk job lease recovery", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it("resumes a job whose lease was abandoned (acquired, then never released) once that lease has expired", async () => {
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
    const recoveryCode = registered.code;
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
    expect(started.totalCount).toBe(6);

    const processChunk = httpsCallable<{ jobId: string }, ChunkResult>(
      getTestFunctions(),
      "processCharacterDeletionChunk"
    );

    // Finish the claimLog phase for real, checkpoint now points at
    // xpProposals and the lease is correctly released.
    const afterFirstChunk = await processChunk({ jobId: started.jobId });
    expect(afterFirstChunk.data.done).toBe(false);
    expect(afterFirstChunk.data.processedCount).toBe(2);

    // Simulate real abandonment: some other call acquired the lease for
    // the next phase and then vanished (crashed, timed out, connection
    // dropped) before ever releasing it. The checkpoint stays exactly
    // where the real call left it, only the lease fields are faked.
    const jobRef = adminDb.collection("bulkJobs").doc(started.jobId);
    await jobRef.update({
      leaseOwner: "zombie-lease",
      leaseExpiresAt: Date.now() - 1000,
    });

    // A fresh call must still succeed once that lease has expired, and
    // resume from the real checkpoint rather than restarting or getting
    // stuck behind the abandoned lease.
    let result = (await processChunk({ jobId: started.jobId })).data;
    while (!result.done) {
      result = (await processChunk({ jobId: started.jobId })).data;
    }

    const lookupRecoveryCode = httpsCallable<{ code: string }, { status: string }>(
      getTestFunctions(),
      "lookupRecoveryCode"
    );
    expect(result.processedCount).toBe(6);
    expect((await characterRef.get()).exists).toBe(false);
    expect((await threadRef.get()).exists).toBe(false);
    expect((await lookupRecoveryCode({ code: recoveryCode })).data.status).toBe("not-found");
  }, 15000);

  it("rejects processing a job whose lease is still genuinely unexpired", async () => {
    const dmUid = await signInTestUser();
    const campaignRef = adminDb.collection("campaigns").doc();
    const characterRef = campaignRef.collection("characters").doc();
    const recoveryCode = "DH-TEST-0004";
    await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
    await characterRef.set({ campaignId: campaignRef.id, recoveryCode });
    await adminDb
      .collection("recoveryIndex")
      .doc(recoveryCode)
      .set({ campaignId: campaignRef.id, characterId: characterRef.id });

    const startJob = httpsCallable<
      { campaignId: string; characterId: string },
      { jobId: string; totalCount: number }
    >(getTestFunctions(), "startCharacterDeletionJob");
    const { data: started } = await startJob({
      campaignId: campaignRef.id,
      characterId: characterRef.id,
    });

    const jobRef = adminDb.collection("bulkJobs").doc(started.jobId);
    await jobRef.update({
      leaseOwner: "still-active-lease",
      leaseExpiresAt: Date.now() + 30_000,
    });

    const processChunk = httpsCallable<{ jobId: string }, ChunkResult>(
      getTestFunctions(),
      "processCharacterDeletionChunk"
    );

    await expect(processChunk({ jobId: started.jobId })).rejects.toMatchObject({
      code: "functions/aborted",
    });
  }, 15000);
});
