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

import { batchDeleteRefs, deleteRefsAtomically } from "../../src/firestore/firestoreBatchDelete";

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

    // 440-per-chunk limit: 900 refs → 440 + 440 + 20
    expect(mockWriteBatch).toHaveBeenCalledTimes(3);
    expect(mockBatch.delete).toHaveBeenCalledTimes(900);
    expect(mockBatch.commit).toHaveBeenCalledTimes(3);
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

    expect(order).toEqual(["writeBatch", "commit", "writeBatch", "commit", "writeBatch", "commit"]);
  });
});

describe("deleteRefsAtomically", () => {
  it("commits every preflighted ref in one batch", async () => {
    await deleteRefsAtomically("mock-db" as never, fakeRefs(440));

    expect(mockWriteBatch).toHaveBeenCalledOnce();
    expect(mockBatch.delete).toHaveBeenCalledTimes(440);
    expect(mockBatch.commit).toHaveBeenCalledOnce();
  });

  it("stops before creating a batch when the atomic limit is exceeded", async () => {
    await expect(deleteRefsAtomically("mock-db" as never, fakeRefs(441))).rejects.toThrow(
      "cannot affect more than 440 documents"
    );

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
