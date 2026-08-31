// functions/tests/operations/identityReclaimJob.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startIdentityReclaimJob,
  processIdentityReclaimChunk,
} from "../../src/operations/identityReclaimJob";
import type { BulkJobRecord } from "../../src/shared/bulkJobs";
import * as identityMigration from "../../src/shared/identityMigration";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const {
  mockPrepareBulkJob,
  mockPreparedJobRef,
  mockPreparedJobRecord,
  mockAcquireJobLease,
  mockAdvanceJobCheckpoint,
  mockCompleteJob,
  mockFailJob,
  mockHandleChunkFailure,
  mockIndexGet,
  mockIndexDoc,
  mockProfileGet,
  mockLinksGet,
  mockBatchUpdate,
  mockBatchSet,
  mockBatchDelete,
  mockBatchCommit,
  mockCollection,
  mockBatch,
} = vi.hoisted(() => {
  const mockIndexGet = vi.fn();
  const mockProfileGet = vi.fn();
  const mockLinksGet = vi.fn();
  const mockIndexDoc = vi.fn((id: string) => ({ id, collectionName: "identityRecoveryIndex", get: mockIndexGet }));
  const mockBatchUpdate = vi.fn();
  const mockBatchSet = vi.fn();
  const mockBatchDelete = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

  const mockCollection = vi.fn((name: string) => {
    if (name === "identityRecoveryIndex") return { doc: mockIndexDoc };
    if (name === "userProfiles") {
      return {
        doc: (id: string) => ({ id, collectionName: name, get: mockProfileGet }),
      };
    }
    if (name === "userLinks") {
      return {
        where: vi.fn(() => ({
          limit: vi.fn(() => ({ get: mockLinksGet })),
        })),
      };
    }
    return { doc: (id: string) => ({ id, collectionName: name }) };
  });

  const mockBatch = vi.fn(() => ({
    update: mockBatchUpdate,
    set: mockBatchSet,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  }));

  const mockPreparedJobRef = { id: "job-1", collectionName: "bulkJobs" };
  const mockPreparedJobRecord = { type: "identity-reclaim", status: "pending" };

  return {
    mockPrepareBulkJob: vi.fn(() => ({
      jobId: "job-1",
      ref: mockPreparedJobRef,
      record: mockPreparedJobRecord,
    })),
    mockPreparedJobRef,
    mockPreparedJobRecord,
    mockAcquireJobLease: vi.fn(),
    mockAdvanceJobCheckpoint: vi.fn(),
    mockCompleteJob: vi.fn(),
    mockFailJob: vi.fn(),
    mockHandleChunkFailure: vi.fn(),
    mockIndexGet,
    mockIndexDoc,
    mockProfileGet,
    mockLinksGet,
    mockBatchUpdate,
    mockBatchSet,
    mockBatchDelete,
    mockBatchCommit,
    mockCollection,
    mockBatch,
  };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, batch: mockBatch }),
}));

vi.mock("../../src/shared/bulkJobs", () => ({
  prepareBulkJob: mockPrepareBulkJob,
  acquireJobLease: mockAcquireJobLease,
  advanceJobCheckpoint: mockAdvanceJobCheckpoint,
  completeJob: mockCompleteJob,
  failJob: mockFailJob,
  handleChunkFailure: mockHandleChunkFailure,
}));

vi.mock("../../src/shared/identityMigration", () => ({
  computeOwnershipMigrationPlan: vi.fn(),
  migrateCampaignOwnership: vi.fn(),
}));

const SECRET = "secret";
const CODE = "DH-SAME-0000";

