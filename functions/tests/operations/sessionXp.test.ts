import { beforeEach, describe, expect, it, vi } from "vitest";
import { adjustSessionXp, applySessionXp, deleteSession } from "../../src/operations/sessionXp";

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

  describe("adjusting an applied session", () => {
    function readsFor(sessionApplied: boolean, character = storedCharacter) {
      transactionGet.mockImplementation(async (target: { kind: string }) => {
        if (target.kind === "sessions") {
          return { exists: true, data: () => storedSession(sessionApplied) };
        }
        if (target.kind === "characters") return { exists: true, data: character };
        if (target.kind === "xpHistory") return { exists: false, data: () => undefined };
        throw new Error(`Unexpected transaction read: ${target.kind}`);
      });
    }

    const base = { campaignId: "campaign-1", sessionId: "session-1", operationId: "op-1" };

    it("gives each attendee the extra XP when the amount is raised", async () => {
      readsFor(true);

      await adjustSessionXp({ ...base, xpAwarded: 250, attendees: ["character-1"] }, "dm-1");

      expect(transactionSet).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "xpHistory", id: "session-adjustment-session-1-op-1" }),
        expect.objectContaining({
          amountXp: 50,
          balanceXp: 1_050,
          reason: "Recovered the relic",
          source: "session-adjustment",
          sessionId: "session-1",
        })
      );
      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "characters", id: "character-1" }),
        expect.objectContaining({ experience: expect.objectContaining({ total: 1_050 }) })
      );
      for (const kind of ["sessions", "sessionSummaries"]) {
        expect(transactionUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ kind, id: "session-1" }),
          { xpAwarded: 250, attendees: ["character-1"] }
        );
      }
    });

    it("takes the difference back when the amount is lowered", async () => {
      readsFor(true);

      await adjustSessionXp({ ...base, xpAwarded: 150, attendees: ["character-1"] }, "dm-1");

      expect(transactionSet).toHaveBeenCalledWith(
        expect.objectContaining({ id: "session-adjustment-session-1-op-1" }),
        expect.objectContaining({ amountXp: -50, balanceXp: 950 })
      );
    });

    it("gives a newly added attendee the full amount", async () => {
      readsFor(true);

      await adjustSessionXp(
        { ...base, xpAwarded: 200, attendees: ["character-1", "character-2"] },
        "dm-1"
      );

      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "characters", id: "character-2" }),
        expect.objectContaining({ experience: expect.objectContaining({ total: 1_200 }) })
      );
      expect(transactionUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: "characters", id: "character-1" }),
        expect.anything()
      );
    });

    it("removes the full amount from a removed attendee", async () => {
      readsFor(true);

      await adjustSessionXp({ ...base, xpAwarded: 200, attendees: [] }, "dm-1");

      expect(transactionSet).toHaveBeenCalledWith(
        expect.objectContaining({ id: "session-adjustment-session-1-op-1" }),
        expect.objectContaining({ amountXp: -200, balanceXp: 800 })
      );
    });

    it("writes no history and changes no character when nothing changed", async () => {
      readsFor(true);

      await adjustSessionXp({ ...base, xpAwarded: 200, attendees: ["character-1"] }, "dm-1");

      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ kind: "characters" }),
        expect.anything()
      );
    });

    it("rejects the whole edit when it would take Total XP below Spent XP", async () => {
      readsFor(true, () => ({
        ...storedCharacter(),
        experience: { ...storedCharacter().experience, total: 500 },
      }));

      await expect(
        adjustSessionXp({ ...base, xpAwarded: 50, attendees: ["character-1"] }, "dm-1")
      ).rejects.toThrow("below the Spent XP of character-1");
      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("rejects the edit when it would take Total XP above the maximum", async () => {
      readsFor(true, () => ({
        ...storedCharacter(),
        experience: { ...storedCharacter().experience, total: 10_000_000 },
      }));

      await expect(
        adjustSessionXp({ ...base, xpAwarded: 250, attendees: ["character-1"] }, "dm-1")
      ).rejects.toThrow("cannot exceed");
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("rejects a session whose XP was never applied", async () => {
      readsFor(false);

      await expect(
        adjustSessionXp({ ...base, xpAwarded: 250, attendees: ["character-1"] }, "dm-1")
      ).rejects.toThrow("not been applied");
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("rejects an invalid amount, duplicate attendees and a missing operation id", async () => {
      await expect(
        adjustSessionXp({ ...base, xpAwarded: -1, attendees: [] }, "dm-1")
      ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
      await expect(
        adjustSessionXp({ ...base, xpAwarded: 10, attendees: ["a", "a"] }, "dm-1")
      ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
      await expect(
        adjustSessionXp({ ...base, operationId: "", xpAwarded: 10, attendees: [] }, "dm-1")
      ).rejects.toThrow(expect.objectContaining({ code: "invalid-argument" }));
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it("allows only the campaign DM to adjust session XP", async () => {
      callerIsPrimaryOrLinked.mockResolvedValue(false);

      await expect(
        adjustSessionXp({ ...base, xpAwarded: 250, attendees: ["character-1"] }, "player-1")
      ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });
});
