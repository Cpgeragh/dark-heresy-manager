import type {
  Firestore,
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";

export interface DeviceCountResult {
  count: number;
  wasRecounted: boolean;
}

/** Older accounts acquire a count on their next link change. Every writer uses
 * the account document in its transaction, so concurrent changes retry. */
export async function readDeviceCount(
  db: Firestore,
  transaction: Transaction,
  accountId: string,
  accountSnapshot: DocumentSnapshot
): Promise<DeviceCountResult> {
  const stored = accountSnapshot.data()?.deviceCount;
  if (Number.isSafeInteger(stored) && stored >= 0) return { count: stored, wasRecounted: false };
  const links = await transaction.get(
    db.collection("userLinks").where("primaryUid", "==", accountId)
  );
  return { count: links.size, wasRecounted: true };
}

export function writeDeviceCount(
  transaction: Transaction,
  accountRef: DocumentReference,
  count: number
): void {
  transaction.set(accountRef, { deviceCount: count }, { merge: true });
}

/** Best-effort save for a freshly recounted account whose request is about to
 * be rejected, so the next attempt doesn't have to recount from scratch. */
export function persistRecountOnRejection(db: Firestore, accountId: string, count: number): void {
  void db
    .collection("accounts")
    .doc(accountId)
    .set({ deviceCount: count }, { merge: true })
    .catch(() => {});
}
