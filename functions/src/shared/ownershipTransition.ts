// functions/src/shared/ownershipTransition.ts
//
// Stage 3.3: the character-ownership + claim-log writes shared by release,
// force-assign, and force-release. Each caller does its own permission
// check and its own fresh-inside-transaction precondition check; this only
// bundles the write shape once that's verified.

import { FieldValue } from "firebase-admin/firestore";
import type { Transaction, DocumentReference } from "firebase-admin/firestore";
import { buildClaimLogPayload, type ClaimLogAction } from "./claimLog.js";

export function applyOwnershipTransition(
  transaction: Transaction,
  characterRef: DocumentReference,
  campaignRef: DocumentReference | null,
  action: ClaimLogAction,
  actorUid: string,
  previousOwnerUid: string | null,
  newOwnerUid: string | null
): void {
  transaction.update(characterRef, {
    userId: newOwnerUid,
    isEditableByPlayer: newOwnerUid !== null,
  });
  if (newOwnerUid !== null && campaignRef) {
    transaction.update(campaignRef, { memberIds: FieldValue.arrayUnion(newOwnerUid) });
  }
  transaction.set(
    characterRef.collection("claimLog").doc(),
    buildClaimLogPayload(action, actorUid, previousOwnerUid, newOwnerUid)
  );
}
