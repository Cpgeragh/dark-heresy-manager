// functions/tests/operations/identityReclaimJob.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startIdentityReclaimJob,
  processIdentityReclaimChunk,
} from "../../src/operations/identityReclaimJob";
import type { BulkJobRecord } from "../../src/shared/bulkJobs";
import * as identityMigration from "../../src/shared/identityMigration";

const {
  mockCreateBulkJob,
  mockAcquireJobLease,
  mockAdvanceJobCheckpoint,
  mockCompleteJob,
  mockFailJob,
  mockRecoveryGet,
  mockSecretGet,
  mockBatchUpdate,
  mockBatchSet,
  mockBatchDelete,
  mockBatchCommit,
  mockCollection,
  mockBatch,
} = vi.hoisted(() => {
  const mockRecoveryGet = vi.fn();
  const mockSecretGet = vi.fn();
  const mockBatchUpdate = vi.fn();
  const mockBatchSet = vi.fn();
  const mockBatchDelete = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

  const mockCollection = vi.fn((name: string) => {
    if (name === "identityRecovery") return { doc: (id: string) => ({ id, get: mockRecoveryGet }) };
    if (name === "identitySecret") return { doc: (id: string) => ({ id, get: mockSecretGet }) };
    return { doc: (id: string) => ({ id }) };
  });

  const mockBatch = vi.fn(() => ({
    update: mockBatchUpdate,
    set: mockBatchSet,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  }));

  return {
    mockCreateBulkJob: vi.fn(),
    mockAcquireJobLease: vi.fn(),
    mockAdvanceJobCheckpoint: vi.fn(),
    mockCompleteJob: vi.fn(),
    mockFailJob: vi.fn(),
    mockRecoveryGet,
    mockSecretGet,
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
  createBulkJob: mockCreateBulkJob,
  acquireJobLease: mockAcquireJobLease,
  advanceJobCheckpoint: mockAdvanceJobCheckpoint,
  completeJob: mockCompleteJob,
  failJob: mockFailJob,
}));

vi.mock("../../src/shared/identityMigration", () => ({
  computeOwnershipMigrationPlan: vi.fn(),
  migrateCampaignOwnership: vi.fn(),
}));

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
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("startIdentityReclaimJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaigns: [],
      totalWriteCount: 0,
    });
  });

  it("rejects when the code does not resolve", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: false });

    await expect(startIdentityReclaimJob({ code: "DH-NOPE-0000" }, "new-uid", "idem-key")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects reclaiming your own already-registered code", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "new-uid" }) });

    await expect(startIdentityReclaimJob({ code: "DH-SAME-0000" }, "new-uid", "idem-key")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("rejects when the secret doesn't match the given code", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-DIFF-0000" }) });

    await expect(startIdentityReclaimJob({ code: "DH-SAME-0000" }, "new-uid", "idem-key")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("transfers the identity documents immediately and creates a job on success", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid", role: "dm" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-SAME-0000" }) });
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaigns: [{ campaignId: "c1", role: "dm" }],
      totalWriteCount: 1,
    });
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startIdentityReclaimJob({ code: "DH-SAME-0000" }, "new-uid", "idem-key");

    expect(result).toEqual({ jobId: "job-1", totalCount: 1, role: "dm" });
    expect(mockBatchUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "DH-SAME-0000" }), {
      uid: "new-uid",
    });
    expect(mockBatchSet).toHaveBeenCalledWith(expect.objectContaining({ id: "new-uid" }), {
      code: "DH-SAME-0000",
    });
    expect(mockBatchDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "old-uid" }));
    expect(mockBatchCommit).toHaveBeenCalledOnce();
    expect(mockCreateBulkJob).toHaveBeenCalledWith(
      "identity-reclaim",
      "new-uid",
      { oldUid: "old-uid", newUid: "new-uid", campaigns: [{ campaignId: "c1", role: "dm" }] },
      1,
      "idem-key"
    );
  });

  it("defaults to the player role for codes registered before roles were tracked", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-SAME-0000" }) });
    mockCreateBulkJob.mockResolvedValue("job-1");

    const result = await startIdentityReclaimJob({ code: "DH-SAME-0000" }, "new-uid", "idem-key");

    expect(result.role).toBe("player");
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
    expect(mockFailJob).toHaveBeenCalledWith("job-1", "lease-1", "firestore is down");
  });
});
