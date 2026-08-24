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
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("clears ownership and logs the force-release, attributing the previous owner correctly", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: "player-1" }) });

    await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
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

  it("tolerates force-releasing an already-unclaimed character", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: null }) });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).resolves.toBeUndefined();
  });
});
