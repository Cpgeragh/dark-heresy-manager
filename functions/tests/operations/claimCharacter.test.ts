// functions/tests/operations/claimCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { claimCharacter } from "../../src/operations/claimCharacter";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) => {
  return callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
    delete: mockTransactionDelete,
  });
});

const mockClaimLogDoc = vi.fn(() => ({ kind: "claim-log" }));
const mockHistoryDoc = vi.fn(() => ({ kind: "recovery-history" }));
const mockCharacterCollection = vi.fn((name: string) => {
  if (name === "claimLog") return { doc: mockClaimLogDoc };
  if (name === "recoveryCodeHistory") return { doc: mockHistoryDoc };
  throw new Error(`Unexpected character subcollection: ${name}`);
});
const mockCharacterRef = { kind: "character", collection: mockCharacterCollection };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { kind: "campaign", collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockIndexDoc = vi.fn((id: string) => ({ kind: "recovery-index", id }));
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
    mockTransactionGet.mockResolvedValueOnce({ exists: false });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the campaign or character no longer exists", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: false });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({}) });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects when the character no longer exists inside the transaction", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValueOnce({ exists: false });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the character is already claimed, checked fresh inside the transaction", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ userId: "someone-else", recoveryCode: CODE }),
    });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("claims an unclaimed character: sets ownership, adds membership, and logs the claim", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ userId: null, recoveryCode: CODE }),
    });

    const result = await claimCharacter({ code: CODE }, "user-1", SECRET);

    expect(result).toEqual({ campaignId: "c1", characterId: "char-1" });
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: "user-1",
      recoveryCode: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/),
    });
    const characterUpdate = mockTransactionUpdate.mock.calls.find(
      ([reference]) => reference === mockCharacterRef
    )?.[1] as { recoveryCode: string };
    expect(characterUpdate.recoveryCode).not.toBe(CODE);
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: hashRecoveryCode(CODE, SECRET) })
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" }),
      { campaignId: "c1", characterId: "char-1" }
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-history" }),
      expect.objectContaining({ status: "rotated" })
    );
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

  it("allows the campaign DM to claim their own unclaimed character", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ userId: null, recoveryCode: CODE }),
    });

    await expect(claimCharacter({ code: CODE }, "dm-1", SECRET)).resolves.toEqual({
      campaignId: "c1",
      characterId: "char-1",
    });

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      mockCharacterRef,
      expect.objectContaining({ userId: "dm-1" })
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayUnion: "dm-1" },
    });
  });

  it("resolves the target by the code's HMAC hash, not the raw code", async () => {
    mockTransactionGet.mockResolvedValueOnce({ exists: false });

    await claimCharacter({ code: CODE }, "user-1", SECRET).catch(() => {});

    const expectedHash = hashRecoveryCode(CODE, SECRET);
    expect(mockIndexDoc).toHaveBeenCalledWith(expectedHash);
  });

  it("rejects a stale lookup entry when the character stores a different code", async () => {
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockTransactionGet.mockResolvedValueOnce({ exists: true, data: () => ({}) });
    mockTransactionGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ userId: null, recoveryCode: "DH-NEWC-ODE1" }),
    });

    await expect(claimCharacter({ code: CODE }, "user-1", SECRET)).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });
});
