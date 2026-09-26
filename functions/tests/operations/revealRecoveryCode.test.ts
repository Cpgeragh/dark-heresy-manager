// functions/tests/operations/revealRecoveryCode.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { revealRecoveryCode } from "../../src/operations/revealRecoveryCode";

const mockCampaignGet = vi.fn();
const mockCharacterGet = vi.fn();
const mockUserLinkGet = vi.fn();

const mockCharacterRef = { get: mockCharacterGet };
const mockCharactersCollection = { doc: vi.fn(() => mockCharacterRef) };
const mockCampaignRef = { get: mockCampaignGet, collection: vi.fn(() => mockCharactersCollection) };
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "userLinks") return { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection }),
}));

describe("revealRecoveryCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });
    mockCharacterGet.mockResolvedValue({ exists: true, data: () => ({}) });

    await expect(
      revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({ exists: false });

    await expect(
      revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("returns the code to the campaign's DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", recoveryCode: "DH-AAAA-BBBB" }),
    });

    const result = await revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1");

    expect(result).toEqual({ code: "DH-AAAA-BBBB" });
  });

  it("returns the code to the character's owning player", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", recoveryCode: "DH-AAAA-BBBB" }),
    });

    const result = await revealRecoveryCode(
      { campaignId: "c1", characterId: "char-1" },
      "player-1"
    );

    expect(result).toEqual({ code: "DH-AAAA-BBBB" });
  });

  it("rejects a caller who is neither the DM nor the owning player", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", recoveryCode: "DH-AAAA-BBBB" }),
    });

    await expect(
      revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "someone-else")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects a non-owning caller when the character is unclaimed", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: null, recoveryCode: "DH-AAAA-BBBB" }),
    });

    await expect(
      revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "someone-else")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("allows a device linked to the DM's account", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", recoveryCode: "DH-AAAA-BBBB" }),
    });
    mockUserLinkGet.mockResolvedValue({ exists: true, data: () => ({ primaryUid: "dm-1" }) });

    const result = await revealRecoveryCode(
      { campaignId: "c1", characterId: "char-1" },
      "dm-linked-device"
    );

    expect(result).toEqual({ code: "DH-AAAA-BBBB" });
  });

  it("throws internal when the character has no valid stored code", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    mockCharacterGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "player-1", recoveryCode: "" }),
    });

    await expect(
      revealRecoveryCode({ campaignId: "c1", characterId: "char-1" }, "dm-1")
    ).rejects.toThrow(expect.objectContaining({ code: "internal" }));
  });
});
