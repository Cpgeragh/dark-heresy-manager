import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockBatch, mockDoc, mockRunTransaction, mockTransaction } = vi.hoisted(() => {
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
    mockDoc: vi.fn(() => "claim-log-ref"),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
  };
});

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  arrayUnion: (value: string) => `array-union:${value}`,
  collection: vi.fn(() => "claim-logs-ref"),
  doc: mockDoc,
  getDoc: vi.fn(),
  runTransaction: mockRunTransaction,
  serverTimestamp: () => "server-timestamp",
  setDoc: vi.fn(),
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

import { claimCharacter, releaseCharacter } from "../../src/services/characterService";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.currentUser = { uid: "actor-1" };
  mockBatch.commit.mockResolvedValue(undefined);
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
