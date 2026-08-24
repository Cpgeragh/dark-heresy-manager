// functions/tests/shared/idempotency.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withIdempotency } from "../../src/shared/idempotency";

const mockTransactionGet = vi.fn();
const mockTransactionSet = vi.fn();
const mockRefSet = vi.fn();
const mockRefDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) => {
  return callback({ get: mockTransactionGet, set: mockTransactionSet });
});
const mockDoc = vi.fn(() => ({ set: mockRefSet, delete: mockRefDelete }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

describe("withIdempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefSet.mockResolvedValue(undefined);
    mockRefDelete.mockResolvedValue(undefined);
  });

  it("runs the handler and stores the result when the key is new", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    const result = await withIdempotency("key-1", async () => "handler-result");

    expect(result).toBe("handler-result");
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "in-progress" })
    );
    expect(mockRefSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", result: "handler-result" })
    );
  });

  it("returns the cached result without re-running the handler when already completed", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: "completed", result: "cached-result" }),
    });
    const handler = vi.fn(async () => "should-not-run");

    const result = await withIdempotency("key-1", handler);

    expect(result).toBe("cached-result");
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a duplicate call while the same key is still in progress", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: "in-progress" }),
    });
    const handler = vi.fn(async () => "should-not-run");

    await expect(withIdempotency("key-1", handler)).rejects.toThrow(
      expect.objectContaining({ code: "aborted" })
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("caches a void handler's result as null, since Firestore rejects storing undefined", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await withIdempotency("key-1", async () => undefined);

    expect(mockRefSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", result: null })
    );
  });

  it("clears the record on failure so a genuine retry can proceed", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });
    const failure = new Error("handler failed");

    await expect(
      withIdempotency("key-1", async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(mockRefDelete).toHaveBeenCalledOnce();
    expect(mockRefSet).not.toHaveBeenCalled();
  });
});
