// functions/tests/operations/reconcileCharacterSpentXp.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
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
const mockUserLinkDoc = vi.fn(() => ({ get: mockUserLinkGet }));
const mockUserLinksCollection = { doc: mockUserLinkDoc };

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

describe("reconcileCharacterSpentXp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects a non-integer spent value before touching Firestore", async () => {
    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 1.5 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("rejects a negative spent value", async () => {
    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: -1 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects a spent value over the maximum", async () => {
    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 10_000_001 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 100 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 100 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("allows the DM to correct a stale spent total", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false, experience: { total: 500, spent: 50 } }),
    });

    const result = await reconcileCharacterSpentXp(
      { campaignId: "c1", characterId: "char-1", spent: 100 },
      "dm-1"
    );

    expect(result).toEqual({ updated: true });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { "experience.spent": 100 });
  });

  it("allows the owning player to correct their own character when editable", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: true, experience: { total: 500, spent: 50 } }),
    });

    const result = await reconcileCharacterSpentXp(
      { campaignId: "c1", characterId: "char-1", spent: 100 },
      "player-1"
    );

    expect(result).toEqual({ updated: true });
  });

  it("rejects a non-editable player", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false, experience: { total: 500, spent: 50 } }),
    });

    await expect(
      reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 100 }, "player-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("does not write when the spent value is already correct", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false, experience: { total: 500, spent: 100 } }),
    });

    const result = await reconcileCharacterSpentXp(
      { campaignId: "c1", characterId: "char-1", spent: 100 },
      "dm-1"
    );

    expect(result).toEqual({ updated: false });
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("never touches experience.total or other fields, only experience.spent", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "player-1",
        isEditableByPlayer: false,
        experience: { total: 500, spent: 50, ranks: [{ rankId: "conscript" }] },
      }),
    });

    await reconcileCharacterSpentXp({ campaignId: "c1", characterId: "char-1", spent: 100 }, "dm-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { "experience.spent": 100 });
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCharacterRef,
      expect.objectContaining({ experience: expect.anything() })
    );
  });
});
