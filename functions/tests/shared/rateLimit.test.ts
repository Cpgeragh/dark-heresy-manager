// functions/tests/shared/rateLimit.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { enforceRateLimit } from "../../src/shared/rateLimit";

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({ get: mockGet, set: mockSet });
});
const mockDoc = vi.fn(() => ({}));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the attempt and records it when under the limit", async () => {
    mockGet.mockResolvedValue({ exists: false });

    await expect(
      enforceRateLimit({ key: "test-key", limit: 5, windowMs: 900_000 })
    ).resolves.toBeUndefined();

    expect(mockSet).toHaveBeenCalledOnce();
    const [, written] = mockSet.mock.calls[0];
    expect(written.attempts).toHaveLength(1);
  });

  it("throws resource-exhausted once the window already holds the limit's worth of attempts", async () => {
    const now = Date.now();
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ attempts: [now, now, now, now, now] }),
    });

    await expect(
      enforceRateLimit({ key: "test-key", limit: 5, windowMs: 900_000 })
    ).rejects.toThrow(expect.objectContaining({ code: "resource-exhausted" }));
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("drops attempts older than the window before counting", async () => {
    const now = Date.now();
    const stale = now - 1_000_000;
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ attempts: [stale, stale, stale, stale, stale] }),
    });

    await expect(
      enforceRateLimit({ key: "test-key", limit: 5, windowMs: 900_000 })
    ).resolves.toBeUndefined();

    const [, written] = mockSet.mock.calls[0];
    expect(written.attempts).toHaveLength(1);
  });
});
