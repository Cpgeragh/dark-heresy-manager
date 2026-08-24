// functions/tests/operations/lookupRecoveryCode.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupRecoveryCode } from "../../src/operations/lookupRecoveryCode";
import { hashRecoveryCode } from "../../src/shared/recoveryCode";

const mockIndexGet = vi.fn();
const mockCampaignGet = vi.fn();
const mockCharacterGet = vi.fn();

const mockIndexDoc = vi.fn(() => ({ get: mockIndexGet }));
const mockIndexCollection = { doc: mockIndexDoc };
const mockCharacterRef = { get: mockCharacterGet };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };

const mockCollection = vi.fn((name: string) => {
  if (name === "recoveryIndex") return mockIndexCollection;
  if (name === "campaigns") return mockCampaignsCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
}));

const SECRET = "secret";
const CODE = "DH-ABCD-1234";

describe("lookupRecoveryCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not-found without touching Firestore for a malformed code", async () => {
    const result = await lookupRecoveryCode("not-a-code", "user-1", SECRET);

    expect(result).toEqual({ status: "not-found" });
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it("returns not-found when no index entry exists", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toEqual({ status: "not-found" });
  });

  it("returns missing-data when the campaign no longer exists", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: false });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toEqual({ status: "missing-data" });
  });

  it("returns missing-data when the character no longer exists", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ name: "Test Campaign" }) });
    mockCharacterGet.mockResolvedValue({ exists: false });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toEqual({ status: "missing-data" });
  });

  it("returns an unclaimed preview with only the minimal fields", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ name: "Test Campaign" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ header: { characterName: "Test Character" } }),
    });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toEqual({
      status: "found",
      preview: {
        campaignId: "c1",
        characterId: "char-1",
        characterName: "Test Character",
        campaignName: "Test Campaign",
        ownership: "unclaimed",
      },
    });
  });

  it("returns claimed-by-you when the caller owns the character", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ name: "Test Campaign" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "user-1", header: {} }),
    });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toMatchObject({ status: "found", preview: { ownership: "claimed-by-you" } });
  });

  it("returns claimed-by-other when owned by someone else and still editable", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ name: "Test Campaign" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "other-user", isEditableByPlayer: true, header: {} }),
    });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toMatchObject({ status: "found", preview: { ownership: "claimed-by-other" } });
  });

  it("returns locked when owned by someone else and not editable", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ name: "Test Campaign" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "other-user", isEditableByPlayer: false, header: {} }),
    });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toMatchObject({ status: "found", preview: { ownership: "locked" } });
  });

  it("falls back to placeholder names when the character or campaign has none set", async () => {
    mockIndexGet.mockResolvedValue({
      exists: true,
      data: () => ({ campaignId: "c1", characterId: "char-1" }),
    });
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({}) });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });

    const result = await lookupRecoveryCode(CODE, "user-1", SECRET);

    expect(result).toMatchObject({
      status: "found",
      preview: { characterName: "Unnamed Character", campaignName: "Unnamed Campaign" },
    });
  });

  it("looks up the index entry by the code's HMAC hash, not the raw code", async () => {
    mockIndexGet.mockResolvedValue({ exists: false });

    await lookupRecoveryCode(CODE, "user-1", SECRET);

    const expectedHash = hashRecoveryCode(CODE, SECRET);
    expect(mockIndexDoc).toHaveBeenCalledWith(expectedHash);
    expect(mockIndexDoc).not.toHaveBeenCalledWith(CODE);
  });
});
