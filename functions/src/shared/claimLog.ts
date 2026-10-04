// functions/src/shared/claimLog.ts
//
// Server-side claim-log entries. Every ownership transition (claim,
// release, force-assign, force-release) writes one of these as part of its
// atomic transaction.

import { FieldValue } from "firebase-admin/firestore";
import type { ClaimLogAction } from "shared-rules";

export function buildClaimLogPayload(
  action: ClaimLogAction,
  actorUid: string,
  previousOwnerUid: string | null,
  newOwnerUid: string | null
) {
  return {
    action,
    actorUid,
    previousOwnerUid,
    newOwnerUid,
    timestamp: FieldValue.serverTimestamp(),
  };
}
