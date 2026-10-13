// tests/unit/chatsContext.test.tsx
//
// Tests for ChatsProvider, which runs one Firestore listener on the signed-in
// account's own chats and exposes the list with an unread total.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ChatsProvider } from "../../src/context/ChatsContext";
import { useChatsContext } from "../../src/context/useChatsContext";

const { mockLimit, mockOrderBy, mockOnSnapshot, mockQuery, mockUnsubscribe } = vi.hoisted(() => ({
  mockLimit: vi.fn((value: number) => ({ type: "limit", value })),
  mockOrderBy: vi.fn((field: string, direction: string) => ({ type: "orderBy", field, direction })),
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn((..._args: unknown[]) => "query-ref"),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("../../src/firebase/converters", () => ({
  chatsCollectionRef: vi.fn((accountId: string) => `chats-ref:${accountId}`),
}));

vi.mock("firebase/firestore", () => ({
  limit: (value: number) => mockLimit(value),
  orderBy: (field: string, direction: string) => mockOrderBy(field, direction),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  query: (...args: unknown[]) => mockQuery(...args),
}));

type SnapshotCallback = (snap: { docs: { data: () => object }[] }) => void;
type ErrorCallback = (err: Error) => void;

let onNext: SnapshotCallback | null = null;
let onError: ErrorCallback | null = null;

function makeChat(id: string, unreadCount: number, closed = false) {
  return { data: () => ({ id, unreadCount, closed }) };
}

function makeWrapper(accountId: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ChatsProvider accountId={accountId}>{children}</ChatsProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  onNext = null;
  onError = null;
  mockOnSnapshot.mockImplementation(
    (_query: unknown, next: SnapshotCallback, error: ErrorCallback) => {
      onNext = next;
      onError = error;
      return mockUnsubscribe;
    }
  );
});

describe("ChatsProvider", () => {
  it("listens to the account's chats, newest first, with the chat limit", () => {
    renderHook(() => useChatsContext(), { wrapper: makeWrapper("acc-1") });

    expect(mockOrderBy).toHaveBeenCalledWith("lastTimestamp", "desc");
    expect(mockLimit).toHaveBeenCalledWith(200);
    expect(mockQuery).toHaveBeenCalledWith(
      "chats-ref:acc-1",
      { type: "orderBy", field: "lastTimestamp", direction: "desc" },
      { type: "limit", value: 200 }
    );
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  });

  it("is loading until the first snapshot, then returns the chats and the unread total", () => {
    const { result } = renderHook(() => useChatsContext(), { wrapper: makeWrapper("acc-1") });
    expect(result.current.loading).toBe(true);
    expect(result.current.chats).toEqual([]);
    expect(result.current.unreadTotal).toBe(0);

    act(() => {
      onNext?.({ docs: [makeChat("a", 2), makeChat("b", 0), makeChat("c", 3, true)] });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.chats.map((chat) => chat.id)).toEqual(["a", "b", "c"]);
    expect(result.current.unreadTotal).toBe(5);
  });

  it("returns an empty list and the error when the listener fails", () => {
    const { result } = renderHook(() => useChatsContext(), { wrapper: makeWrapper("acc-1") });

    act(() => {
      onError?.(new Error("denied"));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chats).toEqual([]);
    expect(result.current.unreadTotal).toBe(0);
    expect(result.current.error?.message).toBe("denied");
  });

  it("does not listen without an account id", () => {
    const { result } = renderHook(() => useChatsContext(), { wrapper: makeWrapper("") });

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.chats).toEqual([]);
  });

  it("stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => useChatsContext(), { wrapper: makeWrapper("acc-1") });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
