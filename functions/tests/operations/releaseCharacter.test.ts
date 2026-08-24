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
const mockCharacterRef = { collection: vi.fn(() => ({ doc: mockClaimLogDoc })) };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
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
    serverTimestamp: () => "server-timestamp",
  },
}));

describe("releaseCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the character does not exist", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller does not own the character", async () => {
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: "other-user" }) });

    await expect(
      releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("clears ownership and logs the release when the caller owns the character", async () => {
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: "user-1" }) });

    await releaseCharacter({ campaignId: "c1", characterId: "char-1" }, "user-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
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
});
