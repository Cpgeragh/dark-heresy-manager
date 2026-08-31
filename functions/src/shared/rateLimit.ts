// functions/src/shared/rateLimit.ts
//
// Shared server-side rate limiting for protected callables.
// Firestore-backed rolling window: attempts are timestamped and filtered
// to the live window on every check, inside a transaction so concurrent
// calls can't both slip through past the limit.

import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

const RATE_LIMITS_COLLECTION = "rateLimits";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export async function enforceRateLimit({ key, limit, windowMs }: RateLimitOptions): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(RATE_LIMITS_COLLECTION).doc(key);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const now = Date.now();
    const existing =
      (snapshot.exists ? (snapshot.data()?.attempts as number[] | undefined) : undefined) ?? [];
    const recent = existing.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= limit) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many attempts. Please wait before trying again."
      );
    }

    recent.push(now);
    transaction.set(ref, { attempts: recent });
  }, { maxAttempts: 5 });
}
