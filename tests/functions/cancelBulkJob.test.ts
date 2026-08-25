// tests/functions/cancelBulkJob.test.ts
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

describe("Functions: cancelBulkJob", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "cancels a job so a later chunk call is refused",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const startJob = httpsCallable<{ campaignId: string }, { jobId: string; totalCount: number }>(
        getTestFunctions(),
        "startCampaignDeletionJob"
      );
      const { data: started } = await startJob({ campaignId: campaignRef.id });

      const cancelJob = httpsCallable<{ jobId: string }, void>(getTestFunctions(), "cancelBulkJob");
      await cancelJob({ jobId: started.jobId });

      const processChunk = httpsCallable(getTestFunctions(), "processCampaignDeletionChunk");
      await expect(processChunk({ jobId: started.jobId })).rejects.toMatchObject({
        code: "functions/failed-precondition",
      });

      const jobSnapshot = await adminDb.collection("bulkJobs").doc(started.jobId).get();
      expect(jobSnapshot.data()?.status).toBe("cancelled");
      expect((await campaignRef.get()).exists).toBe(true);
    },
    15000
  );

  it(
    "rejects cancelling a job that belongs to a different caller",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const startJob = httpsCallable<{ campaignId: string }, { jobId: string; totalCount: number }>(
        getTestFunctions(),
        "startCampaignDeletionJob"
      );
      const { data: started } = await startJob({ campaignId: campaignRef.id });

      await signInTestUser();
      const cancelJob = httpsCallable(getTestFunctions(), "cancelBulkJob");

      await expect(cancelJob({ jobId: started.jobId })).rejects.toMatchObject({
        code: "functions/permission-denied",
      });
    },
    15000
  );
});
