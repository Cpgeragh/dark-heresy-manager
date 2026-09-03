import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAtomicDelete,
  mockGetDoc,
  mockGetDocs,
  mockCallStartCustomItemMutationJob,
  mockCallProcessCustomItemMutationChunk,
} = vi.hoisted(() => ({
  mockAtomicDelete: vi.fn().mockResolvedValue(undefined),
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockCallStartCustomItemMutationJob: vi.fn(),
  mockCallProcessCustomItemMutationChunk: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => args.slice(1).join("/"),
  doc: (...args: unknown[]) => args.slice(1).join("/"),
  documentId: () => "__name__",
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  runTransaction: vi.fn(),
  serverTimestamp: () => "server-timestamp",
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "startCustomItemMutationJob") return mockCallStartCustomItemMutationJob;
    if (name === "processCustomItemMutationChunk") return mockCallProcessCustomItemMutationChunk;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db", functions: "mock-functions" }));
vi.mock("../../src/firebase/converters", () => ({
  charactersCollectionRef: (campaignId: string) => `campaigns/${campaignId}/characters`,
}));
vi.mock("../../src/firestore/firestoreBatchDelete", () => ({
  deleteRefsAtomically: (...args: unknown[]) => mockAtomicDelete(...args),
}));

import {
  archiveAndRemoveAllCustomItemCopies,
  permanentlyDeleteCustomItem,
  publishAndUpdateAllCopies,
  removeAllCustomItemCopies,
  updateAllCustomItemCopies,
} from "../../src/services/customItemService";

function itemSnapshot(status: "published" | "archived" = "published") {
  return {
    ref: "campaigns/camp-1/customItems/item-1",
    exists: () => true,
    data: () => ({
      id: "item-1",
      campaignId: "camp-1",
      category: "gear",
      status,
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDoc.mockResolvedValue(itemSnapshot());
  mockGetDocs.mockResolvedValue({ docs: [], empty: true });
  mockAtomicDelete.mockResolvedValue(undefined);
});

describe("permanentlyDeleteCustomItem", () => {
  it("atomically deletes an archived definition and every version", async () => {
    mockGetDoc.mockResolvedValue(itemSnapshot("archived"));
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: "version-1", ref: "versions/version-1", data: () => ({}) },
        { id: "version-2", ref: "versions/version-2", data: () => ({}) },
      ],
      empty: false,
    });

    await permanentlyDeleteCustomItem({ campaignId: "camp-1", customItemId: "item-1" });

    expect(mockAtomicDelete).toHaveBeenCalledWith("mock-db", [
      "campaigns/camp-1/customItems/item-1",
      "versions/version-1",
      "versions/version-2",
    ]);
  });
});

describe.each([
  ["archiveAndRemoveAllCustomItemCopies", archiveAndRemoveAllCustomItemCopies, "archive-and-remove"],
  ["publishAndUpdateAllCopies", publishAndUpdateAllCopies, "publish-and-update"],
] as const)("%s", (_name, action, mode) => {
  it(`starts a "${mode}" job and drains it, returning the mutated count`, async () => {
    mockCallStartCustomItemMutationJob.mockResolvedValue({ data: { jobId: "job-1", totalCount: 2 } });
    mockCallProcessCustomItemMutationChunk.mockResolvedValue({
      data: { done: true, processedCount: 2, totalCount: 2, mutatedThisChunk: 1 },
    });

    const result = await action({ campaignId: "camp-1", customItemId: "item-1", actorUserId: "dm-1" });

    expect(mockCallStartCustomItemMutationJob).toHaveBeenCalledWith({
      campaignId: "camp-1",
      customItemId: "item-1",
      mode,
      actorUserId: "dm-1",
    });
    expect(mockCallProcessCustomItemMutationChunk).toHaveBeenCalledWith({ jobId: "job-1" });
    expect(result).toBe(1);
  });

  it("sums mutatedThisChunk across chunks and reports progress", async () => {
    mockCallStartCustomItemMutationJob.mockResolvedValue({ data: { jobId: "job-1", totalCount: 900 } });
    mockCallProcessCustomItemMutationChunk
      .mockResolvedValueOnce({
        data: { done: false, processedCount: 400, totalCount: 900, mutatedThisChunk: 12 },
      })
      .mockResolvedValueOnce({
        data: { done: true, processedCount: 900, totalCount: 900, mutatedThisChunk: 5 },
      });
    const onProgress = vi.fn();

    const result = await action({
      campaignId: "camp-1",
      customItemId: "item-1",
      actorUserId: "dm-1",
      onProgress,
    });

    expect(result).toBe(17);
    expect(onProgress).toHaveBeenNthCalledWith(1, { processedCount: 400, totalCount: 900 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { processedCount: 900, totalCount: 900 });
  });

  it("propagates a rejection when starting the job fails", async () => {
    const error = new Error("Custom item not found.");
    mockCallStartCustomItemMutationJob.mockRejectedValue(error);

    await expect(
      action({ campaignId: "camp-1", customItemId: "item-1", actorUserId: "dm-1" })
    ).rejects.toBe(error);
    expect(mockCallProcessCustomItemMutationChunk).not.toHaveBeenCalled();
  });
});

describe("updateAllCustomItemCopies", () => {
  it('starts an "update" job with the given versionId and drains it', async () => {
    mockCallStartCustomItemMutationJob.mockResolvedValue({ data: { jobId: "job-1", totalCount: 1 } });
    mockCallProcessCustomItemMutationChunk.mockResolvedValue({
      data: { done: true, processedCount: 1, totalCount: 1, mutatedThisChunk: 1 },
    });

    const result = await updateAllCustomItemCopies({
      campaignId: "camp-1",
      customItemId: "item-1",
      versionId: "ver-1",
      actorUserId: "dm-1",
    });

    expect(mockCallStartCustomItemMutationJob).toHaveBeenCalledWith({
      campaignId: "camp-1",
      customItemId: "item-1",
      mode: "update",
      versionId: "ver-1",
      actorUserId: "dm-1",
    });
    expect(result).toBe(1);
  });
});

describe("removeAllCustomItemCopies", () => {
  it('starts a "remove" job and drains it', async () => {
    mockCallStartCustomItemMutationJob.mockResolvedValue({ data: { jobId: "job-1", totalCount: 1 } });
    mockCallProcessCustomItemMutationChunk.mockResolvedValue({
      data: { done: true, processedCount: 1, totalCount: 1, mutatedThisChunk: 1 },
    });

    const result = await removeAllCustomItemCopies({
      campaignId: "camp-1",
      customItemId: "item-1",
      actorUserId: "dm-1",
    });

    expect(mockCallStartCustomItemMutationJob).toHaveBeenCalledWith({
      campaignId: "camp-1",
      customItemId: "item-1",
      mode: "remove",
      actorUserId: "dm-1",
    });
    expect(result).toBe(1);
  });
});
