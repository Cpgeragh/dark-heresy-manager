// tests/functions/customItemMutationJob.test.ts
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
  mutatedThisChunk: number;
}

async function drainJob(jobId: string): Promise<number> {
  const processChunk = httpsCallable<{ jobId: string }, ChunkResult>(
    getTestFunctions(),
    "processCustomItemMutationChunk"
  );
  let result: ChunkResult;
  let totalMutated = 0;
  do {
    const response = await processChunk({ jobId });
    result = response.data;
    totalMutated += result.mutatedThisChunk;
  } while (!result.done);
  return totalMutated;
}

describe("Functions: custom item mutation job", () => {
  afterAll(async () => {
    await teardownTestFunctions();
  });

  it(
    "publish-and-update propagates a draft version to every holding character",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const itemRef = campaignRef.collection("customItems").doc();
      const versionRef = itemRef.collection("versions").doc();
      await itemRef.set({
        status: "draft",
        name: "Old Name",
        draftVersionId: versionRef.id,
        latestVersionId: versionRef.id,
        latestVersionNumber: 1,
      });
      await versionRef.set({
        category: "gear",
        versionNumber: 1,
        data: { name: "New Name", weight: 2 },
      });

      const holderRef = campaignRef.collection("characters").doc();
      await holderRef.set({
        campaignId: campaignRef.id,
        gear: [{ customLibraryId: itemRef.id, name: "Old Name", weight: 1 }],
        psychic: { minorPowers: [], majorPowers: [] },
      });
      const nonHolderRef = campaignRef.collection("characters").doc();
      await nonHolderRef.set({
        campaignId: campaignRef.id,
        gear: [],
        psychic: { minorPowers: [], majorPowers: [] },
      });

      const startJob = httpsCallable<
        { campaignId: string; customItemId: string; mode: string; actorUserId: string },
        { jobId: string; totalCount: number }
      >(getTestFunctions(), "startCustomItemMutationJob");
      const { data: started } = await startJob({
        campaignId: campaignRef.id,
        customItemId: itemRef.id,
        mode: "publish-and-update",
        actorUserId: dmUid,
      });

      expect(started.totalCount).toBe(2);

      const totalMutated = await drainJob(started.jobId);
      expect(totalMutated).toBe(1);

      const itemSnapshot = await itemRef.get();
      expect(itemSnapshot.data()?.status).toBe("published");
      expect(itemSnapshot.data()?.publishedVersionId).toBe(versionRef.id);

      const holderSnapshot = await holderRef.get();
      expect(holderSnapshot.data()?.gear[0].name).toBe("New Name");
      expect(holderSnapshot.data()?.gear[0].customLibraryVersionId).toBe(versionRef.id);

      const nonHolderSnapshot = await nonHolderRef.get();
      expect(nonHolderSnapshot.data()?.gear).toEqual([]);
    },
    20000
  );

  it(
    "archive-and-remove archives the item and strips every character's copy",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });

      const itemRef = campaignRef.collection("customItems").doc();
      await itemRef.set({ status: "published", name: "Cursed Blade" });

      const holderRef = campaignRef.collection("characters").doc();
      await holderRef.set({
        campaignId: campaignRef.id,
        meleeWeapons: [{ customLibraryId: itemRef.id }],
        psychic: { minorPowers: [], majorPowers: [] },
      });

      const startJob = httpsCallable<
        { campaignId: string; customItemId: string; mode: string; actorUserId: string },
        { jobId: string; totalCount: number }
      >(getTestFunctions(), "startCustomItemMutationJob");
      const { data: started } = await startJob({
        campaignId: campaignRef.id,
        customItemId: itemRef.id,
        mode: "archive-and-remove",
        actorUserId: dmUid,
      });

      await drainJob(started.jobId);

      const itemSnapshot = await itemRef.get();
      expect(itemSnapshot.data()?.status).toBe("archived");

      const holderSnapshot = await holderRef.get();
      expect(holderSnapshot.data()?.meleeWeapons).toEqual([]);
    },
    20000
  );

  it(
    "rejects starting a mutation job for a caller who is not the campaign DM",
    async () => {
      const dmUid = await signInTestUser();
      const campaignRef = adminDb.collection("campaigns").doc();
      await campaignRef.set({ dmId: dmUid, name: "Test Campaign", memberIds: [] });
      const itemRef = campaignRef.collection("customItems").doc();
      await itemRef.set({ status: "draft", name: "Item" });

      await signInTestUser();
      const startJob = httpsCallable(getTestFunctions(), "startCustomItemMutationJob");

      await expect(
        startJob({
          campaignId: campaignRef.id,
          customItemId: itemRef.id,
          mode: "remove",
          actorUserId: dmUid,
        })
      ).rejects.toMatchObject({ code: "functions/permission-denied" });
    },
    15000
  );
});
