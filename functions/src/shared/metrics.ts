// functions/src/shared/metrics.ts
//
// Shared feature-usage metrics for protected callables. A simple
// per-feature invocation counter, durable and queryable locally via
// Firestore. Real Cloud Monitoring integration is future billing-
// protection work, once the project is actually on Blaze.

import { getFirestore, FieldValue } from "firebase-admin/firestore";

const USAGE_METRICS_COLLECTION = "usageMetrics";

export async function recordUsageMetric(feature: string): Promise<void> {
  const db = getFirestore();
  await db
    .collection(USAGE_METRICS_COLLECTION)
    .doc(feature)
    .set({ count: FieldValue.increment(1), lastUsedAt: Date.now() }, { merge: true });
}
