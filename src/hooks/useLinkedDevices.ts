import {
  collection,
  limit,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import type { LinkedDevice } from "../services/deviceLinkService";
import { useQuerySubscription } from "./useFirestoreSubscription";

/** One bounded live list for the linked account, started before Settings opens. */
export function useLinkedDevices(accountId: string | null, currentUid: string | null) {
  const active = !!accountId && !!currentUid;
  const { data, loading, error } = useQuerySubscription<DocumentData, LinkedDevice>(
    active
      ? query(
          collection(db, "userLinks"),
          where("primaryUid", "==", accountId),
          limit(PRODUCT_LIMITS.linkedDevicesPerQuery)
        )
      : null,
    active ? `linked-devices:${accountId}:${currentUid}` : null,
    (snapshot) =>
      snapshot.docs
        .map((link) => {
          const item = link.data();
          const linkedAt = item.linkedAt as Timestamp | undefined;
          return {
            uid: link.id,
            name: typeof item.name === "string" && item.name.trim() ? item.name : null,
            linkedAt: linkedAt?.toMillis?.() ?? null,
            isCurrentDevice: link.id === currentUid,
          };
        })
        .sort(
          (left, right) =>
            Number(right.isCurrentDevice) - Number(left.isCurrentDevice) ||
            (right.linkedAt ?? 0) - (left.linkedAt ?? 0) ||
            left.uid.localeCompare(right.uid)
        )
  );
  return { devices: active ? data : null, loading, error };
}
