// tests/unit/campaignsContext.test.tsx
//
// Tests the CampaignsProvider component, which owns the Firestore subscription
// logic that was previously inside useCampaignsForUser.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { CampaignsProvider, useCampaignsContext } from "../../src/context/CampaignsContext";
import type { CampaignWithId } from "../../src/types/Firestore";

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockOnSnapshot, mockWhere, mockQuery, mockUnsubscribe } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
  mockWhere: vi.fn(() => "where-clause"),
  mockQuery: vi.fn(() => "query-ref"),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("../../src/firebase/converters", () => ({
  campaignsCollectionRef: vi.fn(() => "campaigns-ref"),
}));

vi.mock("firebase/firestore", () => ({
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

type SnapshotCallback = (snap: { docs: { data: () => object }[] }) => void;
type ErrorCallback = (err: Error) => void;

let capturedOnNext: SnapshotCallback | null = null;
let capturedOnError: ErrorCallback | null = null;

function makeDoc(id: string, data: object) {
  return { data: () => ({ id, ...data }) };
}

function makeWrapper(uid: string, role: "dm" | "player") {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CampaignsProvider uid={uid} role={role}>
        {children}
      </CampaignsProvider>
    );
  };
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnNext = null;
  capturedOnError = null;

  mockOnSnapshot.mockImplementation((_query: unknown, onNext: SnapshotCallback, onError: ErrorCallback) => {
    capturedOnNext = onNext;
    capturedOnError = onError;
    return mockUnsubscribe;
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CampaignsProvider — initial state", () => {
  it("starts with loading: true, empty campaigns, and no error", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe("CampaignsProvider — Firestore queries", () => {
  it("queries by dmId == uid for DM role", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-dm", "dm") });
    expect(mockWhere).toHaveBeenCalledWith("dmId", "==", "uid-dm");
  });

  it("queries by memberIds array-contains uid for player role", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-p", "player") });
    expect(mockWhere).toHaveBeenCalledWith("memberIds", "array-contains", "uid-p");
  });

  it("filters out archived campaigns from the query", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-1", "dm") });
    expect(mockWhere).toHaveBeenCalledWith("archivedAt", "==", null);
  });
});

describe("CampaignsProvider — snapshot handling", () => {
  it("populates campaigns and sets loading: false when snapshot fires", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    act(() => {
      capturedOnNext!({
        docs: [
          makeDoc("c1", { name: "Campaign Alpha" }),
          makeDoc("c2", { name: "Campaign Beta" }),
        ],
      });
    });

    expect(result.current.campaigns).toHaveLength(2);
    expect((result.current.campaigns[0] as CampaignWithId).id).toBe("c1");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets campaigns to empty array when snapshot has no docs", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    act(() => {
      capturedOnNext!({ docs: [] });
    });

    expect(result.current.campaigns).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("updates campaigns when a second snapshot fires", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    act(() => {
      capturedOnNext!({ docs: [makeDoc("c1", { name: "Alpha" })] });
    });
    expect(result.current.campaigns).toHaveLength(1);

    act(() => {
      capturedOnNext!({
        docs: [makeDoc("c1", { name: "Alpha" }), makeDoc("c2", { name: "Beta" })],
      });
    });
    expect(result.current.campaigns).toHaveLength(2);
  });
});

describe("CampaignsProvider — error handling", () => {
  it("sets error message and clears loading when Firestore throws", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    act(() => {
      capturedOnError!(new Error("permission-denied"));
    });

    expect(result.current.error).toMatch(/failed to load/i);
    expect(result.current.loading).toBe(false);
    expect(result.current.campaigns).toEqual([]);
  });
});

describe("CampaignsProvider — cleanup", () => {
  it("calls unsubscribe when the component unmounts", () => {
    const { unmount } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1", "dm"),
    });

    expect(mockUnsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
