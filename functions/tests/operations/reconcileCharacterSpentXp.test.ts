import { beforeEach, describe, expect, it, vi } from "vitest";
import { reconcileCharacterSpentXp } from "../../src/operations/reconcileCharacterSpentXp";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
  callback({ get: mockTransactionGet, update: mockTransactionUpdate })
);

const mockCharacterRef = {};
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockUserLinkGet = vi.fn();
const mockUserLinksCollection = { doc: vi.fn(() => ({ get: mockUserLinkGet })) };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "userLinks") return mockUserLinksCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

function storedCharacter(purchaseXp: number, storedSpentXp: number, totalXp = 500) {
  return {
    userId: "player-1",
    isEditableByPlayer: false,
    experience: {
      total: totalXp,
      spent: storedSpentXp,
      ranks: [
        {
          rank: 1,
          advances: [{ id: "advance-1", name: "Advances", cost: purchaseXp }],
        },
      ],
    },
  };
}

describe("reconcileCharacterSpentXp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("calculates and corrects stale Spent XP for the DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => storedCharacter(100, 50),
    });

    const result = await reconcileCharacterSpentXp(
      { campaignId: "c1", characterId: "char-1" },
      "dm-1"
    );

    expect(result).toEqual({ updated: true });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      "experience.spent": 100,
    });
  });

  it("allows the editable owning player to request recalculation", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ ...storedCharacter(100, 50), isEditableByPlayer: true }),
    });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1" }, "player-1")
    ).resolves.toEqual({ updated: true });
  });

  it("rejects a non-editable player", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => storedCharacter(100, 50),
    });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1" }, "player-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("does not write when the calculated value is already stored", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => storedCharacter(100, 100),
    });

    const result = await reconcileCharacterSpentXp(
      { campaignId: "c1", characterId: "char-1" },
      "dm-1"
    );

    expect(result).toEqual({ updated: false });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects reconciliation when recorded purchases exceed Total XP", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => storedCharacter(600, 50, 500),
    });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });
});
