import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockBatch,
  mockBatchCommit,
  mockBatchSet,
  mockBatchUpdate,
  mockCallRepairSessionSummaries,
  mockCallApplySessionXp,
  mockCallDeleteSession,
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
  const mockCallApplySessionXp = vi.fn();
  const mockCallDeleteSession = vi.fn();
  const mockTransaction = {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    mockBatch,
    mockBatchCommit,
    mockBatchSet,
    mockBatchUpdate,
    mockCallRepairSessionSummaries,
    mockCallApplySessionXp,
    mockCallDeleteSession,
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
    if (name === "applySessionXp") return mockCallApplySessionXp;
    if (name === "deleteSession") return mockCallDeleteSession;
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
    mockCallDeleteSession.mockResolvedValue({ data: undefined });
    await deleteSession("camp-2", "session-2");

    expect(mockCallDeleteSession).toHaveBeenCalledWith({
      campaignId: "camp-2",
      sessionId: "session-2",
      reverseXp: false,
      operationId: expect.any(String),
    });
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
  it("calls the protected session award operation after validating the request", async () => {
    mockCallApplySessionXp.mockResolvedValue({ data: undefined });
    await applySessionXp("camp-1", "sess-1", ["char-1", "char-2"], 200);

    expect(mockCallApplySessionXp).toHaveBeenCalledWith({
      campaignId: "camp-1",
      sessionId: "sess-1",
      operationId: expect.any(String),
    });
  });

  it("preserves protected-operation failures", async () => {
    const error = new Error("XP has already been applied for this session.");
    mockCallApplySessionXp.mockRejectedValue(error);

    await expect(applySessionXp("camp-1", "sess-1", ["char-1"], 200)).rejects.toBe(error);
  });

  it("does nothing for zero XP and rejects negative XP without calling the server", async () => {
    await applySessionXp("camp-1", "sess-1", ["char-1"], 0);
    await expect(applySessionXp("camp-1", "sess-1", ["char-1"], -50)).rejects.toThrow(
      "XP awarded must be a whole number from 0 to 100000."
    );

    expect(mockCallApplySessionXp).not.toHaveBeenCalled();
  });

  it("does nothing when there are no attendees, even with positive XP", async () => {
    await applySessionXp("camp-1", "sess-1", [], 200);

    expect(mockCallApplySessionXp).not.toHaveBeenCalled();
  });
});

describe("deleteSession with XP reversal", () => {
  it("passes the requested reversal choice to the protected operation", async () => {
    mockCallDeleteSession.mockResolvedValue({ data: undefined });
    await deleteSession("camp-1", "sess-1");
    await deleteSession("camp-1", "sess-1", true);

    expect(mockCallDeleteSession).toHaveBeenNthCalledWith(1, {
      campaignId: "camp-1",
      sessionId: "sess-1",
      reverseXp: false,
      operationId: expect.any(String),
    });
    expect(mockCallDeleteSession).toHaveBeenNthCalledWith(2, {
      campaignId: "camp-1",
      sessionId: "sess-1",
      reverseXp: true,
      operationId: expect.any(String),
    });
  });
});
