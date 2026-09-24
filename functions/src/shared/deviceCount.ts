import type {
  Firestore,
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";

/** Older accounts acquire a count on their next link change. Every writer uses
 * the account document in its transaction, so concurrent changes retry. */
export async function readDeviceCount(
  db: Firestore,
  transaction: Transaction,
  accountId: string,
  accountSnapshot: DocumentSnapshot
): Promise<number> {
  const stored = accountSnapshot.data()?.deviceCount;
  if (Number.isSafeInteger(stored) && stored >= 0) return stored;
  const links = await transaction.get(
    db.collection("userLinks").where("primaryUid", "==", accountId)
  );
  return links.size;
}

export function writeDeviceCount(
  transaction: Transaction,
  accountRef: DocumentReference,
  accountSnapshot: DocumentSnapshot,
  count: number
): void {
  transaction.set(
    accountRef,
    { deviceCount: count, ...(accountSnapshot.exists ? {} : { status: "active" }) },
    { merge: true }
  );
}
