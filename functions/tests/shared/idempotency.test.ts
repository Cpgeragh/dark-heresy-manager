// functions/tests/shared/idempotency.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IDEMPOTENCY_LEASE_MS,
  IDEMPOTENCY_RESULT_RETENTION_MS,
  withIdempotency,
} from "../../src/shared/idempotency";

const NOW = 2_000_000_000_000;

const {
  mockRunTransaction,
  mockTransactionDelete,
  mockTransactionSet,
  mockTransactionUpdate,
  mockCollection,
  mockLoggerWarn,
  MockTimestamp,
  state,
} = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(readonly millis: number) {}
    static fromMillis(millis: number) {
      return new FakeTimestamp(millis);
    }
  }

  const state: { record: Record<string, unknown> | null; transactionNumber: number } = {
    record: null,
    transactionNumber: 0,
  };
  const mockTransactionGet = vi.fn(async () => ({
    exists: state.record !== null,
    data: () => state.record ?? undefined,
  }));
  const mockTransactionSet = vi.fn((ref: { collectionName?: string }, value: unknown) => {
    if (ref.collectionName === "idempotencyKeys") {
      state.record = value as Record<string, unknown>;
    }
  });
  const mockTransactionUpdate = vi.fn(
    (ref: { collectionName?: string }, value: Record<string, unknown>) => {
      if (ref.collectionName === "idempotencyKeys" && state.record) {
        state.record = { ...state.record, ...value };
      }
    }
  );
  const mockTransactionDelete = vi.fn((ref: { collectionName?: string }) => {
    if (ref.collectionName === "idempotencyKeys") state.record = null;
  });
  const mockRunTransaction = vi.fn(
    async (callback: (transaction: Record<string, unknown>) => Promise<unknown>) => {
      state.transactionNumber += 1;
      const transactionId = state.transactionNumber;
      return callback({
        transactionId,
        get: mockTransactionGet,
        set: mockTransactionSet,
        update: mockTransactionUpdate,
        delete: mockTransactionDelete,
      });
    }
  );
  const mockDoc = vi.fn((id: string) => ({ id, collectionName: "idempotencyKeys" }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));

  return {
    mockRunTransaction,
    mockTransactionDelete,
    mockTransactionSet,
    mockTransactionUpdate,
    mockCollection,
    mockLoggerWarn: vi.fn(),
    MockTimestamp: FakeTimestamp,
    state,
  };
});

vi.mock("node:crypto", () => ({ randomUUID: () => "lease-new" }));

vi.mock("firebase-functions", () => ({
  logger: { warn: mockLoggerWarn },
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
  Timestamp: MockTimestamp,
}));

function completedRecord(overrides: Record<string, unknown> = {}) {
  return {
    status: "completed",
    result: "cached-result",
    completedAt: NOW - 1_000,
    expiresAt: MockTimestamp.fromMillis(NOW + IDEMPOTENCY_RESULT_RETENTION_MS),
    ...overrides,
  };
}

