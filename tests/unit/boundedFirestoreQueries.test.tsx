import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCollection,
  mockLimit,
  mockLimitToLast,
  mockOrderBy,
  mockQuery,
  mockUseQuerySubscription,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((...path: unknown[]) => ({ type: "collection", path })),
  mockLimit: vi.fn((value: number) => ({ type: "limit", value })),
  mockLimitToLast: vi.fn((value: number) => ({ type: "limitToLast", value })),
  mockOrderBy: vi.fn((field: string, direction: string) => ({
    type: "orderBy",
    field,
    direction,
  })),
  mockQuery: vi.fn((...parts: unknown[]) => ({ type: "query", parts })),
  mockUseQuerySubscription: vi.fn(() => ({ data: [], loading: false, error: null })),
  mockWhere: vi.fn((field: string, operator: string, value: unknown) => ({
    type: "where",
    field,
    operator,
    value,
  })),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  limit: (value: number) => mockLimit(value),
  limitToLast: (value: number) => mockLimitToLast(value),
  orderBy: (field: string, direction: string) => mockOrderBy(field, direction),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (field: string, operator: string, value: unknown) => mockWhere(field, operator, value),
}));

vi.mock("../../src/firebase", () => ({ db: "db" }));

vi.mock("../../src/firebase/converters", () => ({
  charactersCollectionRef: (campaignId: string) => ({
    type: "characters",
    campaignId,
  }),
}));

vi.mock("../../src/hooks/useFirestoreSubscription", () => ({
  useQuerySubscription: (...args: unknown[]) => mockUseQuerySubscription(...args),
}));

import { useClaimLogs } from "../../src/hooks/useClaimLogs";
import { usePlayerCharacters } from "../../src/hooks/usePlayerCharacters";
import { useThreadMessages } from "../../src/hooks/useThreadMessages";

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuerySubscription.mockReturnValue({ data: [], loading: false, error: null });
});

describe("bounded Firestore hooks", () => {
  it("filters a player's characters on the server and caps the result", () => {
    renderHook(() => usePlayerCharacters("campaign-1", "user-1"));

    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "player-characters:campaign-1:user-1",
      expect.any(Function)
    );
  });

  it("loads only the latest page of thread messages", () => {
    renderHook(() => useThreadMessages("campaign-1", "character-1"));

    expect(mockOrderBy).toHaveBeenCalledWith("timestamp", "asc");
    expect(mockLimitToLast).toHaveBeenCalledWith(100);
  });

  it("does not construct a claim-log query until it is enabled", () => {
    renderHook(() => useClaimLogs("campaign-1", "character-1", false));

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(null, null, expect.any(Function));
  });

  it("caps an enabled claim-log query", () => {
    renderHook(() => useClaimLogs("campaign-1", "character-1", true));

    expect(mockOrderBy).toHaveBeenCalledWith("timestamp", "desc");
    expect(mockLimit).toHaveBeenCalledWith(50);
  });
});
