// functions/tests/operations/customItemMutationJob.test.ts
//
// bulkJobs.ts already has its own unit tests for lease/checkpoint behaviour,
// so it's mocked directly here, same reasoning as the other two job tests.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startCustomItemMutationJob,
  processCustomItemMutationChunk,
} from "../../src/operations/customItemMutationJob";
import type { BulkJobRecord } from "../../src/shared/bulkJobs";

const {
  mockCreateBulkJob,
  mockPrepareBulkJob,
  mockAcquireJobLease,
  mockAdvanceJobCheckpoint,
  mockCompleteJob,
  mockFailJob,
  mockHandleChunkFailure,
  mockCollection,
  mockBatch,
  mockBatchUpdate,
  mockBatchSet,
  mockBatchCommit,
  mockRunTransaction,
  mockTransactionGet,
  mockTransactionUpdate,
  mockTransactionSet,
  mockCampaignGet,
  mockItemGet,
  mockItemUpdate,
  mockVersionGet,
  mockUserLinkGet,
  characters,
} = vi.hoisted(() => {
  function makeCollectionMock() {
    const countGet = vi.fn();
    const pageGet = vi.fn();
    const self: Record<string, unknown> = {};
    self.orderBy = vi.fn(() => self);
    self.startAfter = vi.fn(() => self);
    self.limit = vi.fn(() => self);
    self.get = pageGet;
    self.count = vi.fn(() => ({ get: countGet }));
    return { ref: self, countGet, pageGet };
  }

  const characters = makeCollectionMock();

  const mockBatchUpdate = vi.fn();
  const mockBatchSet = vi.fn();
  const mockBatchCommit = vi.fn();
  const mockBatch = vi.fn(() => ({
    update: mockBatchUpdate,
    set: mockBatchSet,
    commit: mockBatchCommit,
  }));

  const mockTransactionGet = vi.fn();
  const mockTransactionUpdate = vi.fn();
  const mockTransactionSet = vi.fn();
  const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback({ get: mockTransactionGet, update: mockTransactionUpdate, set: mockTransactionSet })
  );

  const mockCampaignGet = vi.fn();
  const mockItemGet = vi.fn();
  const mockItemUpdate = vi.fn();
  const mockVersionGet = vi.fn();
  const mockUserLinkGet = vi.fn();
  const mockVersionRef = { get: mockVersionGet };
  const mockItemRef = {
    get: mockItemGet,
    update: mockItemUpdate,
    collection: vi.fn((name: string) => {
      if (name === "versions") return { doc: vi.fn(() => mockVersionRef) };
      throw new Error(`Unexpected item subcollection: ${name}`);
    }),
  };
  const mockCampaignRef = {
    get: mockCampaignGet,
    collection: vi.fn((name: string) => {
      if (name === "customItems") return { doc: vi.fn(() => mockItemRef) };
      if (name === "characters") return characters.ref;
      throw new Error(`Unexpected campaign subcollection: ${name}`);
    }),
  };

  const mockCreateBulkJob = vi.fn();
  const preparedJobRef = { id: "job-1" };
  const preparedJobRecord = { type: "custom-item-mutation", status: "pending" };
  const mockPrepareBulkJob = vi.fn(() => ({
    jobId: "job-1",
    ref: preparedJobRef,
    record: preparedJobRecord,
  }));
  const mockAcquireJobLease = vi.fn();
  const mockAdvanceJobCheckpoint = vi.fn();
  const mockCompleteJob = vi.fn();
  const mockFailJob = vi.fn();
  const mockHandleChunkFailure = vi.fn();

  const mockCollection = vi.fn((name: string) => {
    if (name === "campaigns") return { doc: vi.fn(() => mockCampaignRef) };
    if (name === "userLinks") return { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
    throw new Error(`Unexpected collection: ${name}`);
  });

  return {
    mockCreateBulkJob,
    mockPrepareBulkJob,
    mockAcquireJobLease,
    mockAdvanceJobCheckpoint,
    mockCompleteJob,
    mockFailJob,
    mockHandleChunkFailure,
    mockCollection,
    mockBatch,
    mockBatchUpdate,
    mockBatchSet,
    mockBatchCommit,
    mockRunTransaction,
    mockTransactionGet,
    mockTransactionUpdate,
    mockTransactionSet,
    mockCampaignGet,
    mockItemGet,
    mockItemUpdate,
    mockVersionGet,
    mockUserLinkGet,
    characters,
  };
});

