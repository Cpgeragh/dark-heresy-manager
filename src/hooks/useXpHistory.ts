import { collection, limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import { validateXpHistoryPayload, xpHistoryDate, type XpHistoryEntry } from "../utils/xpHistory";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useXpHistory(campaignId: string | null, characterId: string | null) {
  const active = campaignId && characterId;
  const {
    data: entries,
    loading,
    error,
  } = useQuerySubscription(
    active
      ? query(
          collection(db, "campaigns", campaignId, "characters", characterId, "xpHistory"),
          orderBy("createdAt", "desc"),
          limit(FIRESTORE_QUERY_LIMITS.xpHistoryEntries)
        )
      : null,
    active ? `xp-history:${campaignId}:${characterId}` : null,
    (snapshot) => {
      const results: XpHistoryEntry[] = [];
      snapshot.forEach((historyDocument) => {
        const data = historyDocument.data();
        if (validateXpHistoryPayload(data)) results.push({ id: historyDocument.id, ...data });
      });
      return results.sort((left, right) => {
        const timeDifference =
          (xpHistoryDate(right.createdAt)?.getTime() ?? 0) -
          (xpHistoryDate(left.createdAt)?.getTime() ?? 0);
        if (timeDifference !== 0) return timeDifference;
        if (left.source === "opening-balance") return 1;
        if (right.source === "opening-balance") return -1;
        return right.id.localeCompare(left.id);
      });
    }
  );
  return { entries, loading, error };
}
