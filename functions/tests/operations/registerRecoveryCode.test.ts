// functions/tests/operations/registerRecoveryCode.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRecoveryCode } from "../../src/operations/registerRecoveryCode";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    delete: mockTransactionDelete,
    set: mockTransactionSet,
    update: mockTransactionUpdate,
  });
});

const mockHistoryDoc = vi.fn(() => ({}));
const mockHistoryCollection = vi.fn(() => ({ doc: mockHistoryDoc }));
const mockCharacterRef = { collection: mockHistoryCollection };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockIndexDoc = vi.fn(() => ({}));
const mockIndexCollection = { doc: mockIndexDoc };
const mockUserLinkGet = vi.fn();
const mockUserLinkDoc = vi.fn(() => ({ get: mockUserLinkGet }));
const mockUserLinksCollection = { doc: mockUserLinkDoc };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "recoveryIndex") return mockIndexCollection;
  if (name === "userLinks") return mockUserLinksCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
  FieldValue: {
    serverTimestamp: () => "server-timestamp",
  },
}));

describe("registerRecoveryCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("allows a device linked to the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockUserLinkGet.mockResolvedValue({
      exists: true,
      data: () => ({ primaryUid: "dm-1" }),
    });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await expect(
      registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "linked-device", "secret")
    ).resolves.toEqual({ code: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/) });
    expect(mockUserLinkDoc).toHaveBeenCalledWith("linked-device");
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("generates a new code, stores its index entry, and updates the character when there was no previous code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({}) });

    const result = await registerRecoveryCode(
      { campaignId: "c1", characterId: "char-1" },
      "dm-1",
      "secret"
    );

    expect(result.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockTransactionSet).toHaveBeenCalledWith(expect.anything(), {
      campaignId: "c1",
      characterId: "char-1",
    });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { recoveryCode: result.code });
    expect(mockHistoryCollection).not.toHaveBeenCalled();
  });

  it("deletes the previous index entry and logs a history entry when rotating an existing code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ recoveryCode: "DH-OLDC-ODE1" }),
    });

    await registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

    expect(mockTransactionDelete).toHaveBeenCalledOnce();
    expect(mockIndexDoc).toHaveBeenCalled();
    expect(mockHistoryCollection).toHaveBeenCalledWith("recoveryCodeHistory");
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "rotated" })
    );
  });

  it("reads the character fresh inside the transaction, not from a pre-read, so a racing update is picked up", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await registerRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

    expect(mockTransactionGet).toHaveBeenCalledWith(mockCharacterRef);
  });
});
