// tests/functions/identityReclaimJob.test.ts
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
    "processIdentityReclaimChunk"
  );
  let result: ChunkResult;
  do {
    const response = await processChunk({ jobId });
    result = response.data;
  } while (!result.done);
  return result;
}

describe("Functions: identity reclaim job", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "migrates a DM campaign and a member campaign's owned characters across chunked calls, and transfers the identity documents immediately",
    async () => {
      const oldUid = "old-identity-uid";
      await adminDb.collection("identityRecovery").doc("DH-RCLM-0001").set({
        uid: oldUid,
        role: "dm",
      });
      await adminDb.collection("identitySecret").doc(oldUid).set({ code: "DH-RCLM-0001" });

      const dmCampaignRef = adminDb.collection("campaigns").doc();
      await dmCampaignRef.set({ dmId: oldUid, name: "DM Campaign", memberIds: [] });

      const memberCampaignRef = adminDb.collection("campaigns").doc();
      await memberCampaignRef.set({
        dmId: "someone-else",
        name: "Member Campaign",
        memberIds: [oldUid, "other-player"],
      });
      const characterRef = memberCampaignRef.collection("characters").doc();
      await characterRef.set({ userId: oldUid, name: "Test Character" });

      const newUid = await signInTestUser();
      const startJob = httpsCallable<
        { code: string },
        { jobId: string; totalCount: number; role: string }
      >(getTestFunctions(), "startIdentityReclaimJob");
      const { data: started } = await startJob({ code: "DH-RCLM-0001" });

      expect(started.role).toBe("dm");
      expect(started.totalCount).toBe(3);

      const final = await drainJob(started.jobId);
      expect(final.done).toBe(true);
      expect(final.processedCount).toBe(3);

      expect((await dmCampaignRef.get()).data()?.dmId).toBe(newUid);

      const memberCampaignSnapshot = await memberCampaignRef.get();
      expect(memberCampaignSnapshot.data()?.memberIds).toEqual(["other-player", newUid]);

      expect((await characterRef.get()).data()?.userId).toBe(newUid);

      const recoverySnapshot = await adminDb.collection("identityRecovery").doc("DH-RCLM-0001").get();
      expect(recoverySnapshot.data()?.uid).toBe(newUid);
      expect(
        (await adminDb.collection("identitySecret").doc(newUid).get()).data()?.code
      ).toBe("DH-RCLM-0001");
      expect((await adminDb.collection("identitySecret").doc(oldUid).get()).exists).toBe(false);
    },
    15000
  );

  it(
    "rejects a code that does not resolve",
    async () => {
      await signInTestUser();
      const startJob = httpsCallable(getTestFunctions(), "startIdentityReclaimJob");

      await expect(startJob({ code: "DH-0000-0000" })).rejects.toMatchObject({
        code: "functions/not-found",
      });
    },
    15000
  );
});
