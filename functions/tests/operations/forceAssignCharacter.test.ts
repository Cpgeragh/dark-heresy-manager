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
const mockUserLinkGet = vi.fn();

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "userLinks") return { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
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
    mockUserLinkGet.mockResolvedValue({ exists: false });
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
    setupTransactionGet({
      character: { exists: false },
      campaignMemberIds: ["player-1"],
    });

    await expect(
      forceAssignCharacter({ campaignId: "c1", characterId: "char-1", targetUid: "player-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the target is not an existing campaign member", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ character: { exists: true, userId: null }, campaignMemberIds: [] });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("assigns an unclaimed character to an existing member and logs the force-assign", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: null },
      campaignMemberIds: ["player-1"],
    });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: "player-1",
      isEditableByPlayer: true,
    });
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(mockCampaignRef, expect.anything());
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

  it("rejects assigning a character that already has an owner", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: "old-player" },
      campaignMemberIds: ["old-player", "new-player"],
    });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "new-player" },
        "dm-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });
});
