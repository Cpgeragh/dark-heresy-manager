// functions/tests/operations/claimCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { claimCharacter } from "../../src/operations/claimCharacter";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const mockIndexGet = vi.fn();
const mockCampaignGet = vi.fn();
const mockCharacterGet = vi.fn();
const mockClaimLogDoc = vi.fn(() => ({}));
const mockClaimLogCollection = vi.fn(() => ({ doc: mockClaimLogDoc }));

const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
    delete: mockTransactionDelete,
  });
});

const mockCharacterRef = { get: mockCharacterGet, collection: mockClaimLogCollection };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockIndexDoc = vi.fn(() => ({ get: mockIndexGet }));
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
    arrayUnion: (v: unknown) => ({ __arrayUnion: v }),
    serverTimestamp: () => "server-timestamp",
  },
}));

const SECRET = "secret";
const CODE = "DH-ABCD-1234";

describe("claimCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a malformed code without touching Firestore", async () => {
    await expect(claimCharacter({ code: "not-a-code" }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("rejects when no index entry exists for the code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the campaign or character no longer exists", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: false });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the character was deleted between the pre-read and the transaction", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValue({ exists: false });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the character is already claimed, checked fresh inside the transaction", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: "someone-else" }) });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("claims an unclaimed character: sets ownership, adds membership, and logs the claim", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ userId: null }) });

    const result = await claimCharacter({ code: CODE }, "user-1", SECRET);

    expect(result).toEqual({ campaignId: "c1", characterId: "char-1" });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, { userId: "user-1" });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayUnion: "user-1" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "claim",
        actorUid: "user-1",
        previousOwnerUid: null,
        newOwnerUid: "user-1",
      })
    );
  });

  it("resolves the target by the code's HMAC hash, not the raw code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await claimCharacter({ code: CODE }, "user-1", SECRET).catch(() => {});

    const expectedHash = hashRecoveryCode(CODE, SECRET);
    expect(mockIndexDoc).toHaveBeenCalledWith(expectedHash);
  });
});
