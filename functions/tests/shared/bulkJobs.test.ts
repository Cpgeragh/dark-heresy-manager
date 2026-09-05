// functions/tests/shared/bulkJobs.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBulkJob,
  acquireJobLease,
  advanceJobCheckpoint,
  completeJob,
  failJob,
  cancelBulkJob,
  handleChunkFailure,
  isRetriableChunkError,
  MAX_CHUNK_RETRIES,
  MAX_JOB_TOTAL_COUNT,
  type BulkJobRecord,
} from "../../src/shared/bulkJobs";

const mockSet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
  callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    delete: mockTransactionDelete,
  })
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
    retryCount: 0,
    lastError: null,
    createdAt: Date.now(),
    updatedAt: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("rejects a job above the global safety ceiling before writing anything", async () => {
    await expect(
      createBulkJob("test-job", "user-1", {}, MAX_JOB_TOTAL_COUNT + 1, null)
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("rejects an invalid job size before writing anything", async () => {
    await expect(createBulkJob("test-job", "user-1", {}, -1, null)).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
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
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ actorUid: "other" }),
    });

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

  it("expires and fails a job that's been open too long, clearing its idempotency key, instead of leasing it", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () =>
        makeJob({
          createdAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
          idempotencyKey: "start-test-job:user-1:c1",
        }),
    });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "failed", error: "Job expired without completing." })
    );
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "idempotencyKeys", id: "start-test-job:user-1:c1" })
    );
  });

  it("rejects when the job is already cancelled", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ status: "cancelled" }),
    });

    await expect(acquireJobLease("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("does not expire a job well within the window, even with an unrelated stale lease", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () =>
        makeJob({
          createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
          leaseOwner: "stale-lease",
          leaseExpiresAt: Date.now() - 1000,
        }),
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
        retryCount: 0,
        lastError: null,
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

describe("isRetriableChunkError", () => {
  it("treats known numeric gRPC transient codes as retriable", () => {
    expect(isRetriableChunkError({ code: 14 })).toBe(true); // UNAVAILABLE
    expect(isRetriableChunkError({ code: 4 })).toBe(true); // DEADLINE_EXCEEDED
    expect(isRetriableChunkError({ code: 10 })).toBe(true); // ABORTED
    expect(isRetriableChunkError({ code: 13 })).toBe(true); // INTERNAL
  });

  it("treats the equivalent HttpsError string codes as retriable", () => {
    expect(isRetriableChunkError({ code: "unavailable" })).toBe(true);
    expect(isRetriableChunkError({ code: "deadline-exceeded" })).toBe(true);
  });

  it("treats permanent codes, and errors with no code at all, as not retriable", () => {
    expect(isRetriableChunkError({ code: "permission-denied" })).toBe(false);
    expect(isRetriableChunkError({ code: "not-found" })).toBe(false);
    expect(isRetriableChunkError(new Error("plain error"))).toBe(false);
    expect(isRetriableChunkError(null)).toBe(false);
  });
});

describe("handleChunkFailure", () => {
  it("retries a transient error under the cap: releases the lease and bumps retryCount without failing the job", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1", retryCount: 2 }),
    });

    const retried = await handleChunkFailure(
      "job-1",
      "lease-1",
      makeJob({ leaseOwner: "lease-1", retryCount: 2 }),
      { code: 14 },
      "unavailable"
    );

    expect(retried).toBe(true);
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        retryCount: { __increment: 1 },
        lastError: "unavailable",
        leaseOwner: null,
        leaseExpiresAt: null,
      })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "failed" })
    );
  });

  it("permanently fails once the retry cap is exhausted, even for a transient-looking error", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1", retryCount: MAX_CHUNK_RETRIES - 1 }),
    });

    const retried = await handleChunkFailure(
      "job-1",
      "lease-1",
      makeJob({ leaseOwner: "lease-1", retryCount: MAX_CHUNK_RETRIES - 1 }),
      { code: 14 },
      "unavailable"
    );

    expect(retried).toBe(false);
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "failed", error: "unavailable" })
    );
  });

  it("fails immediately for a non-retriable error, regardless of retry count", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ leaseOwner: "lease-1", retryCount: 0 }),
    });

    const retried = await handleChunkFailure(
      "job-1",
      "lease-1",
      makeJob({ leaseOwner: "lease-1", retryCount: 0 }),
      { code: "permission-denied" },
      "Only the campaign DM can do this."
    );

    expect(retried).toBe(false);
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "failed", error: "Only the campaign DM can do this." })
    );
  });
});

describe("cancelBulkJob", () => {
  it("rejects when the job does not exist", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(cancelBulkJob("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the caller did not start the job", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ actorUid: "other" }),
    });

    await expect(cancelBulkJob("job-1", "user-1")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
  });

  it("marks a live job cancelled and clears its recorded idempotency key", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => makeJob({ idempotencyKey: "start-test-job:user-1:c1" }),
    });

    await cancelBulkJob("job-1", "user-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "cancelled", error: "Cancelled by the user." })
    );
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: "idempotencyKeys", id: "start-test-job:user-1:c1" })
    );
  });

  it.each(["completed", "failed", "cancelled"] as const)(
    "is a safe no-op when the job is already %s",
    async (status) => {
      mockTransactionGet.mockResolvedValue({ exists: true, data: () => makeJob({ status }) });

      await expect(cancelBulkJob("job-1", "user-1")).resolves.toBeUndefined();
      expect(mockTransactionUpdate).not.toHaveBeenCalled();
    }
  );
});
