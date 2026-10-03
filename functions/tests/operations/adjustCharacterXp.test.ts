import { beforeEach, describe, expect, it, vi } from "vitest";
import { adjustCharacterXp } from "../../src/operations/adjustCharacterXp";

const {
  campaignGet,
  profileGet,
  transactionGet,
  transactionSet,
  transactionUpdate,
  runTransaction,
  callerIsPrimaryOrLinked,
} = vi.hoisted(() => ({
  campaignGet: vi.fn(),
  profileGet: vi.fn(),
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  transactionUpdate: vi.fn(),
  runTransaction: vi.fn(async (handler: (transaction: unknown) => Promise<void>) =>
    handler({ get: transactionGet, set: transactionSet, update: transactionUpdate })
  ),
  callerIsPrimaryOrLinked: vi.fn(),
}));

function ref(kind: string, id?: string): Record<string, unknown> {
  const value: Record<string, unknown> = { kind, id };
  value.collection = vi.fn((name: string) => ({
    doc: vi.fn((documentId?: string) => ref(name, documentId ?? "generated-history")),
  }));
  return value;
}

const characterRef = ref("character", "character-1");
const campaignRef = {
  get: campaignGet,
  collection: vi.fn(() => ({ doc: vi.fn(() => characterRef) })),
};

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "server-timestamp" },
  getFirestore: () => ({
    collection: vi.fn((name: string) => {
      if (name === "campaigns") return { doc: vi.fn(() => campaignRef) };
      if (name === "userProfiles") return { doc: vi.fn(() => ({ get: profileGet })) };
      throw new Error(`Unexpected collection: ${name}`);
    }),
    runTransaction,
  }),
}));

vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: vi.fn(async (_db: unknown, uid: string) => uid),
  callerIsPrimaryOrLinked,
}));

const input = {
  campaignId: "campaign-1",
  characterId: "character-1",
  amountXp: 200,
  reason: "Completed an investigation",
};

describe("adjustCharacterXp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    profileGet.mockResolvedValue({ exists: true, data: () => ({ firstName: "Morgan" }) });
    callerIsPrimaryOrLinked.mockResolvedValue(true);
    transactionGet.mockImplementation(async (target: { kind: string }) =>
      target.kind === "character"
        ? {
            exists: true,
            data: () => ({
              userId: "player-1",
              isEditableByPlayer: true,
              experience: { total: 1_000, spent: 400, ranks: [] },
            }),
          }
        : { exists: false, data: () => undefined }
    );
  });

  it("records the opening balance and adjustment with the resulting Total XP", async () => {
    await adjustCharacterXp(input, "dm-1");

    expect(transactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "xpHistory", id: "opening-balance" }),
      expect.objectContaining({
        amountXp: 1_000,
        balanceXp: 1_000,
        source: "opening-balance",
        actorName: "Morgan",
      })
    );
    expect(transactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "xpHistory", id: "generated-history" }),
      expect.objectContaining({
        amountXp: 200,
        balanceXp: 1_200,
        reason: "Completed an investigation",
        source: "manual-adjustment",
      })
    );
    expect(transactionUpdate).toHaveBeenCalledWith(characterRef, {
      experience: { total: 1_200, spent: 400, ranks: [] },
    });
  });

  it("does not recreate an existing opening balance", async () => {
    transactionGet.mockImplementation(async (target: { kind: string }) =>
      target.kind === "character"
        ? {
            exists: true,
            data: () => ({
              userId: "player-1",
              isEditableByPlayer: true,
              experience: { total: 1_000, spent: 400, ranks: [] },
            }),
          }
        : { exists: true, data: () => ({}) }
    );

    await adjustCharacterXp(input, "dm-1");

    expect(transactionSet).toHaveBeenCalledOnce();
  });

  it("rejects a reduction below Spent XP without writing", async () => {
    await expect(adjustCharacterXp({ ...input, amountXp: -700 }, "dm-1")).rejects.toThrow(
      "cannot reduce Total XP below Spent XP"
    );
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("rejects zero XP and a blank reason before reading Firestore", async () => {
    await expect(adjustCharacterXp({ ...input, amountXp: 0 }, "dm-1")).rejects.toThrow(
      "non-zero whole number"
    );
    await expect(adjustCharacterXp({ ...input, reason: " " }, "dm-1")).rejects.toThrow(
      "reason is required"
    );
    expect(campaignGet).not.toHaveBeenCalled();
  });
});
