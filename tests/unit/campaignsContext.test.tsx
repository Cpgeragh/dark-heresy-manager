// tests/unit/campaignsContext.test.tsx
//
// Tests for CampaignsProvider, which runs two parallel Firestore listeners:
//   1. campaigns where dmId == uid
//   2. campaigns where memberIds array-contains uid

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { CampaignsProvider, useCampaignsContext } from "../../src/context/CampaignsContext";
import type { CampaignWithId } from "../../src/types/Firestore";

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockOnSnapshot, mockWhere, mockQuery, mockUnsubscribeDm, mockUnsubscribePlayer } =
  vi.hoisted(() => ({
    mockOnSnapshot: vi.fn(),
    mockWhere: vi.fn(() => "where-clause"),
    mockQuery: vi.fn(() => "query-ref"),
    mockUnsubscribeDm: vi.fn(),
    mockUnsubscribePlayer: vi.fn(),
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

let capturedDmOnNext: SnapshotCallback | null = null;
let capturedDmOnError: ErrorCallback | null = null;
let capturedPlayerOnNext: SnapshotCallback | null = null;
let capturedPlayerOnError: ErrorCallback | null = null;

function makeDoc(id: string, data: object) {
  return { data: () => ({ id, ...data }) };
}

function makeWrapper(uid: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <CampaignsProvider uid={uid}>{children}</CampaignsProvider>;
  };
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  capturedDmOnNext = null;
  capturedDmOnError = null;
  capturedPlayerOnNext = null;
  capturedPlayerOnError = null;

  // First call → DM listener, second call → player listener
  let callCount = 0;
  mockOnSnapshot.mockImplementation(
    (_query: unknown, onNext: SnapshotCallback, onError: ErrorCallback) => {
      callCount++;
      if (callCount === 1) {
        capturedDmOnNext = onNext;
        capturedDmOnError = onError;
        return mockUnsubscribeDm;
      } else {
        capturedPlayerOnNext = onNext;
        capturedPlayerOnError = onError;
        return mockUnsubscribePlayer;
      }
    }
  );
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CampaignsProvider — initial state", () => {
  it("starts with loading: true, empty lists, and no error", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.dmCampaigns).toEqual([]);
    expect(result.current.playerCampaigns).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe("CampaignsProvider — Firestore queries", () => {
  it("queries by dmId == uid for the DM listener", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-dm") });
    expect(mockWhere).toHaveBeenCalledWith("dmId", "==", "uid-dm");
  });

  it("queries by memberIds array-contains uid for the player listener", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-p") });
    expect(mockWhere).toHaveBeenCalledWith("memberIds", "array-contains", "uid-p");
  });

  it("filters out archived campaigns in both queries", () => {
    renderHook(() => useCampaignsContext(), { wrapper: makeWrapper("uid-1") });
    const archivedCalls = mockWhere.mock.calls.filter(
      (call) => call[0] === "archivedAt"
    );
    expect(archivedCalls).toHaveLength(2);
  });
});

describe("CampaignsProvider — snapshot handling", () => {
  it("populates dmCampaigns when the DM snapshot fires", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    act(() => {
      capturedDmOnNext!({
        docs: [
          makeDoc("c1", { name: "Campaign Alpha" }),
          makeDoc("c2", { name: "Campaign Beta" }),
        ],
      });
    });

    expect(result.current.dmCampaigns).toHaveLength(2);
    expect((result.current.dmCampaigns[0] as CampaignWithId).id).toBe("c1");
    expect(result.current.playerCampaigns).toEqual([]);
  });

  it("populates playerCampaigns when the player snapshot fires", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    act(() => {
      capturedPlayerOnNext!({
        docs: [makeDoc("p1", { name: "Player Campaign" })],
      });
    });

    expect(result.current.playerCampaigns).toHaveLength(1);
    expect((result.current.playerCampaigns[0] as CampaignWithId).id).toBe("p1");
    expect(result.current.dmCampaigns).toEqual([]);
  });

  it("clears loading only after both snapshots have fired", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    // Only DM snapshot fires
    act(() => { capturedDmOnNext!({ docs: [] }); });
    expect(result.current.loading).toBe(true); // player still pending

    // Player snapshot fires
    act(() => { capturedPlayerOnNext!({ docs: [] }); });
    expect(result.current.loading).toBe(false);
  });

  it("sets dmCampaigns to empty when DM snapshot has no docs", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });
    act(() => { capturedDmOnNext!({ docs: [] }); });
    expect(result.current.dmCampaigns).toEqual([]);
  });

  it("updates dmCampaigns when a second DM snapshot fires", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    act(() => { capturedDmOnNext!({ docs: [makeDoc("c1", { name: "Alpha" })] }); });
    expect(result.current.dmCampaigns).toHaveLength(1);

    act(() => {
      capturedDmOnNext!({
        docs: [makeDoc("c1", { name: "Alpha" }), makeDoc("c2", { name: "Beta" })],
      });
    });
    expect(result.current.dmCampaigns).toHaveLength(2);
  });
});

describe("CampaignsProvider — error handling", () => {
  it("sets error and clears loading when the DM listener throws", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    act(() => { capturedDmOnError!(new Error("permission-denied")); });

    expect(result.current.error).toMatch(/failed to load/i);
    expect(result.current.dmCampaigns).toEqual([]);
  });

  it("sets error and clears loading when the player listener throws", () => {
    const { result } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    act(() => { capturedPlayerOnError!(new Error("permission-denied")); });

    expect(result.current.error).toMatch(/failed to load/i);
    expect(result.current.playerCampaigns).toEqual([]);
  });
});

describe("CampaignsProvider — cleanup", () => {
  it("calls both unsubscribes when the component unmounts", () => {
    const { unmount } = renderHook(() => useCampaignsContext(), {
      wrapper: makeWrapper("uid-1"),
    });

    expect(mockUnsubscribeDm).not.toHaveBeenCalled();
    expect(mockUnsubscribePlayer).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribeDm).toHaveBeenCalledOnce();
    expect(mockUnsubscribePlayer).toHaveBeenCalledOnce();
  });
});
