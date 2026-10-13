// tests/unit/useChatMessages.test.tsx
//
// Tests for useChatMessages: a live latest page of one chat copy, plus explicit
// loading of older pages.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatMessages } from "../../src/hooks/useChatMessages";

const {
  mockCollection,
  mockGetDocs,
  mockLimit,
  mockOrderBy,
  mockOnSnapshot,
  mockQuery,
  mockStartAfter,
  mockUnsubscribe,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((..._args: unknown[]) => "messages-ref"),
  mockGetDocs: vi.fn(),
  mockLimit: vi.fn((value: number) => ({ type: "limit", value })),
  mockOrderBy: vi.fn((field: string, direction: string) => ({ type: "orderBy", field, direction })),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((..._args: unknown[]) => "query-ref"),
  mockStartAfter: vi.fn((...args: unknown[]) => ({ type: "startAfter", args })),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  documentId: () => "documentId",
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => mockLimit(value),
  orderBy: (field: string, direction: string) => mockOrderBy(field, direction),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  startAfter: (...args: unknown[]) => mockStartAfter(...args),
}));

vi.mock("../../src/firebase", () => ({ db: "mock-db" }));

type SnapshotCallback = (snap: { docs: { id: string; data: () => object }[] }) => void;

let onNext: SnapshotCallback | null = null;

function makeMessage(number: number) {
  return {
    id: `m${number}`,
    data: () => ({
      fromAccountId: "dm-1",
      text: `Message ${number}`,
      timestamp: { seconds: number },
    }),
  };
}

// Firestore returns newest first, so a page is built from the highest number down.
function page(from: number, to: number) {
  const docs = [];
  for (let number = from; number >= to; number -= 1) docs.push(makeMessage(number));
  return { docs };
}

beforeEach(() => {
  vi.clearAllMocks();
  onNext = null;
  mockOnSnapshot.mockImplementation((_query: unknown, next: SnapshotCallback) => {
    onNext = next;
    return mockUnsubscribe;
  });
});

describe("useChatMessages", () => {
  it("follows the latest page of one chat copy, newest first, limited to a page", () => {
    renderHook(() => useChatMessages("acc-1", "chat-1"));

    expect(mockCollection).toHaveBeenCalledWith(
      "mock-db",
      "users",
      "acc-1",
      "chats",
      "chat-1",
      "messages"
    );
    expect(mockLimit).toHaveBeenCalledWith(100);
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  });

  it("returns messages oldest first once the first snapshot arrives", () => {
    const { result } = renderHook(() => useChatMessages("acc-1", "chat-1"));
    expect(result.current.loading).toBe(true);

    act(() => {
      onNext?.(page(3, 1));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.messages.map((message) => message.id)).toEqual(["m1", "m2", "m3"]);
    expect(result.current.messages[0].fromAccountId).toBe("dm-1");
  });

  it("offers older messages only when a full page arrives", () => {
    const { result } = renderHook(() => useChatMessages("acc-1", "chat-1"));

    act(() => {
      onNext?.(page(3, 1));
    });
    expect(result.current.hasOlderMessages).toBe(false);

    act(() => {
      onNext?.(page(200, 101));
    });
    expect(result.current.hasOlderMessages).toBe(true);
  });

  it("loads older messages and prepends them without duplicates", async () => {
    const { result } = renderHook(() => useChatMessages("acc-1", "chat-1"));
    act(() => {
      onNext?.(page(200, 101));
    });
    mockGetDocs.mockResolvedValue({ docs: [...page(101, 98).docs] });

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockStartAfter).toHaveBeenCalledWith({ seconds: 101 }, "m101");
    const ids = result.current.messages.map((message) => message.id);
    expect(ids).toHaveLength(103);
    expect(ids[0]).toBe("m98");
    expect(ids[3]).toBe("m101");
    expect(ids[102]).toBe("m200");
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.hasOlderMessages).toBe(false);
    expect(result.current.loadingOlder).toBe(false);
  });

  it("keeps the live page and reports the error when loading older messages fails", async () => {
    const { result } = renderHook(() => useChatMessages("acc-1", "chat-1"));
    act(() => {
      onNext?.(page(200, 101));
    });
    mockGetDocs.mockRejectedValue(new Error("offline"));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.messages).toHaveLength(100);
    expect(result.current.olderError?.message).toBe("offline");
    expect(result.current.loadingOlder).toBe(false);
  });

  it("drops older messages when the chat changes", async () => {
    const { result, rerender } = renderHook(
      ({ chatId }: { chatId: string }) => useChatMessages("acc-1", chatId),
      { initialProps: { chatId: "chat-1" } }
    );
    act(() => {
      onNext?.(page(200, 101));
    });
    mockGetDocs.mockResolvedValue({ docs: [...page(100, 98).docs] });
    await act(async () => {
      await result.current.loadOlder();
    });
    expect(result.current.messages).toHaveLength(103);

    rerender({ chatId: "chat-2" });

    expect(result.current.messages).toEqual([]);
    expect(result.current.olderError).toBeNull();
  });

  it("does nothing without a chat", () => {
    const { result } = renderHook(() => useChatMessages("acc-1", null));

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.hasOlderMessages).toBe(false);
  });
});
