// functions/src/shared/idempotency.ts
//
// Stage 3.1: shared idempotency/replay protection for protected callables.
// A client-supplied key identifies one logical attempt at an operation. A
// key already recorded as completed returns its original result instead of
// re-running the handler; a key still in progress is rejected rather than
// run twice concurrently. A failed attempt clears its record so a genuine
// retry can proceed.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const IDEMPOTENCY_COLLECTION = "idempotencyKeys";

export async function withIdempotency<T>(key: string, handler: () => Promise<T>): Promise<T> {
  const db = getFirestore();
  const ref = db.collection(IDEMPOTENCY_COLLECTION).doc(key);

  const claim = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (snapshot.exists) {
      const status = snapshot.data()?.status as string | undefined;
      if (status === "completed") {
        return { alreadyCompleted: true, result: snapshot.data()?.result as T };
      }
      throw new HttpsError("aborted", "This request is already being processed.");
    }

    transaction.set(ref, { status: "in-progress", startedAt: Date.now() });
    return { alreadyCompleted: false, result: undefined as T };
  });

  if (claim.alreadyCompleted) {
    return claim.result;
  }

  try {
    const result = await handler();
    await ref.set({ status: "completed", result: result ?? null, completedAt: Date.now() });
    return result;
  } catch (error) {
    await ref.delete();
    throw error;
  }
}
