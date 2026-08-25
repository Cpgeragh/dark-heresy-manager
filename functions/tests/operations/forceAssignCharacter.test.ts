// functions/tests/operations/forceAssignCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceAssignCharacter } from "../../src/operations/forceAssignCharacter";

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

function setupTransactionGet(options: {
  character: { exists: boolean; userId?: string | null };
  otherOwnedCharacterIds?: string[];
  campaignMemberIds?: string[];
}) {
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === mockMembershipQuery) {
      return Promise.resolve({ docs: (options.otherOwnedCharacterIds ?? []).map((id) => ({ id })) });
    }
    if (ref === mockCampaignRef) {
      return Promise.resolve({ data: () => ({ memberIds: options.campaignMemberIds ?? [] }) });
    }
    return Promise.resolve({
      exists: options.character.exists,
      data: () => ({ userId: options.character.userId }),
    });
  });
}

describe("forceAssignCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      forceAssignCharacter({ campaignId: "c1", characterId: "char-1", targetUid: "player-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      forceAssignCharacter({ campaignId: "c1", characterId: "char-1", targetUid: "player-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ character: { exists: false } });

    await expect(
      forceAssignCharacter({ campaignId: "c1", characterId: "char-1", targetUid: "player-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("assigns an unclaimed character to the target, adds them to membership, and logs the force-assign", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ character: { exists: true, userId: null } });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayUnion: "player-1" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "force-assign",
        actorUid: "dm-1",
        previousOwnerUid: null,
        newOwnerUid: "player-1",
      })
    );
  });

  it("reassigns from an existing owner who still owns another character, adds the target, and leaves the old owner's membership alone", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: "old-player" },
      otherOwnedCharacterIds: ["char-2"],
    });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "new-player" },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayUnion: "new-player" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ previousOwnerUid: "old-player", newOwnerUid: "new-player" })
    );
  });

  it("reassigns the old owner's last character, removing them and adding the new owner in one combined write", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: "old-player" },
      otherOwnedCharacterIds: [],
      campaignMemberIds: ["old-player", "someone-else"],
    });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "new-player" },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: ["someone-else", "new-player"],
    });
  });
});
