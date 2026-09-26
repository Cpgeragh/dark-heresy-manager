// functions/tests/operations/releaseCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { releaseCharacter } from "../../src/operations/releaseCharacter";

vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: vi.fn(async (_db: unknown, uid: string) => uid),
}));

const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
    delete: mockTransactionDelete,
  });
});

const mockClaimLogDoc = vi.fn(() => ({}));
const mockRecoveryCodeHistoryDoc = vi.fn(() => ({ kind: "recovery-code-history" }));
const mockCharacterRef = {
  id: "char-1",
  firestore: {} as unknown,
  collection: vi.fn((name: string) => ({
    doc: name === "recoveryCodeHistory" ? mockRecoveryCodeHistoryDoc : mockClaimLogDoc,
  })),
};
const mockMembershipQuery = { __membershipQuery: true };
const mockCharactersCollection = {
  doc: vi.fn(() => mockCharacterRef),
  where: vi.fn(() => mockMembershipQuery),
};
const mockSummaryRef = { kind: "character-summary" };
const mockCampaignRef = {
  id: "c1",
  collection: vi.fn((name: string) =>
    name === "characterSummaries" ? { doc: vi.fn(() => mockSummaryRef) } : mockCharactersCollection
  ),
};
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockRecoveryIndexDoc = vi.fn((id: string) => ({ kind: "recovery-index", id }));
const mockRecoveryIndexCollection = { doc: mockRecoveryIndexDoc };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "recoveryIndex") return mockRecoveryIndexCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

const mockFirestore = {
  collection: mockCollection,
  runTransaction: mockRunTransaction,
};
mockCharacterRef.firestore = mockFirestore;

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mockFirestore,
  FieldValue: {
    arrayUnion: (v: unknown) => ({ __arrayUnion: v }),
    arrayRemove: (v: unknown) => ({ __arrayRemove: v }),
    delete: () => ({ __delete: true }),
    serverTimestamp: () => "server-timestamp",
  },
}));

function setupTransactionGet(
  character: {
    exists: boolean;
    userId?: string | null;
    recoveryCode?: string;
    header?: Record<string, unknown>;
  },
  otherOwnedCharacterIds: string[] = []
) {
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === mockMembershipQuery) {
      return Promise.resolve({ docs: otherOwnedCharacterIds.map((id) => ({ id })) });
    }
    return Promise.resolve({
      exists: character.exists,
      data: () => ({
        userId: character.userId,
        recoveryCode: character.recoveryCode,
        header: character.header,
      }),
    });
  });
}

describe("releaseCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the character does not exist", async () => {
    setupTransactionGet({ exists: false });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller does not own the character", async () => {
    setupTransactionGet({ exists: true, userId: "other-user" });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("clears ownership, removes membership when this was their last character, and logs the release", async () => {
    setupTransactionGet(
      { exists: true, userId: "user-1", recoveryCode: "DH-OLDC-ODE1" },
      []
    );

    await releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1", "secret");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
      recoveryCode: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/),
    });
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" })
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" }),
      { campaignId: "c1", characterId: "char-1" }
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayRemove: "user-1" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: null, playerName: { __delete: true } }),
      { merge: true }
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "release",
        actorUid: "user-1",
        previousOwnerUid: "user-1",
        newOwnerUid: null,
      })
    );
  });

  it("clears ownership but keeps membership when the caller still owns another character here", async () => {
    setupTransactionGet({ exists: true, userId: "user-1" }, ["char-2"]);

    await releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1", "secret");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
      recoveryCode: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/),
    });
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });
});
