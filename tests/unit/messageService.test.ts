// tests/unit/messageService.test.ts
//
// Tests for sendMessage, markThreadRead, and clearThread.
// Firebase is fully mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatch = { set: mockBatchSet, delete: mockBatchDelete, commit: mockBatchCommit };

const {
  mockWriteBatch,
  mockDoc,
  mockCollection,
  mockGetDocs,
  mockServerTimestamp,
  mockSetDoc,
  mockUpdateDoc,
  mockIncrement,
} = vi.hoisted(() => ({
  mockWriteBatch: vi.fn(),
  // doc(db, ...path) → join path segments; doc(collectionRef) → append "/auto-id"
  mockDoc: vi.fn((...args: unknown[]) =>
    args.length === 1 ? `${String(args[0])}/auto-id` : (args.slice(1) as string[]).join("/")
  ),
  mockCollection: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockGetDocs: vi.fn(),
  mockServerTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  mockIncrement: vi.fn((n: number) => ({ _increment: n })),
}));

vi.mock("firebase/firestore", () => ({
  documentId: () => "__name__",
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  increment: (n: number) => mockIncrement(n),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db" }));

import { sendMessage, markThreadRead, clearThread } from "../../src/services/messageService";

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteBatch.mockReturnValue(mockBatch);
  mockSetDoc.mockResolvedValue(undefined);
  mockUpdateDoc.mockResolvedValue(undefined);
  mockGetDocs.mockResolvedValue({ docs: [], empty: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDocs(refs: string[]) {
  return {
    docs: refs.map((ref) => ({ ref, id: ref.split("/").pop() as string })),
    empty: refs.length === 0,
  };
}

// ── sendMessage ───────────────────────────────────────────────────────────────

describe("sendMessage", () => {
  it("writes the message doc with correct fields", async () => {
    await sendMessage("c1", "char-1", "p1", "Hello", true);

    // First batch.set call is the message doc (auto-id ref)
    expect(mockBatchSet).toHaveBeenNthCalledWith(
      1,
      "campaigns/c1/threads/char-1/messages/auto-id",
      { fromUid: "p1", text: "Hello", timestamp: "SERVER_TIMESTAMP", read: false }
    );
  });

  it("increments unreadForDM when isFromPlayer is true", async () => {
    await sendMessage("c1", "char-1", "p1", "Hello", true);

    // Second batch.set call is the thread summary
    expect(mockBatchSet).toHaveBeenNthCalledWith(
      2,
      "campaigns/c1/threads/char-1",
      expect.objectContaining({ unreadForDM: { _increment: 1 } }),
      { merge: true }
    );
  });

  it("does not include unreadForDM when isFromPlayer is false (DM reply)", async () => {
    await sendMessage("c1", "char-1", "dm-1", "Reply", false);

    const [, summaryData] = mockBatchSet.mock.calls[1];
    expect(summaryData).not.toHaveProperty("unreadForDM");
  });

  it("stores characterId in the thread summary", async () => {
    await sendMessage("c1", "char-1", "p1", "Hello", true);

    const [, summaryData] = mockBatchSet.mock.calls[1];
    expect(summaryData).toMatchObject({ characterId: "char-1" });
  });

  it("trims whitespace from text in both the message doc and thread summary", async () => {
    await sendMessage("c1", "char-1", "p1", "  spaces  ", true);

    const [, messageData] = mockBatchSet.mock.calls[0];
    const [, summaryData] = mockBatchSet.mock.calls[1];
    expect(messageData.text).toBe("spaces");
    expect(summaryData.lastMessage).toBe("spaces");
  });

  it("keeps the full message while bounding the thread preview to 500 characters", async () => {
    const text = "x".repeat(600);
    await sendMessage("c1", "char-1", "p1", text, true);

    const [, messageData] = mockBatchSet.mock.calls[0];
    const [, summaryData] = mockBatchSet.mock.calls[1];
    expect(messageData.text).toHaveLength(600);
    expect(summaryData.lastMessage).toHaveLength(500);
  });

  it("commits the batch exactly once", async () => {
    await sendMessage("c1", "char-1", "p1", "Hello", true);
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("rejects empty messages before creating a batch", async () => {
    await expect(sendMessage("c1", "char-1", "p1", "   ", true)).rejects.toThrow(
      "Message cannot be empty."
    );
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("rejects messages over 2,000 characters before creating a batch", async () => {
    await expect(sendMessage("c1", "char-1", "p1", "x".repeat(2_001), true)).rejects.toThrow(
      "Message cannot exceed 2000 characters."
    );
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it("rejects invalid IDs and runtime field types before creating a batch", async () => {
    await expect(sendMessage("bad/campaign", "char-1", "p1", "Hello", true)).rejects.toThrow(
      "Campaign ID is invalid"
    );
    await expect(sendMessage("c1", "char-1", "p1", 42 as never, true)).rejects.toThrow(
      "Message must be text"
    );
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });
});

// ── markThreadRead ────────────────────────────────────────────────────────────

describe("markThreadRead", () => {
  it("calls updateDoc with unreadForDM: 0 on the correct thread ref", async () => {
    await markThreadRead("c1", "char-1");

    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/c1/threads/char-1", { unreadForDM: 0 });
  });

  it("calls updateDoc exactly once", async () => {
    await markThreadRead("c1", "char-1");
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
  });
});

// ── clearThread ───────────────────────────────────────────────────────────────

describe("clearThread", () => {
  it("batch-deletes all messages and resets the thread summary", async () => {
    mockGetDocs.mockResolvedValue(
      makeDocs([
        "campaigns/c1/threads/char-1/messages/m1",
        "campaigns/c1/threads/char-1/messages/m2",
      ])
    );

    await clearThread("c1", "char-1");

    expect(mockBatchDelete).toHaveBeenCalledWith("campaigns/c1/threads/char-1/messages/m1");
    expect(mockBatchDelete).toHaveBeenCalledWith("campaigns/c1/threads/char-1/messages/m2");
    expect(mockSetDoc).toHaveBeenCalledWith("campaigns/c1/threads/char-1", {
      characterId: "char-1",
      lastMessage: null,
      lastTimestamp: null,
      unreadForDM: 0,
    });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("handles an empty thread gracefully — setDoc only, no batch", async () => {
    mockGetDocs.mockResolvedValue(makeDocs([]));

    await clearThread("c1", "char-1");

    expect(mockBatchDelete).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith("campaigns/c1/threads/char-1", {
      characterId: "char-1",
      lastMessage: null,
      lastTimestamp: null,
      unreadForDM: 0,
    });
  });
});
