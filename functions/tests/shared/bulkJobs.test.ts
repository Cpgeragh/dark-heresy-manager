// functions/tests/shared/bulkJobs.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  createBulkJob,
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  failJob,
  type BulkJobRecord,
} from "../../src/shared/bulkJobs";

const mockSet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
  callback({ get: mockTransactionGet, update: mockTransactionUpdate, delete: mockTransactionDelete })
);
const mockCollection = vi.fn((collectionName: string) => ({
  doc: (id: string) => ({ id, collectionName, set: mockSet }),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, runTransaction: mockRunTransaction }),
  FieldValue: { increment: (n: number) => ({ __increment: n }) },
}));

function makeJob(overrides: Partial<BulkJobRecord> = {}): BulkJobRecord {
  return {
    type: "test-job",
    status: "pending",
    actorUid: "user-1",
    data: {},
    totalCount: 10,
    processedCount: 0,
    checkpoint: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    error: null,
    idempotencyKey: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("createBulkJob", () => {
  it("creates a pending job record with the given type, actor, data, count, and idempotency key", async () => {
    mockSet.mockResolvedValue(undefined);

    await createBulkJob("test-job", "user-1", { campaignId: "c1" }, 10, "start-test-job:user-1:c1");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "test-job",
        status: "pending",
        actorUid: "user-1",
        data: { campaignId: "c1" },
        totalCount: 10,
        idempotencyKey: "start-test-job:user-1:c1",
      })
    );
  });

  it("stores a null idempotency key when none is given", async () => {
    mockSet.mockResolvedValue(undefined);

    await createBulkJob("test-job", "user-1", {}, 10, null);

    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: null }));
  });
});

describe("acquireJobLease", () => {
  it("rejects when the job does not exist", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the caller did not start the job", async () => {
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => makeJob({ actorUid: "other" }) });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
  });

  it("rejects when the job is already completed", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ status: "completed" }),
    });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("rejects when another call currently holds an unexpired lease", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "other-lease", leaseExpiresAt: Date.now() + 30_000 }),
    });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "aborted" })
    );
  });

  it("acquires the lease when none is held, and returns the current checkpoint", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ checkpoint: "char-5" }),
    });

    const result = await acquireJobLease("job-1", "user-1");

    expect(result.job.checkpoint).toBe("char-5");
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "running", leaseOwner: result.leaseId })
    );
  });

  it("acquires the lease when a prior lease has expired", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "stale-lease", leaseExpiresAt: Date.now() - 1000 }),
    });

    await expect(acquireJobLease("job-1", "user-1")).resolves.toBeDefined();
  });
});

describe("advanceJobCheckpoint", () => {
  it("updates the checkpoint and processed count when the lease matches", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1" }),
    });

    await advanceJobCheckpoint("job-1", "lease-1", "char-10", 5);

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        checkpoint: "char-10",
        processedCount: { __increment: 5 },
        leaseOwner: null,
        leaseExpiresAt: null,
      })
    );
  });

  it("rejects when the lease no longer matches", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "someone-elses-lease" }),
    });

    await expect(advanceJobCheckpoint("job-1", "lease-1", "char-10", 5)).rejects.toThrow(
      expect.objectContaining({ code: "aborted" })
    );
  });
});

describe("completeJob / failJob", () => {
  it("marks the job completed and releases the lease when it matches", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1" }),
    });

    await completeJob("job-1", "lease-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "completed", leaseOwner: null })
    );
  });

  it("marks the job failed with the given error when the lease matches, and leaves other jobs' idempotency records alone when it has none", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1" }),
    });

    await failJob("job-1", "lease-1", "boom");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "failed", error: "boom" })
    );
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });

  it("also deletes the job's recorded idempotency key, so a fresh start call can create a new job instead of replaying the dead one", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1", idempotencyKey: "start-test-job:user-1:c1" }),
    });

    await failJob("job-1", "lease-1", "boom");

    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "idempotencyKeys", id: "start-test-job:user-1:c1" })
    );
  });
});
