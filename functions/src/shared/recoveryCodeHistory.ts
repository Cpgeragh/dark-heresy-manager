// functions/src/shared/recoveryCodeHistory.ts
//
// A pure audit trail of Recovery Code lifecycle events, kept
// separate from recoveryIndex (the collection actually used for lookup) so
// a bug in this logging path can never affect what a code resolves to.
// Never stores the code or its hash — a dead code has nothing left worth
// keeping a trace of, this is purely "when did this change happen."

import { FieldValue } from "firebase-admin/firestore";

export const RECOVERY_CODE_HISTORY_COLLECTION = "recoveryCodeHistory";

export type RecoveryCodeHistoryStatus = "rotated" | "revoked";

export function buildRecoveryCodeHistoryPayload(status: RecoveryCodeHistoryStatus) {
  return {
    status,
    timestamp: FieldValue.serverTimestamp(),
  };
}
