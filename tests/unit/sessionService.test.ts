import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockBatch,
  mockBatchCommit,
  mockBatchDelete,
  mockBatchSet,
  mockBatchUpdate,
  mockCallRepairSessionSummaries,
  mockDoc,
  mockIncrement,
  mockRunTransaction,
  mockTransaction,
} = vi.hoisted(() => {
  const mockBatchSet = vi.fn();
  const mockBatchUpdate = vi.fn();
  const mockBatchDelete = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
  const mockBatch = {
    set: mockBatchSet,
    update: mockBatchUpdate,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  };
  const mockCallRepairSessionSummaries = vi.fn();
  const mockTransaction = {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    mockBatch,
    mockBatchCommit,
    mockBatchDelete,
    mockBatchSet,
    mockBatchUpdate,
    mockCallRepairSessionSummaries,
    mockDoc: vi.fn((...args: unknown[]) => {
      if (args.length === 1) {
        const parent = args[0] as { path: string };
        return { id: "generated-session", path: `${parent.path}/generated-session` };
      }
      const path = args.slice(1).join("/");
      return { id: String(args.at(-1)), path };
    }),
    mockIncrement: vi.fn((amount: number) => `increment:${amount}`),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
  };
});

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((...args: unknown[]) => ({ path: args.slice(1).join("/") })),
  doc: (...args: unknown[]) => mockDoc(...args),
  increment: (...args: [number]) => mockIncrement(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  writeBatch: vi.fn(() => mockBatch),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
  functions: "mock-functions",
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "repairSessionSummaries") return mockCallRepairSessionSummaries;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

import {
  applySessionXp,
  createSession,
  deleteSession,
  repairSessionSummaries,
  updateSession,
} from "../../src/services/sessionService";

function ref(path: string) {
  return expect.objectContaining({ path });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ xpApplied: false }),
  });
});

describe("session write operations", () => {
  it("reuses one Firebase write for a duplicate in-flight session edit", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    mockBatchCommit.mockReturnValueOnce(pending);
    const update = { summary: "One edit" };

    const first = updateSession("camp-1", "session-duplicate", update);
    const duplicate = updateSession("camp-1", "session-duplicate", update);
    await Promise.resolve();

    expect(mockBatchCommit).toHaveBeenCalledOnce();
    finish();
    await Promise.all([first, duplicate]);
  });

  it("updates the requested session with the supplied editable fields", async () => {
    const update = {
      summary: "The acolytes survived.",
      dmNotes: "Barely.",
      xpAwarded: 200,
      attendees: ["char-1"],
    };

    await updateSession("camp-1", "session-1", update);

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1", "sessions", "session-1");
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessions/session-1"),
      update
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/session-1"),
      { summary: "The acolytes survived.", xpAwarded: 200, attendees: ["char-1"] }
    );
  });

  it("accepts every editable session field at its exact maximum", async () => {
    const update = {
      summary: "s".repeat(4_000),
      dmNotes: "n".repeat(4_000),
      xpAwarded: 100_000,
      attendees: Array.from({ length: 100 }, (_, index) => `char-${index}`),
    };

    await updateSession("camp-1", "session-max", update);

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessions/session-max"),
      update
    );
  });

  it("deletes the requested session", async () => {
    await deleteSession("camp-2", "session-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2", "sessions", "session-2");
    expect(mockBatchDelete).toHaveBeenCalledWith(ref("campaigns/camp-2/sessions/session-2"));
    expect(mockBatchDelete).toHaveBeenCalledWith(
      ref("campaigns/camp-2/sessionSummaries/session-2")
    );
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockBatchCommit.mockRejectedValueOnce(error);

    await expect(updateSession("camp-3", "session-3", { summary: "No change" })).rejects.toBe(
      error
    );
  });

  it("rejects oversized notes before writing", async () => {
    await expect(
      updateSession("camp-1", "session-1", { dmNotes: "x".repeat(4_001) })
    ).rejects.toThrow("DM notes cannot exceed 4000 characters.");
    expect(mockBatchUpdate).not.toHaveBeenCalled();
  });

  it("rejects duplicate attendees before writing", async () => {
    await expect(
      updateSession("camp-1", "session-1", { attendees: ["char-1", "char-1"] })
    ).rejects.toThrow("A character cannot be listed as a session attendee more than once.");
    expect(mockBatchUpdate).not.toHaveBeenCalled();
  });

  it("rejects invalid session field types and attendee IDs before writing", async () => {
    await expect(updateSession("camp-1", "session-1", { summary: 42 as never })).rejects.toThrow(
      "Session summary must be text"
    );
    await expect(updateSession("camp-1", "session-1", { attendees: ["bad/id"] })).rejects.toThrow(
      "Session attendee ID is invalid"
    );
    expect(mockBatchUpdate).not.toHaveBeenCalled();
  });

  it("creates the private session and safe member summary atomically", async () => {
    const date = new Date("2026-08-28T00:00:00.000Z");
    await createSession("camp-1", {
      date,
      summary: "Public recap",
      dmNotes: "Private plan",
      xpAwarded: 100,
      attendees: ["char-1"],
    });

    expect(mockBatchSet).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessions/generated-session"),
      expect.objectContaining({ summary: "Public recap", dmNotes: "Private plan" })
    );
    expect(mockBatchSet).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/generated-session"),
      {
        date,
        summary: "Public recap",
        xpAwarded: 100,
        attendees: ["char-1"],
        createdAt: "server-timestamp",
        xpApplied: false,
      }
    );
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("keeps a DM-notes-only edit out of the member summary", async () => {
    await updateSession("camp-1", "session-1", { dmNotes: "Private change" });

    expect(mockBatchUpdate).toHaveBeenCalledOnce();
    expect(mockBatchUpdate).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/session-1"), {
      dmNotes: "Private change",
    });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});

