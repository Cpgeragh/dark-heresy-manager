// functions/tests/operations/forceReleaseCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceReleaseCharacter } from "../../src/operations/forceReleaseCharacter";

const mockCampaignGet = vi.fn();
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
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
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

describe("forceReleaseCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: false });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("clears ownership, removes membership when this was their last character, and logs the force-release", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: "player-1" }, []);

    await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
    });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayRemove: "player-1" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "force-release",
        actorUid: "dm-1",
        previousOwnerUid: "player-1",
        newOwnerUid: null,
      })
    );
  });

  it("clears ownership but keeps membership when the target still owns another character here", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: "player-1" }, ["char-2"]);

    await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1");

    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });

  it("tolerates force-releasing an already-unclaimed character", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: null }, []);

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).resolves.toBeUndefined();
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });
});
