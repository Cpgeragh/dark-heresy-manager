// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "history-collection"),
  limit: vi.fn(() => "limit"),
  orderBy: vi.fn(() => "order"),
  query: vi.fn(() => "history-query"),
  onSnapshot: (...args: unknown[]) => firestore.onSnapshot(...args),
}));
vi.mock("../../src/firebase", () => ({ db: {} }));
vi.mock("../../src/utils/xpHistory", async () => {
  const actual = await vi.importActual<typeof import("../../src/utils/xpHistory")>(
    "../../src/utils/xpHistory"
  );
  return { ...actual, validateXpHistoryPayload: () => true };
});

import { XP_HISTORY_RELEASE_MS } from "../../src/constants/ui";
import { useXpHistory } from "../../src/hooks/useXpHistory";
import { readXpHistoryStore } from "../../src/hooks/xpHistoryStore";

type SnapshotHandler = (snapshot: unknown) => void;
type ErrorHandler = (error: unknown) => void;

let handlers: { next: SnapshotHandler; error: ErrorHandler };
let characterNumber = 0;

function snapshotOf(entries: { id: string; amountXp: number; createdAt: Date }[]) {
  return {
    forEach: (callback: (document: { id: string; data: () => unknown }) => void) =>
      entries.forEach((entry) =>
        callback({
          id: entry.id,
          data: () => ({ amountXp: entry.amountXp, createdAt: entry.createdAt }),
        })
      ),
  };
}

function freshCharacterId() {
  characterNumber += 1;
  return `character-${characterNumber}`;
}

beforeEach(() => {
  firestore.onSnapshot.mockReset();
  firestore.unsubscribe.mockReset();
  firestore.onSnapshot.mockImplementation(
    (_query: unknown, next: SnapshotHandler, error: ErrorHandler) => {
      handlers = { next, error };
      return firestore.unsubscribe;
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("readXpHistoryStore", () => {
  it("waits for the first answer by throwing a promise that settles when it arrives", async () => {
    const characterId = freshCharacterId();
    let thrown: unknown;
    try {
      readXpHistoryStore("campaign-1", characterId);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Promise);

    handlers.next(snapshotOf([]));
    await thrown;

    expect(readXpHistoryStore("campaign-1", characterId).snapshot.entries).toEqual([]);
  });

  it("sorts entries newest first and keeps one listener per character", () => {
    const characterId = freshCharacterId();
    expect(() => readXpHistoryStore("campaign-1", characterId)).toThrow();
    handlers.next(
      snapshotOf([
        { id: "old", amountXp: 10, createdAt: new Date("2026-01-01T00:00:00Z") },
        { id: "new", amountXp: 20, createdAt: new Date("2026-02-01T00:00:00Z") },
      ])
    );

    const store = readXpHistoryStore("campaign-1", characterId);
    readXpHistoryStore("campaign-1", characterId);

    expect(store.snapshot.entries.map((entry) => entry.id)).toEqual(["new", "old"]);
    expect(firestore.onSnapshot).toHaveBeenCalledTimes(1);
  });

  it("settles with the error when the listener fails", () => {
    const characterId = freshCharacterId();
    expect(() => readXpHistoryStore("campaign-1", characterId)).toThrow();
    handlers.error(new Error("permission-denied"));

    const store = readXpHistoryStore("campaign-1", characterId);
    expect(store.snapshot.error?.message).toBe("permission-denied");
    expect(store.snapshot.entries).toEqual([]);
  });

  it("tells subscribers about live updates", () => {
    const characterId = freshCharacterId();
    expect(() => readXpHistoryStore("campaign-1", characterId)).toThrow();
    handlers.next(snapshotOf([]));
    const store = readXpHistoryStore("campaign-1", characterId);
    const listener = vi.fn();
    store.subscribe(listener);

    handlers.next(snapshotOf([{ id: "a", amountXp: 5, createdAt: new Date() }]));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.snapshot.entries).toHaveLength(1);
  });

  it("releases its listener after nobody has used it for the release delay", () => {
    vi.useFakeTimers();
    const characterId = freshCharacterId();
    expect(() => readXpHistoryStore("campaign-1", characterId)).toThrow();
    handlers.next(snapshotOf([]));

    vi.advanceTimersByTime(XP_HISTORY_RELEASE_MS - 1);
    expect(firestore.unsubscribe).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(firestore.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("keeps its listener while retained and releases it after the last holder leaves", () => {
    vi.useFakeTimers();
    const characterId = freshCharacterId();
    expect(() => readXpHistoryStore("campaign-1", characterId)).toThrow();
    handlers.next(snapshotOf([]));
    const store = readXpHistoryStore("campaign-1", characterId);

    const release = store.retain();
    vi.advanceTimersByTime(XP_HISTORY_RELEASE_MS * 3);
    expect(firestore.unsubscribe).not.toHaveBeenCalled();

    release();
    vi.advanceTimersByTime(XP_HISTORY_RELEASE_MS);
    expect(firestore.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("useXpHistory", () => {
  function Probe({ characterId }: { characterId: string }) {
    const { entries, error } = useXpHistory("campaign-1", characterId);
    return (
      <div>
        {error ? `error ${error.message}` : `entries ${entries.map((entry) => entry.id).join(",")}`}
      </div>
    );
  }

  it("suspends until the first answer, then shows entries and follows live updates", async () => {
    const characterId = freshCharacterId();
    render(
      <Suspense fallback={<div>waiting</div>}>
        <Probe characterId={characterId} />
      </Suspense>
    );

    expect(screen.getByText("waiting")).toBeInTheDocument();

    await act(async () => {
      handlers.next(snapshotOf([{ id: "first", amountXp: 1, createdAt: new Date() }]));
    });
    expect(screen.getByText("entries first")).toBeInTheDocument();

    await act(async () => {
      handlers.next(
        snapshotOf([
          { id: "first", amountXp: 1, createdAt: new Date("2026-01-01T00:00:00Z") },
          { id: "second", amountXp: 2, createdAt: new Date("2026-03-01T00:00:00Z") },
        ])
      );
    });
    expect(screen.getByText("entries second,first")).toBeInTheDocument();
  });

  it("returns an empty history without reading anything when the ids are missing", () => {
    function EmptyProbe() {
      const { entries } = useXpHistory(null, null);
      return <div>{`count ${entries.length}`}</div>;
    }
    render(<EmptyProbe />);

    expect(screen.getByText("count 0")).toBeInTheDocument();
    expect(firestore.onSnapshot).not.toHaveBeenCalled();
  });
});
