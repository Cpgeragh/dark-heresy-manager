// functions/tests/operations/revokeRecoveryCode.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { revokeRecoveryCode } from "../../src/operations/revokeRecoveryCode";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    delete: mockTransactionDelete,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
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

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "recoveryIndex") return mockIndexCollection;
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

const SECRET = "secret";
const CODE = "DH-ABCD-1234";

describe("revokeRecoveryCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(
      revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET)
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("deletes the current index entry, logs a history entry, and blanks the character's code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ recoveryCode: CODE }) });

    await revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET);

    const expectedHash = hashRecoveryCode(CODE, SECRET);
    expect(mockIndexDoc).toHaveBeenCalledWith(expectedHash);
    expect(mockTransactionDelete).toHaveBeenCalledOnce();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { recoveryCode: "" });
    expect(mockHistoryCollection).toHaveBeenCalledWith("recoveryCodeHistory");
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "revoked" })
    );
  });

  it("succeeds without touching the index or logging history when the character already has no usable code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ recoveryCode: "" }) });

    await revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET);

    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { recoveryCode: "" });
    expect(mockHistoryCollection).not.toHaveBeenCalled();
  });

  it("succeeds without touching the index or logging history when the character has never had a code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET);

    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { recoveryCode: "" });
    expect(mockHistoryCollection).not.toHaveBeenCalled();
  });

  it("reads the character fresh inside the transaction, not from a pre-read", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ recoveryCode: CODE }) });

    await revokeRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1", SECRET);

    expect(mockTransactionGet).toHaveBeenCalledWith(mockCharacterRef);
  });
});
