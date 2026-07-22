import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeleteDoc, mockDoc, mockUpdateDoc } = vi.hoisted(() => ({
  mockDeleteDoc: vi.fn().mockResolvedValue(undefined),
  mockDoc: vi.fn((..._args: unknown[]) => "doc-ref"),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  increment: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  writeBatch: vi.fn(),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

import { deleteSession, updateSession } from "../../src/services/sessionService";

beforeEach(() => {
  vi.clearAllMocks();
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
    expect(mockUpdateDoc).toHaveBeenCalledWith("doc-ref", update);
  });

  it("deletes the requested session", async () => {
    await deleteSession("camp-2", "session-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2", "sessions", "session-2");
    expect(mockDeleteDoc).toHaveBeenCalledWith("doc-ref");
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(updateSession("camp-3", "session-3", { summary: "No change" })).rejects.toBe(
      error
    );
  });
});
