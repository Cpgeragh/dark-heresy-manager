import { act, renderHook } from "@testing-library/react";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
} from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useDocumentSubscription,
  useQuerySubscription,
} from "../../src/hooks/useFirestoreSubscription";

const { mockOnSnapshot } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

interface CapturedSubscription {
  onNext: (snapshot: unknown) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}

interface TestItem {
  id: string;
  value: string;
}

const subscriptions: CapturedSubscription[] = [];

function makeDocumentReference(path: string): DocumentReference<DocumentData> {
  return { path } as DocumentReference<DocumentData>;
}

function makeQuery(key: string): Query<DocumentData> {
  return { key } as unknown as Query<DocumentData>;
}

function makeDocumentSnapshot(data: DocumentData | null): DocumentSnapshot<DocumentData> {
  return {
    exists: () => data !== null,
    data: () => data ?? {},
  } as DocumentSnapshot<DocumentData>;
}

function makeQuerySnapshot(items: TestItem[]): QuerySnapshot<DocumentData> {
  return {
    docs: items.map((item) => ({
      id: item.id,
      data: () => ({ value: item.value }),
    })),
  } as unknown as QuerySnapshot<DocumentData>;
}

function mapQuerySnapshot(snapshot: QuerySnapshot<DocumentData>): TestItem[] {
  return snapshot.docs.map((itemDocument) => ({
    id: itemDocument.id,
    value: itemDocument.data().value as string,
  }));
}

beforeEach(() => {
  subscriptions.length = 0;
  mockOnSnapshot.mockReset();
  mockOnSnapshot.mockImplementation(
    (_source: unknown, onNext: (snapshot: unknown) => void, onError: (error: Error) => void) => {
      const subscription: CapturedSubscription = {
        onNext,
        onError,
        unsubscribe: vi.fn(),
      };
      subscriptions.push(subscription);
      return subscription.unsubscribe;
    }
  );
});

describe("useDocumentSubscription", () => {
  it("returns the empty disabled state for a missing reference", () => {
    const { result } = renderHook(() =>
      useDocumentSubscription<DocumentData, TestItem>(null, () => null)
    );

    expect(result.current).toEqual({ data: null, loading: false, error: null });
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("maps a successful document snapshot", () => {
    const reference = makeDocumentReference("campaigns/alpha");
    const { result } = renderHook(() =>
      useDocumentSubscription<DocumentData, TestItem>(reference, (snapshot) =>
        snapshot.exists() ? { id: "alpha", value: snapshot.data().value as string } : null
      )
    );

    expect(result.current).toEqual({ data: null, loading: true, error: null });

    act(() => {
      subscriptions[0].onNext(makeDocumentSnapshot({ value: "Campaign Alpha" }));
    });

    expect(result.current).toEqual({
      data: { id: "alpha", value: "Campaign Alpha" },
      loading: false,
      error: null,
    });
  });

  it("clears data and exposes snapshot errors", () => {
    const reference = makeDocumentReference("campaigns/alpha");
    const failure = new Error("permission-denied");
    const { result } = renderHook(() =>
      useDocumentSubscription<DocumentData, TestItem>(reference, () => ({
        id: "alpha",
        value: "Campaign Alpha",
      }))
    );

    act(() => {
      subscriptions[0].onNext(makeDocumentSnapshot({ value: "Campaign Alpha" }));
    });
    act(() => {
      subscriptions[0].onError(failure);
    });

    expect(result.current).toEqual({ data: null, loading: false, error: failure });
  });

  it("unsubscribes when the consumer unmounts", () => {
    const reference = makeDocumentReference("campaigns/alpha");
    const { unmount } = renderHook(() =>
      useDocumentSubscription<DocumentData, TestItem>(reference, () => null)
    );

    const { unsubscribe } = subscriptions[0];
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe("useQuerySubscription", () => {
  it("returns the empty disabled state for a missing query", () => {
    const { result } = renderHook(() =>
      useQuerySubscription<DocumentData, TestItem>(null, null, mapQuerySnapshot)
    );

    expect(result.current).toEqual({ data: [], loading: false, error: null });
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("activates only when enabled and cleans up when disabled again", () => {
    const sourceQuery = makeQuery("alpha");
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useQuerySubscription(
          enabled ? sourceQuery : null,
          enabled ? "campaigns:alpha" : null,
          mapQuerySnapshot
        ),
      { initialProps: { enabled: false } }
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current).toEqual({ data: [], loading: false, error: null });

    rerender({ enabled: true });
    expect(mockOnSnapshot).toHaveBeenCalledOnce();
    expect(result.current).toEqual({ data: [], loading: true, error: null });

    const { unsubscribe } = subscriptions[0];
    rerender({ enabled: false });

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(result.current).toEqual({ data: [], loading: false, error: null });
  });

  it("unsubscribes an active query when its consumer unmounts", () => {
    const { unmount } = renderHook(() =>
      useQuerySubscription(makeQuery("alpha"), "campaigns:alpha", mapQuerySnapshot)
    );

    const { unsubscribe } = subscriptions[0];
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("maps a successful query snapshot", () => {
    const sourceQuery = makeQuery("alpha");
    const { result } = renderHook(() =>
      useQuerySubscription(sourceQuery, "campaigns:alpha", mapQuerySnapshot)
    );

    act(() => {
      subscriptions[0].onNext(
        makeQuerySnapshot([
          { id: "one", value: "First" },
          { id: "two", value: "Second" },
        ])
      );
    });

    expect(result.current).toEqual({
      data: [
        { id: "one", value: "First" },
        { id: "two", value: "Second" },
      ],
      loading: false,
      error: null,
    });
  });

  it("restarts cleanly when the query key changes and ignores the old listener", () => {
    const queries = {
      alpha: makeQuery("alpha"),
      beta: makeQuery("beta"),
    };
    const { result, rerender } = renderHook(
      ({ queryId }: { queryId: keyof typeof queries }) =>
        useQuerySubscription(queries[queryId], `campaigns:${queryId}`, mapQuerySnapshot),
      { initialProps: { queryId: "alpha" } as { queryId: keyof typeof queries } }
    );

    act(() => {
      subscriptions[0].onNext(makeQuerySnapshot([{ id: "one", value: "Alpha" }]));
    });
    expect(result.current.data).toEqual([{ id: "one", value: "Alpha" }]);

    const firstSubscription = subscriptions[0];
    rerender({ queryId: "beta" });

    expect(firstSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(result.current).toEqual({ data: [], loading: true, error: null });

    act(() => {
      firstSubscription.onNext(makeQuerySnapshot([{ id: "stale", value: "Stale" }]));
    });
    expect(result.current).toEqual({ data: [], loading: true, error: null });

    act(() => {
      subscriptions[1].onNext(makeQuerySnapshot([{ id: "two", value: "Beta" }]));
    });
    expect(result.current).toEqual({
      data: [{ id: "two", value: "Beta" }],
      loading: false,
      error: null,
    });
  });
});
