import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaign } from "../../src/operations/createCampaign";

const mockResolvePrimaryUid = vi.hoisted(() => vi.fn());
const mockEnforceRateLimit = vi.hoisted(() => vi.fn());

vi.mock("../../src/shared/linkedIdentity", () => ({ resolvePrimaryUid: mockResolvePrimaryUid }));
vi.mock("../../src/shared/rateLimit", () => ({ enforceRateLimit: mockEnforceRateLimit }));

const mockTransactionGet = vi.fn();
const mockTransactionSet = vi.fn();
const mockRunTransaction = vi.fn(async (handler: (transaction: unknown) => Promise<unknown>) =>
  handler({ get: mockTransactionGet, set: mockTransactionSet })
);
const campaignRef = { id: "campaign-new" };
const profileRef = { id: "primary-user" };
const campaignsQuery = { kind: "campaign-count" };
const mockCampaignCollection = {
  doc: vi.fn(() => campaignRef),
  where: vi.fn(() => ({ limit: vi.fn(() => campaignsQuery) })),
};
const mockProfileCollection = { doc: vi.fn(() => profileRef) };
const mockDb = {
  collection: vi.fn((name: string) =>
    name === "campaigns" ? mockCampaignCollection : mockProfileCollection
  ),
  runTransaction: mockRunTransaction,
};

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mockDb,
  FieldValue: { serverTimestamp: () => "server-timestamp" },
}));

describe("createCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePrimaryUid.mockResolvedValue("primary-user");
    mockEnforceRateLimit.mockResolvedValue(undefined);
    mockTransactionGet
      .mockResolvedValueOnce({ data: () => ({ firstName: "Alice" }) })
      .mockResolvedValueOnce({ size: 0 });
  });

  it("creates a campaign for the primary account and enforces its daily limit", async () => {
    const result = await createCampaign(
      { name: "  The Lathe Run  ", inquisitorName: "  Vail  ", operationId: "op-1" },
      "linked-device"
    );

    expect(mockResolvePrimaryUid).toHaveBeenCalledWith(mockDb, "linked-device");
    expect(mockEnforceRateLimit).toHaveBeenCalledWith({
      key: "create-campaign:account:primary-user",
      limit: 10,
      windowMs: 86_400_000,
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(campaignRef, {
      name: "The Lathe Run",
      dmId: "primary-user",
      memberIds: [],
      createdAt: "server-timestamp",
      archivedAt: null,
      gmName: "Alice",
      inquisitorName: "Vail",
    });
    expect(result).toEqual({ campaignId: "campaign-new" });
  });

  it("refuses to create more than the account-wide campaign ceiling", async () => {
    mockTransactionGet.mockReset();
    mockTransactionGet
      .mockResolvedValueOnce({ data: () => ({ firstName: "Alice" }) })
      .mockResolvedValueOnce({ size: 100 });

    await expect(
      createCampaign({ name: "One Too Many", operationId: "op-2" }, "primary-user")
    ).rejects.toThrow("An account can have at most 100 campaigns.");
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it("rejects invalid names before consuming the creation limit", async () => {
    await expect(
      createCampaign({ name: "   ", operationId: "op-3" }, "primary-user")
    ).rejects.toThrow("Campaign name is required.");
    expect(mockEnforceRateLimit).not.toHaveBeenCalled();
  });
});
