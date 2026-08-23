import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDocumentId,
  mockGetDocs,
  mockLimit,
  mockOrderBy,
  mockQuery,
  mockStartAfter,
  mockWriteBatch,
} = vi.hoisted(() => ({
  mockDocumentId: vi.fn(() => "__name__"),
  mockGetDocs: vi.fn(),
  mockLimit: vi.fn((value: number) => ({ limit: value })),
  mockOrderBy: vi.fn((field: unknown) => ({ orderBy: field })),
  mockQuery: vi.fn((...parts: unknown[]) => parts),
  mockStartAfter: vi.fn((cursor: unknown) => ({ startAfter: cursor })),
  mockWriteBatch: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  documentId: (...args: unknown[]) => mockDocumentId(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

import { deleteQueryDocsInPages, forEachQueryPage } from "../../src/utils/firestoreQueryPages";

function makePage(count: number, offset = 0) {
  const docs = Array.from({ length: count }, (_, index) => ({
    id: `doc-${offset + index + 1}`,
    ref: `collection/doc-${offset + index + 1}`,
  }));

  return { empty: docs.length === 0, docs };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("forEachQueryPage", () => {
  it("reads and processes a query in stable bounded pages", async () => {
    mockGetDocs.mockResolvedValueOnce(makePage(100)).mockResolvedValueOnce(makePage(25, 100));
    const processedPageSizes: number[] = [];

    const processed = await forEachQueryPage("source-query" as never, async (documents) => {
      processedPageSizes.push(documents.length);
    });

    expect(processed).toBe(125);
    expect(processedPageSizes).toEqual([100, 25]);
    expect(mockGetDocs).toHaveBeenCalledTimes(2);
    expect(mockLimit).toHaveBeenNthCalledWith(1, 100);
    expect(mockLimit).toHaveBeenNthCalledWith(2, 100);
    expect(mockStartAfter).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-100" }));
  });

  it.each([0, 451, 1.5])("rejects unsafe page size %s before reading", async (pageSize) => {
    await expect(
      forEachQueryPage("source-query" as never, async () => undefined, pageSize)
    ).rejects.toThrow("whole number from 1 to 450");

    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});

describe("deleteQueryDocsInPages", () => {
  it("commits each deletion page in a separate bounded batch", async () => {
    mockGetDocs.mockResolvedValueOnce(makePage(100)).mockResolvedValueOnce(makePage(1, 100));
    const batches: Array<{ delete: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> }> =
      [];
    mockWriteBatch.mockImplementation(() => {
      const batch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch;
    });

    const deleted = await deleteQueryDocsInPages(
      "mock-firestore" as never,
      "source-query" as never
    );

    expect(deleted).toBe(101);
    expect(batches).toHaveLength(2);
    expect(batches[0].delete).toHaveBeenCalledTimes(100);
    expect(batches[1].delete).toHaveBeenCalledTimes(1);
    expect(batches[0].commit).toHaveBeenCalledOnce();
    expect(batches[1].commit).toHaveBeenCalledOnce();
  });
});