describe("repairSessionSummaries", () => {
  it("returns the protected operation's repaired count", async () => {
    mockCallRepairSessionSummaries.mockResolvedValue({ data: { repairedCount: 3 } });

    await expect(repairSessionSummaries("camp-1")).resolves.toBe(3);
    expect(mockCallRepairSessionSummaries).toHaveBeenCalledWith({ campaignId: "camp-1" });
  });

  it("validates the campaign ID before invoking the protected operation", async () => {
    await expect(repairSessionSummaries("bad/id")).rejects.toThrow("Campaign ID is invalid");
    expect(mockCallRepairSessionSummaries).not.toHaveBeenCalled();
  });
});

describe("applySessionXp", () => {
  it("applies XP to every attendee and marks the session applied", async () => {
    await applySessionXp("camp-1", "sess-1", ["char-1", "char-2"], 200);

    expect(mockRunTransaction).toHaveBeenCalledWith("mock-db", expect.any(Function));
    expect(mockTransaction.get).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/sess-1"));
    expect(mockTransaction.update).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/sess-1"), {
      xpApplied: true,
    });
    expect(mockTransaction.update).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/sess-1"),
      { xpApplied: true }
    );
    expect(mockTransaction.update).toHaveBeenCalledWith(ref("campaigns/camp-1/characters/char-1"), {
      "experience.total": "increment:200",
    });
    expect(mockTransaction.update).toHaveBeenCalledWith(ref("campaigns/camp-1/characters/char-2"), {
      "experience.total": "increment:200",
    });
  });

  it("rejects and touches nothing when XP was already applied", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: true }),
    });

    await expect(applySessionXp("camp-1", "sess-1", ["char-1"], 200)).rejects.toThrow(
      "XP has already been applied for this session."
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it("rejects if the session no longer exists", async () => {
    mockTransaction.get.mockResolvedValue({ exists: () => false, data: () => undefined });

    await expect(applySessionXp("camp-1", "sess-1", ["char-1"], 200)).rejects.toThrow(
      "Session does not exist."
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it("does nothing for zero XP and rejects negative XP without starting a transaction", async () => {
    await applySessionXp("camp-1", "sess-1", ["char-1"], 0);
    await expect(applySessionXp("camp-1", "sess-1", ["char-1"], -50)).rejects.toThrow(
      "XP awarded must be a whole number from 0 to 100000."
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("does nothing when there are no attendees, even with positive XP", async () => {
    await applySessionXp("camp-1", "sess-1", [], 200);

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});

describe("deleteSession with XP reversal", () => {
  it("plain delete (no reverseXp) never starts a transaction", async () => {
    await deleteSession("camp-1", "sess-1");
    await deleteSession("camp-1", "sess-1", false);

    expect(mockRunTransaction).not.toHaveBeenCalled();
    expect(mockBatchDelete).toHaveBeenCalledTimes(4);
    expect(mockBatchCommit).toHaveBeenCalledTimes(2);
  });

  it("reverses XP from every attendee and deletes the session when applied", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: true, xpAwarded: 200, attendees: ["char-1", "char-2"] }),
    });

    await deleteSession("camp-1", "sess-1", true);

    expect(mockRunTransaction).toHaveBeenCalledWith("mock-db", expect.any(Function));
    expect(mockIncrement).toHaveBeenCalledWith(-200);
    expect(mockTransaction.update).toHaveBeenCalledWith(ref("campaigns/camp-1/characters/char-1"), {
      "experience.total": "increment:-200",
    });
    expect(mockTransaction.update).toHaveBeenCalledWith(ref("campaigns/camp-1/characters/char-2"), {
      "experience.total": "increment:-200",
    });
    expect(mockTransaction.delete).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/sess-1"));
    expect(mockTransaction.delete).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/sess-1")
    );
  });

  it("deletes the session without touching any character when XP was never applied", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: false, xpAwarded: 200, attendees: ["char-1"] }),
    });

    await deleteSession("camp-1", "sess-1", true);

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/sess-1"));
    expect(mockTransaction.delete).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/sess-1")
    );
  });

  it("still deletes cleanly if the session is already gone", async () => {
    mockTransaction.get.mockResolvedValue({ exists: () => false, data: () => undefined });

    await expect(deleteSession("camp-1", "sess-1", true)).resolves.toBeUndefined();
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).toHaveBeenCalledWith(ref("campaigns/camp-1/sessions/sess-1"));
    expect(mockTransaction.delete).toHaveBeenCalledWith(
      ref("campaigns/camp-1/sessionSummaries/sess-1")
    );
  });

  it("stops an over-limit stored XP reversal before staging any write or delete", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({
        xpApplied: true,
        xpAwarded: 200,
        attendees: Array.from({ length: 101 }, (_, index) => `char-${index}`),
      }),
    });

    await expect(deleteSession("camp-1", "sess-1", true)).rejects.toThrow(
      "more than 100 attendees"
    );
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).not.toHaveBeenCalled();
  });

  it("stops duplicate stored attendees before staging XP reversal", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: true, xpAwarded: 200, attendees: ["char-1", "char-1"] }),
    });

    await expect(deleteSession("camp-1", "sess-1", true)).rejects.toThrow("contain duplicates");
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).not.toHaveBeenCalled();
  });
});