vi.mock("../../src/shared/bulkJobs", () => ({
  createBulkJob: mockCreateBulkJob,
  prepareBulkJob: mockPrepareBulkJob,
  acquireJobLease: mockAcquireJobLease,
  advanceJobCheckpoint: mockAdvanceJobCheckpoint,
  completeJob: mockCompleteJob,
  failJob: mockFailJob,
  handleChunkFailure: mockHandleChunkFailure,
  MAX_JOB_TOTAL_COUNT: 10_000,
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    batch: mockBatch,
    runTransaction: mockRunTransaction,
  }),
  FieldPath: { documentId: () => "__name__" },
  FieldValue: { serverTimestamp: () => "server-timestamp" },
}));

const CAMPAIGN_ID = "campaign-1";
const CUSTOM_ITEM_ID = "item-1";
const DM_UID = "dm-uid";

function makeJob(overrides: Partial<BulkJobRecord> = {}): BulkJobRecord {
  return {
    type: "custom-item-mutation",
    status: "running",
    actorUid: DM_UID,
    data: {
      campaignId: CAMPAIGN_ID,
      customItemId: CUSTOM_ITEM_ID,
      mode: "remove",
      targetVersionId: null,
      actorUserId: DM_UID,
    },
    totalCount: 10,
    processedCount: 0,
    checkpoint: null,
    leaseOwner: "lease-1",
    leaseExpiresAt: Date.now() + 60_000,
    error: null,
    idempotencyKey: null,
    retryCount: 0,
    lastError: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("startCustomItemMutationJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      startCustomItemMutationJob(
        { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "remove", actorUserId: DM_UID },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(
      startCustomItemMutationJob(
        { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "remove", actorUserId: DM_UID },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the custom item does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: false });

    await expect(
      startCustomItemMutationJob(
        { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "remove", actorUserId: DM_UID },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects starting a mutation job whose character count exceeds the size ceiling, without mutating the item first", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 20_000 }) });

    await expect(
      startCustomItemMutationJob(
        {
          campaignId: CAMPAIGN_ID,
          customItemId: CUSTOM_ITEM_ID,
          mode: "archive-and-remove",
          actorUserId: DM_UID,
        },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
    expect(mockItemUpdate).not.toHaveBeenCalled();
    expect(mockCreateBulkJob).not.toHaveBeenCalled();
  });

  it("mode remove: creates the job without any item-level mutation", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 250 }) });
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startCustomItemMutationJob(
      { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "remove", actorUserId: DM_UID },
      DM_UID,
      "idem-key"
    );

    expect(mockItemUpdate).not.toHaveBeenCalled();
    expect(mockRunTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({ jobId: "job-1", totalCount: 250 });
    expect(mockCreateBulkJob).toHaveBeenCalledWith(
      "custom-item-mutation",
      DM_UID,
      {
        campaignId: CAMPAIGN_ID,
        customItemId: CUSTOM_ITEM_ID,
        mode: "remove",
        targetVersionId: null,
        actorUserId: DM_UID,
      },
      250,
      "idem-key"
    );
  });

  it("mode archive-and-remove: archives the item and creates the job atomically", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 5 }) });
    const result = await startCustomItemMutationJob(
      {
        campaignId: CAMPAIGN_ID,
        customItemId: CUSTOM_ITEM_ID,
        mode: "archive-and-remove",
        actorUserId: DM_UID,
      },
      DM_UID,
      "idem-key"
    );

    expect(mockItemUpdate).not.toHaveBeenCalled();
    expect(mockCreateBulkJob).not.toHaveBeenCalled();
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "archived", archivedByUserId: DM_UID })
    );
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job-1" }),
      expect.objectContaining({ type: "custom-item-mutation", status: "pending" })
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ jobId: "job-1", totalCount: 5 });
  });

  it("mode archive-and-remove: does not archive when job preparation fails", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 5 }) });
    mockPrepareBulkJob.mockImplementationOnce(() => {
      throw new Error("job preparation failed");
    });

    await expect(
      startCustomItemMutationJob(
        {
          campaignId: CAMPAIGN_ID,
          customItemId: CUSTOM_ITEM_ID,
          mode: "archive-and-remove",
          actorUserId: DM_UID,
        },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow("job preparation failed");

    expect(mockItemUpdate).not.toHaveBeenCalled();
    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("mode update: resolves the target version without mutating the item", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({
      exists: true,
      data: () => ({ draftVersionId: null, publishedVersionId: "v1", latestVersionId: "v1" }),
    });
    mockVersionGet.mockResolvedValue({ exists: true });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 3 }) });
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startCustomItemMutationJob(
      { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "update", actorUserId: DM_UID },
      DM_UID,
      "idem-key"
    );

    expect(mockItemUpdate).not.toHaveBeenCalled();
    expect(result.totalCount).toBe(3);
    expect(mockCreateBulkJob).toHaveBeenCalledWith(
      "custom-item-mutation",
      DM_UID,
      expect.objectContaining({ mode: "update", targetVersionId: "v1" }),
      3,
      "idem-key"
    );
  });

  it("mode update: rejects when the item has no version to apply", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({
      exists: true,
      data: () => ({ draftVersionId: null, publishedVersionId: null, latestVersionId: null }),
    });

    await expect(
      startCustomItemMutationJob(
        { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "update", actorUserId: DM_UID },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
  });

  it("mode publish-and-update: publishes the resolved version and creates the job atomically", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    mockTransactionGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ draftVersionId: "v2", latestVersionId: "v2" }) })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ data: { name: "Blade" }, versionNumber: 2 }),
      });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 7 }) });
    const result = await startCustomItemMutationJob(
      {
        campaignId: CAMPAIGN_ID,
        customItemId: CUSTOM_ITEM_ID,
        mode: "publish-and-update",
        actorUserId: DM_UID,
      },
      DM_UID,
      "idem-key"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "published", publishedByUserId: DM_UID })
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "published", publishedVersionId: "v2" })
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job-1" }),
      expect.objectContaining({ type: "custom-item-mutation", status: "pending" })
    );
    expect(result.jobId).toBe("job-1");
    expect(mockCreateBulkJob).not.toHaveBeenCalled();
    expect(mockPrepareBulkJob).toHaveBeenCalledWith(
      expect.anything(),
      "custom-item-mutation",
      DM_UID,
      expect.objectContaining({ mode: "publish-and-update", targetVersionId: "v2" }),
      7,
      "idem-key"
    );
  });

  it("mode publish-and-update: does not publish when job preparation fails", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockItemGet.mockResolvedValue({ exists: true });
    mockTransactionGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ draftVersionId: "v2", latestVersionId: "v2" }) })
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ data: { name: "Blade" }, versionNumber: 2 }),
      });
    characters.countGet.mockResolvedValue({ data: () => ({ count: 7 }) });
    mockPrepareBulkJob.mockImplementationOnce(() => {
      throw new Error("job preparation failed");
    });

    await expect(
      startCustomItemMutationJob(
        {
          campaignId: CAMPAIGN_ID,
          customItemId: CUSTOM_ITEM_ID,
          mode: "publish-and-update",
          actorUserId: DM_UID,
        },
        DM_UID,
        "idem-key"
      )
    ).rejects.toThrow("job preparation failed");

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockCreateBulkJob).not.toHaveBeenCalled();
  });
});

