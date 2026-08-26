// tests/functions/campaignDeletionJob.test.ts
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
    "processCampaignDeletionChunk"
  );
  let result: ChunkResult;
  do {
    const response = await processChunk({ jobId });
    result = response.data;
  } while (!result.done);
  return result;
}

describe("Functions: campaign deletion job", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "deletes a campaign and its full dependent tree across chunked calls",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const characterRef = campaignRef.collection("characters").doc();
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
      await characterRef.collection("xpProposals").add({ amount: 100 });

      const threadRef = campaignRef.collection("threads").doc(characterRef.id);
      await threadRef.set({ characterId: characterRef.id });
      await threadRef.collection("messages").add({ text: "hello" });
      await threadRef.collection("messages").add({ text: "world" });

      const customItemRef = campaignRef.collection("customItems").doc();
      await customItemRef.set({ name: "Custom Blade" });
      await customItemRef.collection("versions").add({ version: 1 });

      await campaignRef.collection("sessions").add({ summary: "Session one" });
      await campaignRef.collection("sessions").add({ summary: "Session two" });

      const startJob = httpsCallable<{ campaignId: string }, { jobId: string; totalCount: number }>(
        getTestFunctions(),
        "startCampaignDeletionJob"
      );
      const { data: started } = await startJob({ campaignId: campaignRef.id });

      expect(started.totalCount).toBe(12);

      const final = await drainJob(started.jobId);
      expect(final.done).toBe(true);
      expect(final.processedCount).toBe(12);

      const lookupRecoveryCode = httpsCallable<{ code: string }, { status: string }>(
        getTestFunctions(),
        "lookupRecoveryCode"
      );
      expect((await campaignRef.get()).exists).toBe(false);
      expect((await characterRef.get()).exists).toBe(false);
      expect((await threadRef.get()).exists).toBe(false);
      expect((await customItemRef.get()).exists).toBe(false);
      expect((await lookupRecoveryCode({ code: recoveryCode })).data.status).toBe("not-found");
      expect((await characterRef.collection("claimLog").get()).empty).toBe(true);
      expect((await characterRef.collection("xpProposals").get()).empty).toBe(true);
      expect((await threadRef.collection("messages").get()).empty).toBe(true);
      expect((await customItemRef.collection("versions").get()).empty).toBe(true);
      expect((await campaignRef.collection("sessions").get()).empty).toBe(true);
    },
    20000
  );

  it(
    "rejects starting a deletion job for a caller who is not the campaign DM",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      await signInTestUser();
      const startJob = httpsCallable(getTestFunctions(), "startCampaignDeletionJob");

      await expect(startJob({ campaignId: campaignRef.id })).rejects.toMatchObject({
        code: "functions/permission-denied",
      });
    },
    15000
  );

  it(
    "rejects starting a deletion job when a character has no usable Recovery Code",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      await campaignRef.collection("characters").add({ campaignId: campaignRef.id });

      const startJob = httpsCallable(getTestFunctions(), "startCampaignDeletionJob");

      await expect(startJob({ campaignId: campaignRef.id })).rejects.toMatchObject({
        code: "functions/failed-precondition",
      });
    },
    15000
  );
});
