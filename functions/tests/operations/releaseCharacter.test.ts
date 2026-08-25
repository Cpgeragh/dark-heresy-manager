// functions/tests/operations/releaseCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { releaseCharacter } from "../../src/operations/releaseCharacter";

const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
  });
});

const mockClaimLogDoc = vi.fn(() => ({}));
const mockCharacterRef = { id: "char-1", collection: vi.fn(() => ({ doc: mockClaimLogDoc })) };
const mockMembershipQuery = { __membershipQuery: true };
const mockCharactersCollection = {
  doc: vi.fn(() => mockCharacterRef),
  where: vi.fn(() => mockMembershipQuery),
};
const mockCampaignRef = { collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
  FieldValue: {
    arrayUnion: (v: unknown) => ({ __arrayUnion: v }),
    arrayRemove: (v: unknown) => ({ __arrayRemove: v }),
    serverTimestamp: () => "server-timestamp",
  },
}));

function setupTransactionGet(
  character: { exists: boolean; userId?: string | null },
  otherOwnedCharacterIds: string[] = []
) {
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === mockMembershipQuery) {
      return Promise.resolve({ docs: otherOwnedCharacterIds.map((id) => ({ id })) });
    }
    return Promise.resolve({ exists: character.exists, data: () => ({ userId: character.userId }) });
  });
}

describe("releaseCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the character does not exist", async () => {
    setupTransactionGet({ exists: false });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller does not own the character", async () => {
    setupTransactionGet({ exists: true, userId: "other-user" });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("clears ownership, removes membership when this was their last character, and logs the release", async () => {
    setupTransactionGet({ exists: true, userId: "user-1" }, []);

    await releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
    });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayRemove: "user-1" },
    });
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

    await releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
    });
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });
});