function makeJob(overrides: Partial<BulkJobRecord> = {}): BulkJobRecord {
  return {
    type: "identity-reclaim",
    status: "running",
    actorUid: "new-uid",
    data: { oldUid: "old-uid", newUid: "new-uid", campaigns: [] },
    totalCount: 0,
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

describe("startIdentityReclaimJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: "ExistingUser" }),
    });
    mockLinksGet.mockResolvedValue({ empty: true });
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaigns: [],
      totalWriteCount: 0,
    });
  });

  it("rejects when the code does not resolve", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await expect(
      startIdentityReclaimJob({ code: "DH-NOPE-0000" }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects reclaiming your own already-registered code", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "new-uid" }) });

    await expect(
      startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
  });

  it("rejects reclaim while any linked device remains connected", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    mockLinksGet.mockResolvedValue({ empty: false });

    await expect(
      startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(identityMigration.computeOwnershipMigrationPlan).not.toHaveBeenCalled();
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("transfers the identity documents immediately and creates a job on success", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid", role: "dm" }) });
    mockProfileGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: "ExistingUser" }),
    });
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaigns: [{ campaignId: "c1", role: "dm" }],
      totalWriteCount: 1,
    });
    const result = await startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET);

    expect(result).toEqual({
      jobId: "job-1",
      totalCount: 1,
      role: "dm",
      profileTransferred: true,
    });
    const expectedHash = hashRecoveryCode(CODE, SECRET);
    expect(mockBatchUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: expectedHash }), {
      uid: "new-uid",
    });
    expect(mockBatchSet).toHaveBeenCalledWith(expect.objectContaining({ id: "new-uid" }), {
      code: CODE,
    });
    expect(mockBatchDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "old-uid" }));
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "userProfiles", id: "new-uid" }),
      { firstName: "ExistingUser" }
    );
    expect(mockBatchDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "userProfiles", id: "old-uid" })
    );
    expect(mockBatchSet).toHaveBeenCalledWith(mockPreparedJobRef, mockPreparedJobRecord);
    expect(mockBatchCommit).toHaveBeenCalledOnce();
    expect(mockPrepareBulkJob).toHaveBeenCalledWith(
      expect.anything(),
      "identity-reclaim",
      "new-uid",
      { oldUid: "old-uid", newUid: "new-uid", campaigns: [{ campaignId: "c1", role: "dm" }] },
      1,
      "idem-key"
    );
  });

  it("rejects a recovery identity with no profile before transferring anything", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid", role: "dm" }) });
    mockProfileGet.mockResolvedValue({ exists: false });

    await expect(
      startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockBatch).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("rejects an invalid stored profile before transferring any identity data", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid", role: "dm" }) });
    mockProfileGet.mockResolvedValue({ exists: true, data: () => ({ firstName: "" }) });

    await expect(
      startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockBatch).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  it("defaults to the player role for codes registered before roles were tracked", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });

    const result = await startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET);

    expect(result).toMatchObject({ role: "player", profileTransferred: true });
  });

  it("resolves the target by the code's HMAC hash, not the raw code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET).catch(() => {});

    expect(mockIndexDoc).toHaveBeenCalledWith(hashRecoveryCode(CODE, SECRET));
  });

  it("rejects an oversized migration before transferring identity documents", async () => {
    mockIndexGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaigns: [],
      totalWriteCount: 10_001,
    });
    mockPrepareBulkJob.mockImplementationOnce(() => {
      throw Object.assign(new Error("too large"), { code: "resource-exhausted" });
    });

    await expect(
      startIdentityReclaimJob({ code: CODE }, "new-uid", "idem-key", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));

    expect(mockBatch).not.toHaveBeenCalled();
    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchSet).not.toHaveBeenCalled();
    expect(mockBatchDelete).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});

