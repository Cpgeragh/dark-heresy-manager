import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockDeleteDoc,
  mockDoc,
  mockIncrement,
  mockRunTransaction,
  mockTransaction,
  mockUpdateDoc,
} = vi.hoisted(() => {
  const mockTransaction = {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    mockDeleteDoc: vi.fn().mockResolvedValue(undefined),
    mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
    mockIncrement: vi.fn((amount: number) => `increment:${amount}`),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
    mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  increment: (...args: [number]) => mockIncrement(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  serverTimestamp: vi.fn(),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  writeBatch: vi.fn(),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { applySessionXp, deleteSession, updateSession } from "../../src/services/sessionService";

beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ xpApplied: false }),
  });
});

describe("session write operations", () => {
  it("updates the requested session with the supplied editable fields", async () => {
    const update = {
      summary: "The acolytes survived.",
      dmNotes: "Barely.",
      xpAwarded: 200,
      attendees: ["char-1"],
    };

    await updateSession("camp-1", "session-1", update);

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1", "sessions", "session-1");
    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-1/sessions/session-1", update);
  });

  it("deletes the requested session", async () => {
    await deleteSession("camp-2", "session-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2", "sessions", "session-2");
    expect(mockDeleteDoc).toHaveBeenCalledWith("campaigns/camp-2/sessions/session-2");
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(updateSession("camp-3", "session-3", { summary: "No change" })).rejects.toBe(
      error
    );
  });

  it("rejects oversized notes before writing", async () => {
    await expect(
      updateSession("camp-1", "session-1", { dmNotes: "x".repeat(4_001) })
    ).rejects.toThrow("DM notes cannot exceed 4000 characters.");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("rejects duplicate attendees before writing", async () => {
    await expect(
      updateSession("camp-1", "session-1", { attendees: ["char-1", "char-1"] })
    ).rejects.toThrow("A character cannot be listed as a session attendee more than once.");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("rejects invalid session field types and attendee IDs before writing", async () => {
    await expect(updateSession("camp-1", "session-1", { summary: 42 as never })).rejects.toThrow(
      "Session summary must be text"
    );
    await expect(updateSession("camp-1", "session-1", { attendees: ["bad/id"] })).rejects.toThrow(
      "Session attendee ID is invalid"
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("applySessionXp", () => {
  it("applies XP to every attendee and marks the session applied", async () => {
    await applySessionXp("camp-1", "sess-1", ["char-1", "char-2"], 200);

    expect(mockRunTransaction).toHaveBeenCalledWith("mock-db", expect.any(Function));
    expect(mockTransaction.get).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1");
    expect(mockTransaction.update).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1", {
      xpApplied: true,
    });
    expect(mockTransaction.update).toHaveBeenCalledWith("campaigns/camp-1/characters/char-1", {
      "experience.total": "increment:200",
    });
    expect(mockTransaction.update).toHaveBeenCalledWith("campaigns/camp-1/characters/char-2", {
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
    expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
  });

  it("reverses XP from every attendee and deletes the session when applied", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: true, xpAwarded: 200, attendees: ["char-1", "char-2"] }),
    });

    await deleteSession("camp-1", "sess-1", true);

    expect(mockRunTransaction).toHaveBeenCalledWith("mock-db", expect.any(Function));
    expect(mockIncrement).toHaveBeenCalledWith(-200);
    expect(mockTransaction.update).toHaveBeenCalledWith("campaigns/camp-1/characters/char-1", {
      "experience.total": "increment:-200",
    });
    expect(mockTransaction.update).toHaveBeenCalledWith("campaigns/camp-1/characters/char-2", {
      "experience.total": "increment:-200",
    });
    expect(mockTransaction.delete).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1");
  });

  it("deletes the session without touching any character when XP was never applied", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ xpApplied: false, xpAwarded: 200, attendees: ["char-1"] }),
    });

    await deleteSession("camp-1", "sess-1", true);

    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1");
  });

  it("still deletes cleanly if the session is already gone", async () => {
    mockTransaction.get.mockResolvedValue({ exists: () => false, data: () => undefined });

    await expect(deleteSession("camp-1", "sess-1", true)).resolves.toBeUndefined();
    expect(mockTransaction.update).not.toHaveBeenCalled();
    expect(mockTransaction.delete).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1");
  });
});
