import { useEffect, useSyncExternalStore } from "react";
import { readXpHistoryStore, type XpHistorySnapshot } from "./xpHistoryStore";

const EMPTY_SNAPSHOT: XpHistorySnapshot = { entries: [], error: null };
const subscribeToNothing = () => () => undefined;
const getEmptySnapshot = () => EMPTY_SNAPSHOT;

export function useXpHistory(campaignId: string | null, characterId: string | null) {
  const store = campaignId && characterId ? readXpHistoryStore(campaignId, characterId) : null;

  useEffect(() => store?.retain(), [store]);

  const { entries, error } = useSyncExternalStore(
    store ? store.subscribe : subscribeToNothing,
    store ? () => store.snapshot : getEmptySnapshot
  );
  return { entries, error };
}
