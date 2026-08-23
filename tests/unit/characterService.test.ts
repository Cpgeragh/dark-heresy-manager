import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockBatch,
  mockBatchDeleteRefs,
  mockDoc,
  mockGetDocs,
  mockRunTransaction,
  mockTransaction,
} = vi.hoisted(() => {
  const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };
  const mockBatch = {
    commit: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };

  return {
    mockAuth: { currentUser: { uid: "actor-1" } } as {
      currentUser: { uid: string } | null;
    },
    mockBatch,
    mockBatchDeleteRefs: vi.fn().mockResolvedValue(undefined),
    // Single-arg calls are the auto-ID form used by doc(collectionRef); keep
    // returning the old constant there. Multi-arg calls (doc(db, "a", "b"))
    // are the explicit-path form deleteCharacter uses — join into a path so
    // different refs are distinguishable in assertions.
    mockDoc: vi.fn((...args: unknown[]) =>
      args.length <= 1 ? "claim-log-ref" : args.slice(1).join("/")
    ),
    mockGetDocs: vi.fn(),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
  };
});

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  arrayUnion: (value: string) => `array-union:${value}`,
  collection: (...args: unknown[]) => args.slice(1).join("/"),
  documentId: () => "__name__",
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: vi.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  runTransaction: mockRunTransaction,
  serverTimestamp: () => "server-timestamp",
  setDoc: vi.fn(),
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
  updateDoc: vi.fn(),
  writeBatch: () => mockBatch,
}));

vi.mock("../../src/firebase", () => ({
  auth: mockAuth,
  db: "mock-db",
}));

vi.mock("../../src/firebase/converters", () => ({
  campaignDocRef: (campaignId: string) => `campaign:${campaignId}`,
  characterDocRef: (campaignId: string, characterId: string) =>
    `character:${campaignId}:${characterId}`,
  charactersCollectionRef: vi.fn(),
}));

vi.mock("../../src/utils/firestoreBatchDelete", () => ({
  batchDeleteRefs: (...args: unknown[]) => mockBatchDeleteRefs(...args),
}));

import {
  claimCharacter,
  deleteCharacter,
  releaseCharacter,
} from "../../src/services/characterService";

function snapshot(docs: { id: string; ref: string }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, ref: d.ref, data: () => ({}) })),
    empty: docs.length === 0,
  };
}

const emptySnapshot = snapshot([]);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.currentUser = { uid: "actor-1" };
  mockBatch.commit.mockResolvedValue(undefined);
  mockBatchDeleteRefs.mockResolvedValue(undefined);
  mockTransaction.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ userId: null }),
  });
});

describe("character claiming operations", () => {
  it("claims the character, joins the campaign and records the action atomically", async () => {
    await claimCharacter("camp-1", "char-1", "owner-1");

    expect(mockRunTransaction).toHaveBeenCalledWith("mock-db", expect.any(Function));
    expect(mockTransaction.get).toHaveBeenCalledWith("character:camp-1:char-1");
    expect(mockTransaction.update).toHaveBeenNthCalledWith(1, "character:camp-1:char-1", {
      userId: "owner-1",
    });
    expect(mockTransaction.update).toHaveBeenNthCalledWith(2, "campaign:camp-1", {
      memberIds: "array-union:owner-1",
    });
    expect(mockTransaction.set).toHaveBeenCalledWith("claim-log-ref", {
      action: "claim",
      actorUid: "actor-1",
      previousOwnerUid: null,
      newOwnerUid: "owner-1",
      timestamp: "server-timestamp",
    });
  });

  it("does not write when the character is already claimed", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ userId: "existing-owner" }),
    });

    await expect(claimCharacter("camp-1", "char-1", "owner-1")).rejects.toThrow(
      "Character is already claimed."
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.set).not.toHaveBeenCalled();
  });

  it("does not start a transaction when no user is signed in", async () => {
    mockAuth.currentUser = null;

    await expect(claimCharacter("camp-1", "char-1", "owner-1")).rejects.toThrow("Not signed in.");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("releases the character and records the action in one batch", async () => {
    await releaseCharacter("camp-1", "char-1", "owner-1");

    expect(mockBatch.update).toHaveBeenCalledWith("character:camp-1:char-1", {
      userId: null,
      isEditableByPlayer: false,
    });
    expect(mockBatch.set).toHaveBeenCalledWith("claim-log-ref", {
      action: "release",
      actorUid: "actor-1",
      previousOwnerUid: "owner-1",
      newOwnerUid: null,
      timestamp: "server-timestamp",
    });
    expect(mockBatch.commit).toHaveBeenCalledOnce();
  });
});

describe("deleteCharacter", () => {
  it("deletes messages in pages and atomically removes audit children, recovery entry, thread, and character", async () => {
    mockGetDocs.mockImplementation(async (path: string) => {
      switch (path) {
        case "campaigns/camp-1/characters/char-1/claimLog":
          return snapshot([
            { id: "log-1", ref: "campaigns/camp-1/characters/char-1/claimLog/log-1" },
          ]);
        case "campaigns/camp-1/characters/char-1/xpProposals":
          return snapshot([
            { id: "prop-1", ref: "campaigns/camp-1/characters/char-1/xpProposals/prop-1" },
          ]);
        case "campaigns/camp-1/threads/char-1/messages":
          return snapshot([{ id: "msg-1", ref: "campaigns/camp-1/threads/char-1/messages/msg-1" }]);
        default:
          return emptySnapshot;
      }
    });

    await deleteCharacter("camp-1", "char-1", "DH-AAAA-1111");

    expect(mockBatchDeleteRefs).toHaveBeenCalledOnce();
    const [dbArg, refs] = mockBatchDeleteRefs.mock.calls[0];
    expect(dbArg).toBe("mock-db");
    expect(refs).toEqual(
      expect.arrayContaining([
        "campaigns/camp-1/characters/char-1/claimLog/log-1",
        "campaigns/camp-1/characters/char-1/xpProposals/prop-1",
        "campaigns/camp-1/threads/char-1",
        "recoveryIndex/DH-AAAA-1111",
        "character:camp-1:char-1",
      ])
    );
    expect(refs).toHaveLength(5);
    expect(mockBatch.delete).toHaveBeenCalledWith("campaigns/camp-1/threads/char-1/messages/msg-1");
  });

  it("pushes the thread ref even when the character never had any messages", async () => {
    mockGetDocs.mockResolvedValue(emptySnapshot);

    await deleteCharacter("camp-2", "char-2", "DH-BBBB-2222");

    const [, refs] = mockBatchDeleteRefs.mock.calls[0];
    expect(refs).toEqual(
      expect.arrayContaining(["campaigns/camp-2/threads/char-2", "character:camp-2:char-2"])
    );
  });

  it("propagates failures from the batch delete", async () => {
    mockGetDocs.mockResolvedValue(emptySnapshot);
    const error = new Error("delete failed");
    mockBatchDeleteRefs.mockRejectedValueOnce(error);

    await expect(deleteCharacter("camp-3", "char-3", "DH-CCCC-3333")).rejects.toBe(error);
  });
});
