import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAtomicDelete, mockBatch, mockGetDoc, mockGetDocs, mockWriteBatch } = vi.hoisted(() => {
  const mockBatch = {
    commit: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };
  return {
    mockAtomicDelete: vi.fn().mockResolvedValue(undefined),
    mockBatch,
    mockGetDoc: vi.fn(),
    mockGetDocs: vi.fn(),
    mockWriteBatch: vi.fn(() => mockBatch),
  };
});

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
  writeBatch: () => mockWriteBatch(),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db" }));
vi.mock("../../src/firebase/converters", () => ({
  charactersCollectionRef: (campaignId: string) => `campaigns/${campaignId}/characters`,
}));
vi.mock("../../src/utils/firestoreBatchDelete", () => ({
  deleteRefsAtomically: (...args: unknown[]) => mockAtomicDelete(...args),
}));

import {
  archiveAndRemoveAllCustomItemCopies,
  permanentlyDeleteCustomItem,
  preflightCustomItemArchive,
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

function characterDocument(index: number, linked = false) {
  return {
    id: `char-${index}`,
    ref: `campaigns/camp-1/characters/char-${index}`,
    data: () => ({
      psychic: { minorPowers: [], majorPowers: [] },
      gear: linked ? [{ id: `gear-${index}`, name: "Auspex", customLibraryId: "item-1" }] : [],
    }),
  };
}

function querySnapshot(documents: ReturnType<typeof characterDocument>[]) {
  return { docs: documents, empty: documents.length === 0 };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDoc.mockResolvedValue(itemSnapshot());
  mockGetDocs.mockResolvedValue(querySnapshot([]));
  mockBatch.commit.mockResolvedValue(undefined);
  mockAtomicDelete.mockResolvedValue(undefined);
});

describe("custom-item campaign-wide preflights", () => {
  it("reports affected character documents and linked copies before archive", async () => {
    mockGetDocs.mockResolvedValue(
      querySnapshot([characterDocument(1, true), characterDocument(2, false)])
    );

    await expect(
      preflightCustomItemArchive({ campaignId: "camp-1", customItemId: "item-1" })
    ).resolves.toMatchObject({
      safe: true,
      affectedDocuments: 2,
      affectedCharacterDocuments: 1,
      affectedCopies: 1,
      scannedCharacters: 2,
    });
  });

  it("archives the definition and removes all copies in one batch", async () => {
    mockGetDocs.mockResolvedValue(querySnapshot([characterDocument(1, true)]));

    await expect(
      archiveAndRemoveAllCustomItemCopies({
        campaignId: "camp-1",
        customItemId: "item-1",
        actorUserId: "dm-1",
      })
    ).resolves.toBe(1);

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.update).toHaveBeenCalledWith(
      "campaigns/camp-1/customItems/item-1",
      expect.objectContaining({ status: "archived" })
    );
    expect(mockBatch.update).toHaveBeenCalledWith(
      "campaigns/camp-1/characters/char-1",
      expect.objectContaining({ gear: [] })
    );
    expect(mockBatch.commit).toHaveBeenCalledOnce();
  });

  it("stops before creating a batch when a campaign exceeds 100 characters", async () => {
    mockGetDocs
      .mockResolvedValueOnce(
        querySnapshot(Array.from({ length: 100 }, (_, index) => characterDocument(index)))
      )
      .mockResolvedValueOnce(querySnapshot([characterDocument(100)]));

    await expect(
      archiveAndRemoveAllCustomItemCopies({
        campaignId: "camp-1",
        customItemId: "item-1",
        actorUserId: "dm-1",
      })
    ).rejects.toThrow("more than 100 characters");
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

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
