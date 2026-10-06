import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { XP_HISTORY_RELEASE_MS } from "../constants/ui";
import { db } from "../firebase";
import { validateXpHistoryPayload, xpHistoryDate, type XpHistoryEntry } from "../utils/xpHistory";

export interface XpHistorySnapshot {
  entries: XpHistoryEntry[];
  error: Error | null;
}

export interface XpHistoryStore {
  snapshot: XpHistorySnapshot;
  settled: boolean;
  firstSnapshot: Promise<void>;
  subscribe: (listener: () => void) => () => void;
  retain: () => () => void;
}

const stores = new Map<string, XpHistoryStore>();

function sortEntries(entries: XpHistoryEntry[]): XpHistoryEntry[] {
  return entries.sort((left, right) => {
    const timeDifference =
      (xpHistoryDate(right.createdAt)?.getTime() ?? 0) -
      (xpHistoryDate(left.createdAt)?.getTime() ?? 0);
    if (timeDifference !== 0) return timeDifference;
    if (left.source === "opening-balance") return 1;
    if (right.source === "opening-balance") return -1;
    return right.id.localeCompare(left.id);
  });
}

function startStore(key: string, campaignId: string, characterId: string): XpHistoryStore {
  const listeners = new Set<() => void>();
  let resolveFirstSnapshot: () => void = () => undefined;
  const firstSnapshot = new Promise<void>((resolve) => {
    resolveFirstSnapshot = resolve;
  });
  let holders = 0;
  let releaseTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: Unsubscribe = () => undefined;

  const store: XpHistoryStore = {
    snapshot: { entries: [], error: null },
    settled: false,
    firstSnapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    retain: () => {
      holders += 1;
      if (releaseTimer !== null) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holders -= 1;
        if (holders === 0) scheduleRelease();
      };
    },
  };

  const publish = (snapshot: XpHistorySnapshot) => {
    store.snapshot = snapshot;
    if (!store.settled) {
      store.settled = true;
      resolveFirstSnapshot();
    }
    listeners.forEach((listener) => listener());
  };

  function scheduleRelease() {
    if (releaseTimer !== null) clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => {
      if (holders > 0) return;
      unsubscribe();
      stores.delete(key);
    }, XP_HISTORY_RELEASE_MS);
  }

  unsubscribe = onSnapshot(
    query(
      collection(db, "campaigns", campaignId, "characters", characterId, "xpHistory"),
      orderBy("createdAt", "desc"),
      limit(FIRESTORE_QUERY_LIMITS.xpHistoryEntries)
    ),
    (snapshot) => {
      const entries: XpHistoryEntry[] = [];
      snapshot.forEach((historyDocument) => {
        const data = historyDocument.data();
        if (validateXpHistoryPayload(data)) entries.push({ id: historyDocument.id, ...data });
      });
      publish({ entries: sortEntries(entries), error: null });
    },
    (error) => {
      publish({ entries: [], error: error instanceof Error ? error : new Error(String(error)) });
    }
  );

  scheduleRelease();
  stores.set(key, store);
  return store;
}

/** Returns the live history store, throwing until its first answer has arrived so a transition can wait. */
export function readXpHistoryStore(campaignId: string, characterId: string): XpHistoryStore {
  const key = `${campaignId}:${characterId}`;
  const store = stores.get(key) ?? startStore(key, campaignId, characterId);
  if (!store.settled) throw store.firstSnapshot;
  return store;
}
