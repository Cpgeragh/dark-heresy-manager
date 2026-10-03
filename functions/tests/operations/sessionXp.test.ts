import { beforeEach, describe, expect, it, vi } from "vitest";
import { applySessionXp, deleteSession } from "../../src/operations/sessionXp";

const {
  campaignGet,
  profileGet,
  transactionGet,
  transactionSet,
  transactionUpdate,
  transactionDelete,
  runTransaction,
  callerIsPrimaryOrLinked,
} = vi.hoisted(() => ({
  campaignGet: vi.fn(),
  profileGet: vi.fn(),
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  transactionUpdate: vi.fn(),
  transactionDelete: vi.fn(),
  runTransaction: vi.fn(async (handler: (transaction: unknown) => Promise<void>) =>
    handler({
      get: transactionGet,
      set: transactionSet,
      update: transactionUpdate,
      delete: transactionDelete,
    })
  ),
  callerIsPrimaryOrLinked: vi.fn(),
}));

function nestedRef(kind: string, id: string): Record<string, unknown> {
  const value: Record<string, unknown> = { kind, id };
  value.collection = vi.fn((name: string) => ({
    doc: vi.fn((documentId: string) => nestedRef(name, documentId)),
  }));
  return value;
}

const refs = new Map<string, Record<string, unknown>>();
function namedRef(kind: string, id: string) {
  const key = `${kind}:${id}`;
  if (!refs.has(key)) refs.set(key, nestedRef(kind, id));
  return refs.get(key)!;
}

const campaignRef = {
  get: campaignGet,
  collection: vi.fn((name: string) => ({
    doc: vi.fn((id: string) => namedRef(name, id)),
  })),
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

function storedSession(xpApplied: boolean) {
  return {
    xpApplied,
    xpAwarded: 200,
    attendees: ["character-1"],
    summary: "Recovered the relic",
  };
}

function storedCharacter() {
  return {
    userId: "player-1",
    experience: {
      total: 1_000,
      spent: 400,
      ranks: [{ rank: 1, advances: [{ id: "advance-1", name: "Advances", cost: 400 }] }],
    },
  };
}

describe("session XP operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refs.clear();
    campaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    profileGet.mockResolvedValue({ exists: true, data: () => ({ firstName: "Morgan" }) });
    callerIsPrimaryOrLinked.mockResolvedValue(true);
  });

  it("applies the stored session award and writes an attendee history entry", async () => {
    transactionGet.mockImplementation(async (target: { kind: string }) => {
      if (target.kind === "sessions") return { exists: true, data: () => storedSession(false) };
      if (target.kind === "characters") return { exists: true, data: storedCharacter };
      if (target.kind === "xpHistory") return { exists: false, data: () => undefined };
      throw new Error(`Unexpected transaction read: ${target.kind}`);
    });

    await applySessionXp({ campaignId: "campaign-1", sessionId: "session-1" }, "dm-1");

    expect(transactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "xpHistory", id: "session-award-session-1" }),
      expect.objectContaining({
        amountXp: 200,
        balanceXp: 1_200,
        reason: "Recovered the relic",
        source: "session-award",
        sessionId: "session-1",
      })
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "characters", id: "character-1" }),
      {
        experience: {
          total: 1_200,
          spent: 400,
          ranks: [{ rank: 1, advances: [{ id: "advance-1", name: "Advances", cost: 400 }] }],
        },
      }
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "sessions", id: "session-1" }),
      { xpApplied: true }
    );
  });

  it("rejects applying an award twice", async () => {
    transactionGet.mockResolvedValue({ exists: true, data: () => storedSession(true) });

    await expect(
      applySessionXp({ campaignId: "campaign-1", sessionId: "session-1" }, "dm-1")
    ).rejects.toThrow("already been applied");
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });

  it("records a negative history entry when deleting and reversing an applied session", async () => {
    transactionGet.mockImplementation(async (target: { kind: string }) => {
      if (target.kind === "sessions") return { exists: true, data: () => storedSession(true) };
      if (target.kind === "characters") return { exists: true, data: storedCharacter };
      if (target.kind === "xpHistory") return { exists: true, data: () => ({}) };
      throw new Error(`Unexpected transaction read: ${target.kind}`);
    });

    await deleteSession(
      { campaignId: "campaign-1", sessionId: "session-1", reverseXp: true },
      "dm-1"
    );

    expect(transactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "xpHistory", id: "session-reversal-session-1" }),
      expect.objectContaining({
        amountXp: -200,
        balanceXp: 800,
        source: "session-reversal",
      })
    );
    expect(transactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "sessions", id: "session-1" })
    );
    expect(transactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "sessionSummaries", id: "session-1" })
    );
  });

  it("rejects the whole session reversal when it would reduce Total XP below Spent XP", async () => {
    transactionGet.mockImplementation(async (target: { kind: string }) => {
      if (target.kind === "sessions") return { exists: true, data: () => storedSession(true) };
      if (target.kind === "characters") {
        return {
          exists: true,
          data: () => ({
            ...storedCharacter(),
            experience: { ...storedCharacter().experience, total: 500 },
          }),
        };
      }
      if (target.kind === "xpHistory") return { exists: true, data: () => ({}) };
      throw new Error(`Unexpected transaction read: ${target.kind}`);
    });

    await expect(
      deleteSession({ campaignId: "campaign-1", sessionId: "session-1", reverseXp: true }, "dm-1")
    ).rejects.toThrow("cannot be reversed below Spent XP");
    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionDelete).not.toHaveBeenCalled();
  });

  it("does not touch character XP when deletion is not set to reverse it", async () => {
    transactionGet.mockResolvedValue({ exists: true, data: () => storedSession(true) });

    await deleteSession(
      { campaignId: "campaign-1", sessionId: "session-1", reverseXp: false },
      "dm-1"
    );

    expect(transactionSet).not.toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionDelete).toHaveBeenCalledTimes(2);
  });

  it("allows only the campaign DM to manage session XP", async () => {
    callerIsPrimaryOrLinked.mockResolvedValue(false);

    await expect(
      applySessionXp({ campaignId: "campaign-1", sessionId: "session-1" }, "player-1")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