describe("withIdempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.record = null;
    state.transactionNumber = 0;
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });

  it("claims a new key and commits the operation and result in the same transaction", async () => {
    const domainRef = { id: "domain-1", collectionName: "characters" };
    let operationTransactionId: number | undefined;

    const result = await withIdempotency("key-1", (execution) =>
      execution.runTransaction(async (transaction) => {
        operationTransactionId = (transaction as unknown as { transactionId: number })
          .transactionId;
        transaction.set(domainRef as never, { value: 1 });
        return "handler-result";
      })
    );

    expect(result).toBe("handler-result");
    expect(state.record).toEqual(
      expect.objectContaining({
        status: "completed",
        result: "handler-result",
        completedAt: NOW,
      })
    );
    const completionCall = mockTransactionSet.mock.calls.find(
      ([ref, value]) =>
        (ref as { collectionName?: string }).collectionName === "idempotencyKeys" &&
        (value as { status?: string }).status === "completed"
    );
    expect(completionCall).toBeDefined();
    expect(operationTransactionId).toBe(2);
  });

  it("returns a live cached result without running the handler", async () => {
    state.record = completedRecord();
    const handler = vi.fn();

    await expect(withIdempotency("key-1", handler)).resolves.toBe("cached-result");

    expect(handler).not.toHaveBeenCalled();
    expect(mockRunTransaction).toHaveBeenCalledOnce();
  });

  it("backfills the TTL timestamp on a live legacy completed record", async () => {
    state.record = completedRecord({ expiresAt: undefined });

    await expect(withIdempotency("key-1", vi.fn())).resolves.toBe("cached-result");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ expiresAt: expect.any(MockTimestamp) })
    );
  });

  it("rejects a duplicate while its lease is active and reports when to retry", async () => {
    state.record = {
      status: "in-progress",
      leaseOwner: "lease-current",
      leaseExpiresAt: NOW + 10_000,
      attemptCount: 1,
      startedAt: NOW - 1_000,
    };
    const handler = vi.fn();

    await expect(withIdempotency("key-1", handler)).rejects.toEqual(
      expect.objectContaining({
        code: "aborted",
        details: { retryAfterMs: 10_000 },
      })
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("recovers an expired legacy in-progress record and increments its attempt count", async () => {
    state.record = {
      status: "in-progress",
      startedAt: NOW - IDEMPOTENCY_LEASE_MS - 1,
    };
    let claimedRecord: Record<string, unknown> | null = null;

    await withIdempotency("key-1", (execution) => {
      claimedRecord = { ...state.record };
      return execution.runTransaction(async () => "recovered");
    });

    expect(claimedRecord).toEqual(
      expect.objectContaining({
        status: "in-progress",
        leaseOwner: "lease-new",
        leaseExpiresAt: NOW + IDEMPOTENCY_LEASE_MS,
        attemptCount: 2,
      })
    );
    expect(state.record).toEqual(expect.objectContaining({ status: "completed" }));
  });

  it("starts a new attempt after a completed result expires", async () => {
    state.record = completedRecord({
      completedAt: NOW - IDEMPOTENCY_RESULT_RETENTION_MS,
    });
    const handler = vi.fn((execution) =>
      execution.runTransaction(async () => "replacement-result")
    );

    await expect(withIdempotency("key-1", handler)).resolves.toBe("replacement-result");

    expect(handler).toHaveBeenCalledOnce();
    expect(state.record).toEqual(
      expect.objectContaining({ status: "completed", result: "replacement-result" })
    );
  });

  it("stores a void result as null", async () => {
    await withIdempotency<void>("key-1", (execution) =>
      execution.runTransaction(async () => undefined)
    );

    expect(state.record).toEqual(expect.objectContaining({ status: "completed", result: null }));
  });

  it("releases its own lease and preserves the original handler error", async () => {
    const failure = new Error("handler failed");

    await expect(
      withIdempotency("key-1", async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(state.record).toBeNull();
    expect(mockTransactionDelete).toHaveBeenCalledOnce();
  });

  it("does not delete a replacement lease when an old attempt loses ownership", async () => {
    await expect(
      withIdempotency("key-1", async (execution) => {
        state.record = {
          status: "in-progress",
          leaseOwner: "lease-replacement",
          leaseExpiresAt: NOW + IDEMPOTENCY_LEASE_MS,
          attemptCount: 2,
          startedAt: NOW,
        };
        return execution.runTransaction(async () => "must-not-run");
      })
    ).rejects.toEqual(expect.objectContaining({ code: "aborted" }));

    expect(state.record).toEqual(expect.objectContaining({ leaseOwner: "lease-replacement" }));
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });

  it("rejects malformed records without running the handler", async () => {
    state.record = { status: "in-progress", leaseOwner: "lease-current" };
    const handler = vi.fn();

    await expect(withIdempotency("key-1", handler)).rejects.toEqual(
      expect.objectContaining({ code: "internal" })
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a handler that returns without committing and releases its lease", async () => {
    await expect(withIdempotency("key-1", async () => "uncommitted")).rejects.toEqual(
      expect.objectContaining({ code: "internal" })
    );

    expect(state.record).toBeNull();
  });

  it("prevents an operation from starting a second commit transaction", async () => {
    await expect(
      withIdempotency("key-1", async (execution) => {
        await expect(execution.runTransaction(async () => "first")).resolves.toBe("first");
        return execution.runTransaction(async () => "second");
      })
    ).rejects.toEqual(expect.objectContaining({ code: "internal" }));

    expect(state.record).toEqual(expect.objectContaining({ status: "completed", result: "first" }));
  });
});