describe("processCustomItemMutationChunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the job is not a custom-item-mutation job, without touching Firestore", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ type: "other-job" }), leaseId: "lease-1" });

    await expect(processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockFailJob).not.toHaveBeenCalled();
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("fails the job and rejects when the caller is no longer the campaign DM", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "someone-else" }) });

    await expect(processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockHandleChunkFailure).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      expect.anything(),
      expect.anything(),
      "Only the campaign DM can perform this operation."
    );
  });

  it("fails the job with a safe message and rethrows on an unexpected error", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockRejectedValue(new Error("firestore is down"));

    await expect(processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      "firestore is down"
    );
    expect(mockHandleChunkFailure).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      expect.anything(),
      expect.anything(),
      "Unexpected error."
    );
  });

  it("returns an in-progress result instead of throwing when handleChunkFailure signals a retry", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ processedCount: 3 }), leaseId: "lease-1" });
    mockCampaignGet.mockRejectedValue(new Error("transient"));
    mockHandleChunkFailure.mockResolvedValueOnce(true);

    const result = await processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID);

    expect(result).toEqual({ done: false, processedCount: 3, totalCount: 10, mutatedThisChunk: 0 });
  });

  it("mode remove: mutates only characters holding a copy and advances the checkpoint on a full page", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    const psychic = { minorPowers: [], majorPowers: [] };
    const docs = Array.from({ length: 400 }, (_, i) => ({
      id: `c${i}`,
      ref: { id: `c${i}` },
      data: () =>
        i === 0 ? { gear: [{ customLibraryId: CUSTOM_ITEM_ID }], psychic } : { gear: [], psychic },
    }));
    characters.pageGet.mockResolvedValue({ empty: false, docs });

    const result = await processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(1);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      JSON.stringify({ cursor: "c399" }),
      400
    );
    expect(result).toEqual({
      done: false,
      processedCount: 400,
      totalCount: 10,
      mutatedThisChunk: 1,
    });
  });

  it("mode update: re-reads the target version and applies matching updates", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ data: { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "update", targetVersionId: "v1", actorUserId: DM_UID } }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockVersionGet.mockResolvedValue({
      exists: true,
      data: () => ({ category: "gear", data: { name: "New Gear" } }),
    });
    characters.pageGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: "c1",
          ref: { id: "c1" },
          data: () => ({ gear: [{ customLibraryId: CUSTOM_ITEM_ID, name: "Old" }] }),
        },
      ],
    });

    const result = await processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID);

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { id: "c1" },
      expect.objectContaining({ gear: [expect.objectContaining({ name: "New Gear" })] })
    );
    expect(result.done).toBe(true);
    expect(result.mutatedThisChunk).toBe(1);
  });

  it("mode update: rejects when the target version no longer exists", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ data: { campaignId: CAMPAIGN_ID, customItemId: CUSTOM_ITEM_ID, mode: "update", targetVersionId: "v1", actorUserId: DM_UID } }),
      leaseId: "lease-1",
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    mockVersionGet.mockResolvedValue({ exists: false });

    await expect(processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("completes the job and skips the batch entirely when no character in the page matches", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob(), leaseId: "lease-1" });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: DM_UID }) });
    characters.pageGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: "c1",
          ref: { id: "c1" },
          data: () => ({ gear: [], psychic: { minorPowers: [], majorPowers: [] } }),
        },
      ],
    });

    const result = await processCustomItemMutationChunk({ jobId: "job-1" }, DM_UID);

    expect(mockBatchCommit).not.toHaveBeenCalled();
    expect(mockCompleteJob).toHaveBeenCalledWith("job-1", "lease-1");
    expect(result).toEqual({ done: true, processedCount: 1, totalCount: 10, mutatedThisChunk: 0 });
  });
});
