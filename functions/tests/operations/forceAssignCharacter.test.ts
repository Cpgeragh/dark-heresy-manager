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
const mockCharacterRef = { collection: vi.fn(() => ({ doc: mockClaimLogDoc })) };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
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
    serverTimestamp: () => "server-timestamp",
  },
}));

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
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      forceAssignCharacter({ campaignId: "c1", characterId: "char-1", targetUid: "player-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("assigns the character to the target, adds them to membership, and logs the force-assign", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: null }) });

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

  it("overrides an existing owner when reassigning, since force-assign is deliberately permissive", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: "old-player" }) });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "new-player" },
      "dm-1"
    );

    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ previousOwnerUid: "old-player", newOwnerUid: "new-player" })
    );
  });
});
