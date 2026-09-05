// functions/tests/shared/metrics.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordUsageMetric } from "../../src/shared/metrics";

const mockSet = vi.fn();
const mockDoc = vi.fn(() => ({ set: mockSet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockIncrement = vi.fn((n: number) => ({ __increment: n }));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
  FieldValue: { increment: (n: number) => mockIncrement(n) },
}));

describe("recordUsageMetric", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
  });

  it("increments the named feature's counter with a merge write", async () => {
    await recordUsageMetric("character-claim");

    expect(mockCollection).toHaveBeenCalledWith("usageMetrics");
    expect(mockDoc).toHaveBeenCalledWith("character-claim");
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ count: { __increment: 1 } }), {
      merge: true,
    });
  });
});
