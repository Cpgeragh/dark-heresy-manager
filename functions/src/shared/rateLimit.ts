// functions/src/shared/rateLimit.ts
//
// Shared server-side rate limiting for protected callables.
// Firestore-backed rolling window: attempts are timestamped and filtered
// to the live window on every check, inside a transaction so concurrent
// calls can't both slip through past the limit.

import { getFirestore, type Firestore, type Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const RATE_LIMITS_COLLECTION = "rateLimits";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  rejectionMessage?: string;
  rejectionDetails?: unknown;
}

/**
 * Reads and validates a rate limit inside an existing transaction, then
 * returns the write step. The caller decides when to apply it, allowing the
 * rate-limit record and the protected operation to commit atomically.
 */
export async function prepareRateLimit(
  db: Firestore,
  transaction: Transaction,
  {
    key,
    limit,
    windowMs,
    rejectionMessage = "Too many attempts. Please wait before trying again.",
    rejectionDetails,
  }: RateLimitOptions
): Promise<() => void> {
  const ref = db.collection(RATE_LIMITS_COLLECTION).doc(key);
  const snapshot = await transaction.get(ref);
  const now = Date.now();
  const existing =
    (snapshot.exists ? (snapshot.data()?.attempts as number[] | undefined) : undefined) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    throw new HttpsError("resource-exhausted", rejectionMessage, rejectionDetails);
  }

  recent.push(now);
  return () => transaction.set(ref, { attempts: recent });
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<void> {
  const db = getFirestore();
  await db.runTransaction(
    async (transaction) => {
      const applyRateLimit = await prepareRateLimit(db, transaction, options);
      applyRateLimit();
    },
    { maxAttempts: 5 }
  );
}