describe("processIdentityReclaimChunk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the job is not an identity-reclaim job, without touching the migration helper", async () => {
    mockAcquireJobLease.mockResolvedValue({ job: makeJob({ type: "other-job" }), leaseId: "lease-1" });

    await expect(processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(identityMigration.migrateCampaignOwnership).not.toHaveBeenCalled();
  });

  it("processes every campaign in one chunk when under the write budget and completes the job", async () => {
    const campaigns = [
      { campaignId: "c1", role: "dm" as const },
      { campaignId: "c2", role: "member" as const },
    ];
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ data: { oldUid: "old-uid", newUid: "new-uid", campaigns }, totalCount: 4 }),
      leaseId: "lease-1",
    });
    vi.mocked(identityMigration.migrateCampaignOwnership)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    const result = await processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid");

    expect(identityMigration.migrateCampaignOwnership).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledOnce();
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith("job-1", "lease-1", null, 4);
    expect(mockCompleteJob).toHaveBeenCalledWith("job-1", "lease-1");
    expect(result).toEqual({ done: true, processedCount: 4, totalCount: 4 });
  });

  it("stops once the write budget is spent and advances the checkpoint to resume from", async () => {
    const campaigns = [
      { campaignId: "c1", role: "member" as const },
      { campaignId: "c2", role: "member" as const },
      { campaignId: "c3", role: "member" as const },
    ];
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ data: { oldUid: "old-uid", newUid: "new-uid", campaigns }, totalCount: 900 }),
      leaseId: "lease-1",
    });
    vi.mocked(identityMigration.migrateCampaignOwnership)
      .mockResolvedValueOnce(150)
      .mockResolvedValueOnce(200);

    const result = await processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid");

    // 150 + 200 = 350, already past the 300 budget, so the loop stops before
    // ever calling migrateCampaignOwnership for the third campaign.
    expect(identityMigration.migrateCampaignOwnership).toHaveBeenCalledTimes(2);
    expect(mockAdvanceJobCheckpoint).toHaveBeenCalledWith("job-1", "lease-1", "2", 350);
    expect(mockCompleteJob).not.toHaveBeenCalled();
    expect(result.done).toBe(false);
  });

  it("resumes from the stored checkpoint index", async () => {
    const campaigns = [
      { campaignId: "c1", role: "dm" as const },
      { campaignId: "c2", role: "dm" as const },
    ];
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        data: { oldUid: "old-uid", newUid: "new-uid", campaigns },
        checkpoint: "1",
        processedCount: 1,
        totalCount: 2,
      }),
      leaseId: "lease-1",
    });
    vi.mocked(identityMigration.migrateCampaignOwnership).mockResolvedValue(1);

    await processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid");

    expect(identityMigration.migrateCampaignOwnership).toHaveBeenCalledTimes(1);
    expect(identityMigration.migrateCampaignOwnership).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      campaigns[1],
      "old-uid",
      "new-uid"
    );
  });

  it("completes with zero writes when the plan has no campaigns", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({ data: { oldUid: "old-uid", newUid: "new-uid", campaigns: [] }, totalCount: 0 }),
      leaseId: "lease-1",
    });

    const result = await processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid");

    expect(mockBatchCommit).not.toHaveBeenCalled();
    expect(mockCompleteJob).toHaveBeenCalledWith("job-1", "lease-1");
    expect(result).toEqual({ done: true, processedCount: 0, totalCount: 0 });
  });

  it("fails the job with the real error message and rethrows on an unexpected error", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        data: {
          oldUid: "old-uid",
          newUid: "new-uid",
          campaigns: [{ campaignId: "c1", role: "dm" }],
        },
      }),
      leaseId: "lease-1",
    });
    vi.mocked(identityMigration.migrateCampaignOwnership).mockRejectedValue(
      new Error("firestore is down")
    );

    await expect(processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid")).rejects.toThrow(
      "firestore is down"
    );
    expect(mockHandleChunkFailure).toHaveBeenCalledWith(
      "job-1",
      "lease-1",
      expect.anything(),
      expect.anything(),
      "firestore is down"
    );
  });

  it("returns an in-progress result instead of throwing when handleChunkFailure signals a retry", async () => {
    mockAcquireJobLease.mockResolvedValue({
      job: makeJob({
        processedCount: 2,
        data: {
          oldUid: "old-uid",
          newUid: "new-uid",
          campaigns: [{ campaignId: "c1", role: "dm" }],
        },
      }),
      leaseId: "lease-1",
    });
    vi.mocked(identityMigration.migrateCampaignOwnership).mockRejectedValue(new Error("transient"));
    mockHandleChunkFailure.mockResolvedValueOnce(true);

    const result = await processIdentityReclaimChunk({ jobId: "job-1" }, "new-uid");

    expect(result).toEqual({ done: false, processedCount: 2, totalCount: 0 });
  });
});
