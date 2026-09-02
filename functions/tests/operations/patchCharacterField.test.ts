// functions/tests/operations/patchCharacterField.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { patchCharacterField } from "../../src/operations/patchCharacterField";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({ get: mockTransactionGet, update: mockTransactionUpdate });
});

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

describe("patchCharacterField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects a field with no registered validator before touching Firestore", async () => {
    await expect(
      patchCharacterField({ campaignId: "c1", characterId: "char-1", field: "experience", value: {} }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      patchCharacterField({ campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      patchCharacterField({ campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("allows the DM to patch notes", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    await patchCharacterField({ campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" }, "dm-1");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { notes: "hi" });
  });

  it("allows the DM to patch the header", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "header", value: { characterName: "Brother Corvus" } },
      "dm-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      header: { characterName: "Brother Corvus" },
    });
  });

  it("allows the owning player to patch notes when the character is editable", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: true }),
    });

    await patchCharacterField(
      { campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" },
      "player-1"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { notes: "hi" });
  });

  it("rejects the owning player when the character is not editable", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: false }),
    });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" },
        "player-1"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects an unrelated caller", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", isEditableByPlayer: true }),
    });

    await expect(
      patchCharacterField(
        { campaignId: "c1", characterId: "char-1", field: "notes", value: "hi" },
        "someone-else"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects an invalid value for a registered field before touching Firestore", async () => {
    await expect(
      patchCharacterField({ campaignId: "c1", characterId: "char-1", field: "notes", value: 42 }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
    expect(mockCampaignGet).not.toHaveBeenCalled();
    expect(mockTransactionGet).not.toHaveBeenCalled();
  });
});
