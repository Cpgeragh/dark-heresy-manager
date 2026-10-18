import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeSession, startSession } from "../../src/operations/sessionLifecycle";

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
    doc: vi.fn((id?: string) => namedRef(name, id ?? "generated-session")),
    where: vi.fn(() => ({ limit: vi.fn(() => ({ kind: "openQuery" })) })),
  })),
};

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "server-timestamp" },
  Timestamp: { fromDate: (date: Date) => ({ timestampOf: date.toISOString() }) },
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

function storedCharacter(total = 1_000) {
  return {
    userId: "player-1",
    experience: {
      total,
      spent: 400,
      ranks: [{ rank: 1, advances: [{ id: "advance-1", name: "Advances", cost: 400 }] }],
    },
  };
}

function readsFor({
  sessionStatus = "open",
  storedSummary = "Recovered the relic",
  openSessionExists = false,
  character = storedCharacter,
}: {
  sessionStatus?: string;
  storedSummary?: string;
  openSessionExists?: boolean;
  character?: () => ReturnType<typeof storedCharacter>;
} = {}) {
  transactionGet.mockImplementation(async (target: { kind: string }) => {
    if (target.kind === "openQuery") return { empty: !openSessionExists };
    if (target.kind === "sessions") {
      return { exists: true, data: () => ({ status: sessionStatus, summary: storedSummary }) };
    }
    if (target.kind === "characters") return { exists: true, data: character };
    if (target.kind === "xpHistory") return { exists: false, data: () => undefined };
    throw new Error(`Unexpected transaction read: ${target.kind}`);
  });
}

const start = {
  campaignId: "campaign-1",
  date: "2026-10-17",
  attendees: ["character-1"],
  operationId: "op-1",
};

const close = {
  campaignId: "campaign-1",
  sessionId: "session-1",
  xpAwarded: 200,
  attendees: ["character-1"],
  operationId: "op-1",
};

describe("session lifecycle operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refs.clear();
    campaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    profileGet.mockResolvedValue({ exists: true, data: () => ({ firstName: "Morgan" }) });
    callerIsPrimaryOrLinked.mockResolvedValue(true);
  });

  describe("startSession", () => {
    it("creates an open session and its summary when no session is open", async () => {
      readsFor();

      await startSession(start, "dm-1");

      expect(transactionSet).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "sessions", id: "generated-session" }),
        expect.objectContaining({
          summary: "",
          dmNotes: "",
          xpAwarded: 0,
          attendees: ["character-1"],
          status: "open",
          createdAt: "server-timestamp",
          date: { timestampOf: "2026-10-17T00:00:00.000Z" },
        })
      );
      const summaryCall = transactionSet.mock.calls.find(
        ([ref]) => (ref as { kind: string }).kind === "sessionSummaries"
      );
      expect(summaryCall?.[1]).toEqual(expect.objectContaining({ status: "open", xpAwarded: 0 }));
      expect(summaryCall?.[1]).not.toHaveProperty("dmNotes");
    });

    it("refuses to start a session while another is open", async () => {
      readsFor({ openSessionExists: true });

      await expect(startSession(start, "dm-1")).rejects.toThrow("already open");
      expect(transactionSet).not.toHaveBeenCalled();
    });

    it("rejects a bad date and duplicate or invalid attendees before any transaction", async () => {
      for (const bad of [
        { ...start, date: "17/10/2026" },
        { ...start, attendees: ["a", "a"] },
        { ...start, attendees: ["bad/id"] },
        { ...start, attendees: [] },
      ]) {
        await expect(startSession(bad, "dm-1")).rejects.toThrow(
          expect.objectContaining({ code: "invalid-argument" })
        );
      }
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it("allows only the campaign DM to start a session", async () => {
      callerIsPrimaryOrLinked.mockResolvedValue(false);

      await expect(startSession(start, "player-1")).rejects.toThrow(
        expect.objectContaining({ code: "permission-denied" })
      );
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });

  describe("closeSession", () => {
    it("gives the attendees the XP and closes the session", async () => {
      readsFor();

      await closeSession(close, "dm-1");

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
        expect.objectContaining({ experience: expect.objectContaining({ total: 1_200 }) })
      );
      const closed = {
        xpAwarded: 200,
        attendees: ["character-1"],
        status: "closed",
        xpApplied: true,
      };
      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "sessions", id: "session-1" }),
        closed
      );
      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "sessionSummaries", id: "session-1" }),
        closed
      );
    });

    it("closes with no history when the XP is 0", async () => {
      readsFor();

      await closeSession({ ...close, xpAwarded: 0 }, "dm-1");

      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "sessions" }),
        expect.objectContaining({ status: "closed", xpApplied: true })
      );
    });

    it("refuses a session that is not open", async () => {
      readsFor({ sessionStatus: "closed" });

      await expect(closeSession(close, "dm-1")).rejects.toThrow("not open");
      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("refuses a session whose notes were never saved", async () => {
      readsFor({ storedSummary: "   " });

      await expect(closeSession(close, "dm-1")).rejects.toThrow("Save the session notes");
      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("rejects a bad amount and bad attendees before any transaction", async () => {
      for (const bad of [
        { ...close, xpAwarded: -1 },
        { ...close, xpAwarded: 100_001 },
        { ...close, attendees: ["a", "a"] },
        { ...close, attendees: [] },
      ]) {
        await expect(closeSession(bad, "dm-1")).rejects.toThrow(
          expect.objectContaining({ code: "invalid-argument" })
        );
      }
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it("changes nothing when an attendee would go above the maximum Total XP", async () => {
      readsFor({ character: () => storedCharacter(10_000_000) });

      await expect(closeSession(close, "dm-1")).rejects.toThrow("cannot exceed");
      expect(transactionSet).not.toHaveBeenCalled();
      expect(transactionUpdate).not.toHaveBeenCalled();
    });

    it("allows only the campaign DM to close a session", async () => {
      callerIsPrimaryOrLinked.mockResolvedValue(false);

      await expect(closeSession(close, "player-1")).rejects.toThrow(
        expect.objectContaining({ code: "permission-denied" })
      );
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });
});
