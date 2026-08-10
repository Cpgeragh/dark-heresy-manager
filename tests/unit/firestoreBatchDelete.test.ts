import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockBatch, mockWriteBatch } = vi.hoisted(() => {
  const mockBatch = {
    commit: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };
  return {
    mockBatch,
    mockWriteBatch: vi.fn(() => mockBatch),
  };
});

vi.mock("firebase/firestore", () => ({
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

import { batchDeleteRefs } from "../../src/utils/firestoreBatchDelete";

function fakeRefs(count: number) {
  return Array.from({ length: count }, (_, i) => `ref-${i}` as unknown as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBatch.commit.mockResolvedValue(undefined);
});

describe("batchDeleteRefs", () => {
  it("does nothing for an empty list", async () => {
    await batchDeleteRefs("mock-db" as never, []);

    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("deletes every ref in a single batch when under the chunk limit", async () => {
    const refs = fakeRefs(10);

    await batchDeleteRefs("mock-db" as never, refs);

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.delete).toHaveBeenCalledTimes(10);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("splits into multiple batches once the chunk limit is exceeded", async () => {
    const refs = fakeRefs(900);

    await batchDeleteRefs("mock-db" as never, refs);

    // 450-per-chunk limit: 900 refs → 2 full batches
    expect(mockWriteBatch).toHaveBeenCalledTimes(2);
    expect(mockBatch.delete).toHaveBeenCalledTimes(900);
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
  });

  it("commits each chunk before starting the next", async () => {
    const order: string[] = [];
    mockWriteBatch.mockImplementation(() => {
      order.push("writeBatch");
      return mockBatch;
    });
    mockBatch.commit.mockImplementation(async () => {
      order.push("commit");
    });

    await batchDeleteRefs("mock-db" as never, fakeRefs(900));

    expect(order).toEqual(["writeBatch", "commit", "writeBatch", "commit"]);
  });
});
